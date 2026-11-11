"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = exports.STATS_STALE_MAX_MS = exports.STATS_READ_TIMEOUT_MS = exports.QUEUE_READ_TIMEOUT_MS = exports.METRICS_RENDER_TTL_MS = void 0;
const node_perf_hooks_1 = require("node:perf_hooks");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const queue_names_1 = require("../queue/queue-names");
const redis_connection_1 = require("../queue/redis-connection");
const constantTimeEqual_1 = require("../../common/security/constantTimeEqual");
const ip_1 = require("../../common/utils/ip");
const ws_rate_limit_1 = require("../events/ws-rate-limit");
const stats_service_1 = require("../stats/stats.service");
const webhook_delivery_metrics_1 = require("../../common/metrics/webhook-delivery-metrics");
const session_reconnect_metrics_1 = require("../../common/metrics/session-reconnect-metrics");
const session_restriction_metrics_1 = require("../../common/metrics/session-restriction-metrics");
const send_pacing_metrics_1 = require("../../common/metrics/send-pacing-metrics");
const request_metrics_1 = require("../../common/metrics/request-metrics");
const process_error_metrics_1 = require("../../common/metrics/process-error-metrics");
const logger_service_1 = require("../../common/services/logger.service");
exports.METRICS_RENDER_TTL_MS = 5000;
exports.QUEUE_READ_TIMEOUT_MS = 2000;
exports.STATS_READ_TIMEOUT_MS = 2000;
exports.STATS_STALE_MAX_MS = 5 * 60_000;
const QUEUE_JOB_STATES = ['wait', 'active', 'delayed', 'failed'];
const LOOP_DELAY_RESOLUTION_MS = 20;
const LOOP_DELAY_FLOOR_NS = LOOP_DELAY_RESOLUTION_MS * 1e6;
let MetricsService = class MetricsService {
    config;
    statsService;
    webhookQueue;
    ingressQueue;
    logger = (0, logger_service_1.createLogger)('MetricsService');
    cachedRender = null;
    pendingOverview = null;
    pendingSince = 0;
    lastOverview = null;
    readSeq = 0;
    keptSeq = 0;
    failedScrapeLimiter = new ws_rate_limit_1.SlidingWindowLimiter(10, 60_000);
    loopDelay = (0, node_perf_hooks_1.createHistogram)();
    lastTick = node_perf_hooks_1.performance.now();
    loopSampler = setInterval(() => {
        const now = node_perf_hooks_1.performance.now();
        this.loopDelay.record(Math.max(1, Math.round((now - this.lastTick) * 1e6)));
        this.lastTick = now;
    }, LOOP_DELAY_RESOLUTION_MS).unref();
    constructor(config, statsService, webhookQueue, ingressQueue) {
        this.config = config;
        this.statsService = statsService;
        this.webhookQueue = webhookQueue;
        this.ingressQueue = ingressQueue;
    }
    onModuleDestroy() {
        clearInterval(this.loopSampler);
    }
    get token() {
        return (this.config.get('METRICS_TOKEN') ?? '').trim();
    }
    assertScrapeAuthorized(authorizationHeader, client) {
        const expected = this.token;
        if (!expected) {
            throw new common_1.NotFoundException('Metrics endpoint is disabled (set METRICS_TOKEN to enable)');
        }
        const subject = client
            ? (0, ip_1.limiterKeyForIp)((0, ip_1.resolveClientIp)(client, this.config.get('security.trustedProxies') ?? []))
            : '';
        if (!this.failedScrapeLimiter.allow(subject)) {
            throw new common_1.HttpException('Too many failed metrics token attempts', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const provided = (authorizationHeader ?? '').replace(/^Bearer\s+/i, '').trim();
        if (!provided || !(0, constantTimeEqual_1.constantTimeEqual)(provided, expected)) {
            throw new common_1.UnauthorizedException('Invalid metrics token');
        }
        this.failedScrapeLimiter.refund(subject);
    }
    async render() {
        const now = Date.now();
        if (this.cachedRender && now - this.cachedRender.at < exports.METRICS_RENDER_TTL_MS) {
            return this.cachedRender.text;
        }
        const [overview, queueCounts] = await Promise.all([this.readOverviewOrNull(), this.readQueueCounts()]);
        const mem = process.memoryUsage();
        const lines = [];
        const gauge = (name, help, value, labels = '') => {
            lines.push(`# HELP ${name} ${help}`);
            lines.push(`# TYPE ${name} gauge`);
            lines.push(`${name}${labels} ${value}`);
        };
        gauge('openwa_up', 'Whether the OpenWA process is up (always 1 when scraped).', 1);
        gauge('openwa_process_uptime_seconds', 'Process uptime in seconds.', Math.round(process.uptime()));
        gauge('openwa_process_resident_memory_bytes', 'Resident set size in bytes.', mem.rss);
        gauge('openwa_process_heap_used_bytes', 'V8 heap used in bytes.', mem.heapUsed);
        gauge('openwa_event_loop_delay_p99_seconds', 'p99 event-loop delay since the previous uncached scrape, in seconds.', Math.max(0, this.loopDelay.percentile(99) - LOOP_DELAY_FLOOR_NS) / 1e9);
        gauge('openwa_event_loop_delay_max_seconds', 'Maximum event-loop delay since the previous uncached scrape, in seconds.', Math.max(0, this.loopDelay.max - LOOP_DELAY_FLOOR_NS) / 1e9);
        this.loopDelay.reset();
        const rejections = (0, process_error_metrics_1.getUnhandledRejections)();
        lines.push('# HELP openwa_unhandled_rejections_total Promise rejections that reached the process-level handler since process start.');
        lines.push('# TYPE openwa_unhandled_rejections_total counter');
        lines.push(`openwa_unhandled_rejections_total{kind="other"} ${rejections.other}`);
        lines.push(`openwa_unhandled_rejections_total{kind="page_context_lost"} ${rejections.page_context_lost}`);
        if (queueCounts.length > 0) {
            lines.push('# HELP openwa_queue_jobs Jobs in each BullMQ queue by state (cluster-wide).');
            lines.push('# TYPE openwa_queue_jobs gauge');
            for (const [name, counts] of queueCounts) {
                for (const state of QUEUE_JOB_STATES) {
                    lines.push(`openwa_queue_jobs{queue="${name}",state="${state}"} ${counts[state] ?? 0}`);
                }
            }
        }
        gauge('openwa_stats_available', 'Whether the database-derived series below could be read (1) or not (0); they can trail the database by STATS_CACHE_TTL_MS + 5 s, or up to 5 min while a read runs late.', overview ? 1 : 0);
        if (overview) {
            gauge('openwa_sessions_total', 'Total number of configured sessions.', overview.sessions.total);
            gauge('openwa_sessions_active', 'Number of READY (active) sessions.', overview.sessions.active);
            lines.push('# HELP openwa_sessions Number of sessions by status.');
            lines.push('# TYPE openwa_sessions gauge');
            for (const [status, count] of Object.entries(overview.sessions.byStatus)) {
                lines.push(`openwa_sessions{status="${this.escapeLabel(status)}"} ${count}`);
            }
            lines.push('# HELP openwa_messages_total Current stored messages by direction.');
            lines.push('# TYPE openwa_messages_total gauge');
            lines.push(`openwa_messages_total{direction="outgoing"} ${overview.messages.sent}`);
            lines.push(`openwa_messages_total{direction="incoming"} ${overview.messages.received}`);
            lines.push('# HELP openwa_messages_failed_total Current stored messages in FAILED state.');
            lines.push('# TYPE openwa_messages_failed_total gauge');
            lines.push(`openwa_messages_failed_total ${overview.messages.failed}`);
        }
        lines.push('# HELP openwa_webhook_delivery_failures_total Webhook delivery failures recorded since process start: retries exhausted, never sent (shed, refused at shutdown, rejected before sending, or an opt-in event dropped past the bound of its webhook), or stopped by shutdown between direct retries.');
        lines.push('# TYPE openwa_webhook_delivery_failures_total counter');
        lines.push(`openwa_webhook_delivery_failures_total ${(0, webhook_delivery_metrics_1.getWebhookDeliveryFailuresTotal)()}`);
        lines.push('# HELP openwa_session_reconnect_attempts_total Reconnect attempts scheduled across all sessions since process start.');
        lines.push('# TYPE openwa_session_reconnect_attempts_total counter');
        lines.push(`openwa_session_reconnect_attempts_total ${(0, session_reconnect_metrics_1.getSessionReconnectAttemptsTotal)()}`);
        lines.push('# HELP openwa_session_reconnect_loop_alerts_total Reconnect-loop alerts emitted since process start.');
        lines.push('# TYPE openwa_session_reconnect_loop_alerts_total counter');
        lines.push(`openwa_session_reconnect_loop_alerts_total ${(0, session_reconnect_metrics_1.getSessionReconnectLoopAlertsTotal)()}`);
        lines.push('# HELP openwa_sessions_restricted Sessions whose account WhatsApp is currently restricting.');
        lines.push('# TYPE openwa_sessions_restricted gauge');
        lines.push(`openwa_sessions_restricted ${(0, session_restriction_metrics_1.getRestrictedSessionCount)()}`);
        const refusals = (0, send_pacing_metrics_1.getSendPacingRefusals)();
        if (refusals.size > 0) {
            lines.push('# HELP openwa_send_pacing_refusals_total Sends refused by the pacing governor since process start.');
            lines.push('# TYPE openwa_send_pacing_refusals_total counter');
            for (const [reason, count] of refusals) {
                lines.push(`openwa_send_pacing_refusals_total{reason="${this.escapeLabel(reason)}"} ${count}`);
            }
        }
        lines.push(...(0, request_metrics_1.renderHttpRequestMetrics)());
        const text = lines.join('\n') + '\n';
        this.cachedRender = { at: now, text };
        return text;
    }
    readOverviewOrNull() {
        const now = Date.now();
        if (this.pendingOverview) {
            const waited = now - this.pendingSince;
            if (waited < exports.STATS_READ_TIMEOUT_MS)
                return this.pendingOverview;
            if (waited < exports.STATS_STALE_MAX_MS)
                return Promise.resolve(this.recentOverview());
            this.logger.warn('Metrics scrape gave up on a statistics read that never settled; starting a new one');
        }
        this.pendingSince = now;
        const seq = ++this.readSeq;
        const work = Promise.resolve().then(() => this.statsService.getOverview());
        const late = new Error('statistics read timed out');
        let timer;
        const waiting = Promise.race([
            work,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(late), exports.STATS_READ_TIMEOUT_MS);
            }),
        ]).then(overview => {
            clearTimeout(timer);
            return overview;
        }, err => {
            clearTimeout(timer);
            const recent = err === late ? this.recentOverview() : null;
            this.logger.warn(`Metrics scrape could not read stats; ${recent ? 'serving the last result' : 'database-derived series omitted'}: ` +
                (err instanceof Error ? err.message : String(err)));
            return recent;
        });
        this.pendingOverview = waiting;
        const settled = (kept) => {
            if (seq > this.keptSeq) {
                this.keptSeq = seq;
                this.lastOverview = kept;
            }
            if (this.pendingOverview === waiting)
                this.pendingOverview = null;
        };
        void work.then(overview => settled({ overview, at: now }), () => settled(null));
        return waiting;
    }
    recentOverview() {
        const last = this.lastOverview;
        return last && Date.now() - last.at < exports.STATS_STALE_MAX_MS ? last.overview : null;
    }
    async readQueueCounts() {
        const queues = [
            [queue_names_1.QUEUE_NAMES.WEBHOOK, this.webhookQueue],
            [queue_names_1.QUEUE_NAMES.INGRESS, this.ingressQueue],
        ];
        const results = [];
        for (const [name, queue] of queues) {
            if (!queue)
                continue;
            let timer;
            try {
                const counts = await Promise.race([
                    (0, redis_connection_1.producerReady)(queue).then(() => queue.getJobCounts(...QUEUE_JOB_STATES)),
                    new Promise((_, reject) => {
                        timer = setTimeout(() => reject(new Error('timed out')), exports.QUEUE_READ_TIMEOUT_MS);
                    }),
                ]);
                results.push([name, counts]);
            }
            catch (err) {
                this.logger.warn(`Metrics scrape could not read ${name} job counts; series omitted: ${err instanceof Error ? err.message : String(err)}`);
            }
            finally {
                clearTimeout(timer);
            }
        }
        return results;
    }
    escapeLabel(value) {
        return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.WEBHOOK)),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, bullmq_1.InjectQueue)(queue_names_1.QUEUE_NAMES.INGRESS)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        stats_service_1.StatsService, Function, Function])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map