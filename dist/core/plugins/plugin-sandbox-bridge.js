"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginSandboxBridge = void 0;
const path = __importStar(require("path"));
const hooks_1 = require("../hooks");
const plugin_interfaces_1 = require("./plugin.interfaces");
const plugin_activation_1 = require("./plugin-activation");
const capability_router_1 = require("./sandbox/capability-router");
const handover_gate_1 = require("./handover-gate");
const sandbox_log_meta_1 = require("./sandbox-log-meta");
const webhook_subscribe_util_1 = require("./webhook-subscribe.util");
const search_provider_registration_util_1 = require("./search-provider-registration.util");
const integration_constants_1 = require("../../modules/integration/integration.constants");
const SANDBOX_HOOK_TIMEOUT_MS = 5000;
const SANDBOX_HEALTH_TIMEOUT_MS = 5000;
const SANDBOX_SEARCH_TIMEOUT_MS = 10000;
const SANDBOX_LIFECYCLE_TIMEOUT_MS = 30000;
const SANDBOX_HOOK_ERROR_LOG_INTERVAL_MS = 60000;
const SANDBOX_LOG_MAX_PER_WINDOW = 200;
const SANDBOX_LOG_WINDOW_MS = 10000;
const SANDBOX_LOG_MAX_MESSAGE_LENGTH = 8192;
class PluginSandboxBridge {
    logger;
    hookManager;
    capabilities;
    hostServices;
    configService;
    pluginStorage;
    plugins;
    sandboxHosts;
    lastSandboxHookError;
    pluginsDir;
    createHost;
    resolvePluginMainPath;
    constructor(logger, hookManager, capabilities, hostServices, configService, pluginStorage, plugins, sandboxHosts, lastSandboxHookError, pluginsDir, createHost, resolvePluginMainPath) {
        this.logger = logger;
        this.hookManager = hookManager;
        this.capabilities = capabilities;
        this.hostServices = hostServices;
        this.configService = configService;
        this.pluginStorage = pluginStorage;
        this.plugins = plugins;
        this.sandboxHosts = sandboxHosts;
        this.lastSandboxHookError = lastSandboxHookError;
        this.pluginsDir = pluginsDir;
        this.createHost = createHost;
        this.resolvePluginMainPath = resolvePluginMainPath;
    }
    recordSandboxHookError(pluginId, event, error, rateLimit, action = 'sandbox_hook_error') {
        this.lastSandboxHookError.set(pluginId, { event, error, at: new Date() });
        const now = Date.now();
        const key = `${action}:${event}`;
        const state = rateLimit.get(key);
        if (state && now - state.lastAt < SANDBOX_HOOK_ERROR_LOG_INTERVAL_MS) {
            state.suppressed++;
            return;
        }
        const suppressed = state?.suppressed ?? 0;
        rateLimit.set(key, { lastAt: now, suppressed: 0 });
        this.logger.warn(`Sandboxed plugin ${pluginId} hook '${event}' handler failed: ${error}`, {
            pluginId,
            event,
            action,
            ...(suppressed > 0 ? { suppressed } : {}),
        });
    }
    async checkPluginHealth(pluginId) {
        const sandboxHost = this.sandboxHosts.get(pluginId);
        if (sandboxHost) {
            const result = await sandboxHost.healthCheck(SANDBOX_HEALTH_TIMEOUT_MS);
            const lastError = this.lastSandboxHookError.get(pluginId);
            if (!lastError)
                return result;
            const note = `last hook error in '${lastError.event}' at ${lastError.at.toISOString()}: ${lastError.error}`;
            return { healthy: result.healthy, message: result.message ? `${result.message}; ${note}` : note };
        }
        const plugin = this.plugins.get(pluginId);
        if (plugin && !plugin.builtIn) {
            const message = plugin.status === plugin_interfaces_1.PluginStatus.ERROR && plugin.error
                ? plugin.error
                : `plugin is not running (status ${plugin.status})`;
            return { healthy: false, message };
        }
        if (plugin?.instance?.healthCheck) {
            return plugin.instance.healthCheck();
        }
        return { healthy: true, message: 'Plugin does not implement health check' };
    }
    async dispatchWebhookForInstance(d) {
        const host = this.sandboxHosts.get(d.pluginId);
        if (!host) {
            throw new Error('no live sandbox host for plugin ' + d.pluginId);
        }
        const plugin = this.plugins.get(d.pluginId);
        const route = plugin?.manifest.ingress?.find(candidate => candidate.route === d.route);
        const verified = !!route && (d.payload.admission?.verified ?? route.signature.scheme !== 'none');
        const instance = await this.hostServices.getPluginInstancePort().resolve(d.pluginId, d.instanceId);
        if (!instance || instance.enabled === false) {
            throw new Error('instance ' + d.instanceId + ' of plugin ' + d.pluginId + ' is disabled or deleted');
        }
        if ((0, plugin_activation_1.sessionScopeKey)(instance.sessionScope) !== (0, plugin_activation_1.sessionScopeKey)(d.sessionId)) {
            throw new Error('instance ' + d.instanceId + ' of plugin ' + d.pluginId + ' was rebound since this delivery');
        }
        const scopeIsAttributable = await this.scopeHasAtMostOneInstance(d.pluginId, instance?.sessionScope ?? undefined);
        const config = plugin
            ? (0, plugin_activation_1.resolveInstanceConfig)(scopeIsAttributable
                ? (0, plugin_activation_1.resolvePluginConfig)(plugin.config, plugin.sessionConfig, instance?.sessionScope ?? undefined, plugin.manifest.sessionScoped !== false, plugin.manifest)
                : plugin.config, instance?.config, plugin.manifest, plugin.config)
            : undefined;
        const result = await host.dispatchWebhook({
            instanceId: d.instanceId,
            route: d.route,
            method: d.method ?? 'POST',
            headers: d.payload.headers,
            query: d.payload.query,
            body: d.payload.body,
            rawBody: d.payload.rawBody,
            verified,
            deliveryId: d.deliveryId,
            sessionId: d.sessionId,
            config,
            timeoutMs: integration_constants_1.INGRESS_DISPATCH_TIMEOUT_MS,
        });
        if (!result.ok) {
            throw new Error(result.error ?? 'ingress dispatch failed with status ' + result.status);
        }
    }
    async scopeHasAtMostOneInstance(pluginId, scope) {
        if (!scope)
            return false;
        try {
            const rows = await this.hostServices.getPluginInstancePort().list(pluginId);
            return rows.filter(row => row.enabled && row.sessionScope === scope).length <= 1;
        }
        catch (error) {
            this.logger.warn('Could not count instances on the scope; withholding the per-session config slice', {
                pluginId,
                scope,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async enableSandboxed(pluginId, plugin) {
        this.lastSandboxHookError.delete(pluginId);
        const packageDir = plugin.packageDir ?? path.join(this.pluginsDir, pluginId);
        const mainPath = this.resolvePluginMainPath(path.dirname(packageDir), path.basename(packageDir), plugin.manifest.main);
        const context = this.capabilities.createPluginContext(plugin);
        const onHookSubscribe = this.buildHookSubscribeHandler(pluginId, plugin);
        const onWebhookSubscribe = (0, webhook_subscribe_util_1.makeOnWebhookSubscribe)({
            pluginId,
            declaredRoutes: new Set((plugin.manifest.ingress ?? []).map(r => r.route)),
            hasPermission: (plugin.manifest.permissions ?? []).includes(plugin_interfaces_1.PluginCapabilityPermission.WEBHOOK_INGRESS),
            warn: (message, meta) => this.logger.warn(message, meta),
        });
        const logRelayState = { windowStart: Date.now(), count: 0, dropped: 0 };
        const onLog = this.buildLogRelay(pluginId, context, logRelayState);
        const onSearchProviderRegister = this.buildSearchProviderRegistrar(pluginId, plugin);
        const onWorkerExit = this.buildWorkerExitHandler(pluginId, logRelayState, () => host);
        const onUnresponsive = () => {
            if (this.sandboxHosts.get(pluginId) !== host)
                return;
            this.markWorkerFailed(pluginId, 'worker unresponsive: event loop blocked past the liveness probe');
            this.logger.warn(`Sandboxed plugin ${pluginId} worker is unresponsive; terminating it`, {
                pluginId,
                action: 'sandbox_worker_unresponsive',
            });
            void host.terminate().catch(() => undefined);
        };
        const host = this.createHost((verb, args) => (0, capability_router_1.dispatchCapabilityVerb)(context, verb, args), onHookSubscribe, onWebhookSubscribe, onLog, (events, run) => this.hookManager.runInFlight(events, run), onSearchProviderRegister, onWorkerExit, onUnresponsive);
        this.sandboxHosts.set(pluginId, host);
        const loadedConfig = plugin.config;
        try {
            await host.load(mainPath, { pluginId, config: loadedConfig }, SANDBOX_LIFECYCLE_TIMEOUT_MS);
            await host.runLifecycle('onLoad', SANDBOX_LIFECYCLE_TIMEOUT_MS);
            await host.runLifecycle('onEnable', SANDBOX_LIFECYCLE_TIMEOUT_MS);
        }
        catch (error) {
            this.sandboxHosts.delete(pluginId);
            (0, search_provider_registration_util_1.unregisterPluginSearchProvider)(this.hostServices.getSearchRegistryPort(), pluginId);
            await host.terminate().catch(() => undefined);
            throw error;
        }
        if (plugin.config !== loadedConfig)
            host.sendConfigChange(plugin.config);
    }
    async teardownSandboxed(pluginId, host, opts) {
        try {
            await host.runLifecycle('onDisable', SANDBOX_LIFECYCLE_TIMEOUT_MS);
        }
        catch (error) {
            this.logger.warn(`Sandboxed plugin ${pluginId} onDisable failed during disable; terminating anyway`, {
                pluginId,
                action: 'sandbox_disable_lifecycle_failed',
                error: error instanceof Error ? error.message : String(error),
            });
        }
        if (opts?.unload) {
            try {
                await host.runLifecycle('onUnload', SANDBOX_LIFECYCLE_TIMEOUT_MS);
            }
            catch (error) {
                this.logger.warn(`Sandboxed plugin ${pluginId} onUnload failed during unload; terminating anyway`, {
                    pluginId,
                    action: 'sandbox_unload_lifecycle_failed',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        await host.terminate().catch(() => undefined);
        this.sandboxHosts.delete(pluginId);
    }
    buildHookSubscribeHandler(pluginId, plugin) {
        const subscribedEvents = new Map();
        let unknownEventWarned = false;
        return (event, rawPriority) => {
            if (!(0, hooks_1.isKnownHookEvent)(event)) {
                if (!unknownEventWarned) {
                    unknownEventWarned = true;
                    this.logger.warn(`Sandboxed plugin ${pluginId} subscribed to an unknown hook event; ignoring`, {
                        pluginId,
                        event,
                        action: 'sandbox_unknown_hook_event',
                    });
                }
                return;
            }
            const priority = (0, hooks_1.normalizeHookPriority)(rawPriority);
            const existing = subscribedEvents.get(event);
            if (existing) {
                if (priority < existing.priority) {
                    this.hookManager.setPriority(existing.hookId, priority);
                    existing.priority = priority;
                }
                return;
            }
            if (subscribedEvents.size >= hooks_1.KNOWN_HOOK_EVENTS.size)
                return;
            const hookErrorLogState = new Map();
            const hookId = this.hookManager.register(pluginId, event, async (hookCtx) => {
                const liveHost = this.sandboxHosts.get(pluginId);
                if (!liveHost)
                    return { continue: true };
                if (!(0, plugin_activation_1.isPluginActiveForSession)(plugin.manifest.sessionScoped ?? true, plugin.activeSessions ?? ['*'], hookCtx.sessionId))
                    return { continue: true };
                if (event === 'message:received') {
                    try {
                        const chatId = hookCtx.data?.chatId;
                        if (chatId && hookCtx.sessionId) {
                            const handover = await this.hostServices
                                .getConversationMappingPort()
                                .findHandoverForChat(hookCtx.sessionId, chatId);
                            if (!(0, handover_gate_1.shouldDispatchToPlugin)(handover, pluginId))
                                return { continue: true };
                        }
                    }
                    catch (error) {
                        this.logger.debug(`Handover gate lookup failed for plugin ${pluginId}; dispatching normally`, {
                            pluginId,
                            event,
                            error: error instanceof Error ? error.message : String(error),
                            action: 'handover_gate_fail_open',
                        });
                    }
                }
                return liveHost
                    .dispatchHook({
                    event,
                    data: hookCtx.data,
                    sessionId: hookCtx.sessionId,
                    source: hookCtx.source,
                    config: (0, plugin_activation_1.resolvePluginConfig)(plugin.config, plugin.sessionConfig, hookCtx.sessionId, plugin.manifest.sessionScoped !== false, plugin.manifest),
                    inFlight: this.hookManager.currentInFlight(),
                    timeoutMs: SANDBOX_HOOK_TIMEOUT_MS,
                    onTimeout: () => this.recordSandboxHookError(pluginId, event, `timed out after ${SANDBOX_HOOK_TIMEOUT_MS}ms`, hookErrorLogState, 'sandbox_hook_timeout'),
                })
                    .then(result => {
                    if (result.error)
                        this.recordSandboxHookError(pluginId, event, result.error, hookErrorLogState);
                    return { continue: result.continue, data: result.data };
                });
            }, priority);
            subscribedEvents.set(event, { hookId, priority });
        };
    }
    buildLogRelay(pluginId, context, state) {
        return (level, message, meta) => {
            const now = Date.now();
            if (now - state.windowStart >= SANDBOX_LOG_WINDOW_MS) {
                if (state.dropped > 0) {
                    this.logger.warn(`Dropped ${state.dropped} log messages from sandboxed plugin ${pluginId} (log relay rate limit)`, { pluginId, action: 'sandbox_log_relay_dropped', dropped: state.dropped });
                }
                state.windowStart = now;
                state.count = 0;
                state.dropped = 0;
            }
            state.count++;
            if (state.count > SANDBOX_LOG_MAX_PER_WINDOW) {
                state.dropped++;
                return;
            }
            const truncate = (value) => value.length > SANDBOX_LOG_MAX_MESSAGE_LENGTH
                ? `${value.slice(0, SANDBOX_LOG_MAX_MESSAGE_LENGTH)}…[truncated]`
                : value;
            const bounded = truncate(typeof message === 'string' ? message : '[non-string log message]');
            let boundedMeta = meta;
            if (meta !== undefined) {
                const reason = typeof meta?.error === 'string' ? { error: truncate(meta.error) } : undefined;
                if ((0, sandbox_log_meta_1.countMetaValues)(meta, SANDBOX_LOG_MAX_MESSAGE_LENGTH) > SANDBOX_LOG_MAX_MESSAGE_LENGTH) {
                    boundedMeta = { ...reason, metaTruncated: true };
                }
                else {
                    try {
                        const metaLength = ((0, sandbox_log_meta_1.metaText)(meta) ?? '').length;
                        if (metaLength > SANDBOX_LOG_MAX_MESSAGE_LENGTH)
                            boundedMeta = { ...reason, metaTruncated: true, metaLength };
                    }
                    catch {
                        boundedMeta = reason;
                    }
                }
            }
            if (level === 'error')
                context.logger.error(bounded, undefined, boundedMeta);
            else if (level === 'debug' || level === 'warn')
                context.logger[level](bounded, boundedMeta);
            else
                context.logger.log(bounded, boundedMeta);
        };
    }
    buildSearchProviderRegistrar(pluginId, plugin) {
        return () => {
            const liveHost = this.sandboxHosts.get(pluginId);
            if (!liveHost)
                return;
            (0, search_provider_registration_util_1.registerPluginSearchProvider)({
                pluginId,
                label: `${plugin.manifest.name} (plugin)`,
                transport: liveHost,
                timeoutMs: SANDBOX_SEARCH_TIMEOUT_MS,
                registry: this.hostServices.getSearchRegistryPort(),
                mode: this.configService.get('search.provider', 'auto'),
                hasPermission: (plugin.manifest.permissions ?? []).includes(plugin_interfaces_1.PluginCapabilityPermission.SEARCH_PROVIDE),
                warn: (message, meta) => this.logger.warn(message, meta),
            });
        };
    }
    markWorkerFailed(pluginId, reason) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.status = plugin_interfaces_1.PluginStatus.ERROR;
            plugin.error = reason;
            this.pluginStorage.setPluginStatus(pluginId, plugin_interfaces_1.PluginStatus.ERROR);
        }
        this.hookManager.unregisterPlugin(pluginId);
        this.sandboxHosts.delete(pluginId);
    }
    buildWorkerExitHandler(pluginId, logRelayState, getSourceHost) {
        return (code, intentional, reason) => {
            if (logRelayState.dropped > 0) {
                this.logger.warn(`Dropped ${logRelayState.dropped} log messages from sandboxed plugin ${pluginId} (log relay rate limit)`, { pluginId, action: 'sandbox_log_relay_dropped', dropped: logRelayState.dropped });
                logRelayState.dropped = 0;
            }
            const currentHost = this.sandboxHosts.get(pluginId);
            if (currentHost && currentHost !== getSourceHost())
                return;
            (0, search_provider_registration_util_1.unregisterPluginSearchProvider)(this.hostServices.getSearchRegistryPort(), pluginId);
            if (intentional)
                return;
            const why = reason ? `: ${reason}` : '';
            this.markWorkerFailed(pluginId, `worker exited unexpectedly (code ${code})${why}`);
            this.logger.warn(`Sandboxed plugin ${pluginId} worker exited unexpectedly (code ${code})${why}`, {
                pluginId,
                code,
                action: 'sandbox_worker_exit',
            });
        };
    }
}
exports.PluginSandboxBridge = PluginSandboxBridge;
//# sourceMappingURL=plugin-sandbox-bridge.js.map