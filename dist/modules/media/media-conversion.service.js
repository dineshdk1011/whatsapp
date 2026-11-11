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
exports.MediaConversionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const logger_service_1 = require("../../common/services/logger.service");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const session_entity_1 = require("../session/entities/session.entity");
const load_remote_media_1 = require("../../common/media/load-remote-media");
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const concurrency_limiter_1 = require("../../common/utils/concurrency-limiter");
const media_cap_util_1 = require("../message/media-cap.util");
const ffmpeg_1 = require("./ffmpeg");
const STALE_CONVERSION_DIR_MIN_AGE_MS = 60 * 60 * 1000;
let MediaConversionService = class MediaConversionService {
    configService;
    engines;
    sessionRepository;
    logger = (0, logger_service_1.createLogger)('MediaConversionService');
    binaryAvailable;
    ffmpegGate;
    shutdown = new AbortController();
    constructor(configService, engines, sessionRepository) {
        this.configService = configService;
        this.engines = engines;
        this.sessionRepository = sessionRepository;
        const concurrency = this.configService.get('mediaConversion.concurrency', 2);
        this.ffmpegGate = new concurrency_limiter_1.ConcurrencyLimiter(concurrency, concurrency * 4);
    }
    onModuleInit() {
        const timeoutMs = this.configService.get('mediaConversion.timeoutMs', 60_000);
        void (0, ffmpeg_1.removeStaleConversionDirs)(Math.max(STALE_CONVERSION_DIR_MIN_AGE_MS, 2 * timeoutMs), (message, error) => this.logger.warn(message, { error: String(error) }));
    }
    onApplicationShutdown() {
        this.shutdown.abort();
        this.ffmpegGate.close();
        (0, ffmpeg_1.killRunningConversions)();
    }
    async convertToVoice(sessionId, dto) {
        return this.convert(sessionId, dto, 'ogg', (0, ffmpeg_1.voiceEncodeArgs)(), 'audio/ogg; codecs=opus');
    }
    async convertToVideo(sessionId, dto) {
        return this.convert(sessionId, dto, 'mp4', (0, ffmpeg_1.videoEncodeArgs)(), 'video/mp4');
    }
    async isAvailable() {
        if (this.shutdown.signal.aborted || !this.configService.get('mediaConversion.enabled', false))
            return false;
        const available = await this.probeOnce();
        return available && !this.shutdown.signal.aborted;
    }
    async convert(sessionId, dto, outputExtension, encodeArgs, outputMimetype) {
        this.assertRunning();
        await this.assertAvailable();
        try {
            const { input, output } = await this.ffmpegGate.run(async () => {
                this.assertRunning();
                const loaded = await this.resolveInput(sessionId, dto);
                this.assertRunning();
                const converted = await (0, ffmpeg_1.runFfmpeg)(loaded, 'bin', outputExtension, encodeArgs, {
                    signal: this.shutdown.signal,
                    ffmpegPath: this.configService.get('mediaConversion.ffmpegPath', 'ffmpeg'),
                    timeoutMs: this.configService.get('mediaConversion.timeoutMs', 60_000),
                    maxOutputBytes: this.configService.get('mediaConversion.maxOutputBytes', 50 * 1024 * 1024),
                });
                return { input: loaded, output: converted };
            });
            this.logger.log('Media converted', { inputBytes: input.length, outputBytes: output.length, outputMimetype });
            return { base64: output.toString('base64'), mimetype: outputMimetype, bytes: output.length };
        }
        catch (error) {
            this.assertRunning();
            if (error instanceof Error && error.message === 'ConcurrencyLimiter queue full') {
                throw new common_1.ServiceUnavailableException('Media conversion is busy — retry shortly');
            }
            if (error instanceof ffmpeg_1.FfmpegSpawnError) {
                this.binaryAvailable = undefined;
                this.logger.warn('Media conversion could not start ffmpeg', { reason: error.message });
                throw new common_1.ServiceUnavailableException('Media conversion could not start the ffmpeg binary. Retry shortly, or check FFMPEG_PATH.');
            }
            if (error instanceof ffmpeg_1.FfmpegConversionError) {
                this.logger.warn('Media conversion failed', { reason: error.message, detail: error.detail });
                throw new common_1.BadRequestException(error.detail ? `${error.message}: ${error.detail}` : error.message);
            }
            throw error;
        }
    }
    async sessionProxy(sessionId) {
        if (this.engines.has(sessionId)) {
            return this.engines.proxyUrl(sessionId);
        }
        if (sessionId.includes('\0'))
            return undefined;
        const session = await this.sessionRepository.findOne({ where: { id: sessionId }, select: { proxyUrl: true } });
        return session?.proxyUrl ?? undefined;
    }
    async resolveInput(sessionId, dto) {
        const base64 = (0, media_cap_util_1.stripBase64DataUri)(dto.base64);
        if (base64) {
            (0, media_cap_util_1.assertBase64WithinMediaCap)(base64);
            const data = Buffer.from(base64, 'base64');
            if (data.length === 0)
                throw new common_1.BadRequestException('base64 did not decode to any bytes');
            return data;
        }
        if (dto.url) {
            const proxyUrl = await this.sessionProxy(sessionId);
            try {
                const { data } = await (0, load_remote_media_1.loadRemoteMediaBuffer)(dto.url, proxyUrl);
                return data;
            }
            catch (error) {
                if (error instanceof ssrf_guard_1.SsrfBlockedError) {
                    throw new common_1.BadRequestException(ssrf_guard_1.SSRF_BLOCKED_CLIENT_MESSAGE);
                }
                throw error;
            }
        }
        throw new common_1.BadRequestException('Either url or base64 must be provided');
    }
    assertRunning() {
        if (this.shutdown.signal.aborted) {
            throw new common_1.ServiceUnavailableException('Media conversion is shutting down');
        }
    }
    async assertAvailable() {
        if (!this.configService.get('mediaConversion.enabled', false)) {
            throw new common_1.ServiceUnavailableException('Media conversion is disabled. Set MEDIA_CONVERSION_ENABLED=true to enable it.');
        }
        if (!(await this.probeOnce())) {
            throw new common_1.ServiceUnavailableException('Media conversion is enabled but the ffmpeg binary could not be run. Install ffmpeg, or set FFMPEG_PATH.');
        }
    }
    probeOnce() {
        this.binaryAvailable ??= (0, ffmpeg_1.probeFfmpeg)(this.configService.get('mediaConversion.ffmpegPath', 'ffmpeg')).then(available => {
            if (!available) {
                this.binaryAvailable = undefined;
                this.logger.warn('Media conversion is enabled but ffmpeg could not be run');
            }
            return available;
        });
        return this.binaryAvailable;
    }
};
exports.MediaConversionService = MediaConversionService;
exports.MediaConversionService = MediaConversionService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        engine_registry_service_1.EngineRegistry,
        typeorm_2.Repository])
], MediaConversionService);
//# sourceMappingURL=media-conversion.service.js.map