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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const max_code_points_1 = require("../../../common/validation/max-code-points");
const has_decodable_proxy_credentials_validator_1 = require("./has-decodable-proxy-credentials.validator");
const recognised_session_config_validator_1 = require("./recognised-session-config.validator");
class CreateSessionDto {
    name;
    config;
    proxyUrl;
    proxyType;
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique name for the session (alphanumeric and hyphens only)',
        example: 'my-bot',
        minLength: 3,
        maxLength: 50,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9-]+$/, {
        message: 'Session name can only contain letters, numbers, and hyphens',
    }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session configuration. Only three keys are read: autoRejectCalls (boolean, default false, ' +
            'Baileys engine only) rejects incoming calls as soon as they ring, and the call.received event is still emitted ' +
            'first; maxReconnectAttempts (0-20, default unlimited) caps consecutive reconnects (the count ' +
            'restarts once the session has stayed READY for 5 minutes) and ' +
            'reconnectBaseDelay (1000-300000 ms, default 5000) sets the backoff base, both for the ' +
            "gateway's own reconnect only (on Baileys the engine retries a transient drop itself, with a " +
            'fixed backoff and no cap). Anything else is ' +
            'stored but ignored. All three can be changed later with PATCH /api/sessions/{sessionId}/config ' +
            'without a restart: autoRejectCalls applies from the next incoming call, the two reconnect settings ' +
            'from the next session start.',
        example: { autoRejectCalls: false, maxReconnectAttempts: 5, reconnectBaseDelay: 5000 },
    }),
    (0, class_transformer_1.Transform)(({ value }) => (0, recognised_session_config_validator_1.normaliseSessionConfig)(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.Validate)(recognised_session_config_validator_1.RecognisedSessionConfigConstraint),
    __metadata("design:type", Object)
], CreateSessionDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional per-session egress proxy URL (http/https/socks4/socks5; credentialed form ' +
            '"http://user:pass@host" allowed). Must be a REAL, REACHABLE proxy — an unreachable value ' +
            'silently blocks the WhatsApp WebSocket (no QR is ever delivered). On whatsapp-web.js the session ' +
            'start then times out (~30s → 504 Gateway Timeout); on Baileys the start succeeds and the session ' +
            'keeps retrying the connection. Leave unset unless your network cannot reach WhatsApp directly. ' +
            'Setting it requires an ADMIN key (403 otherwise).',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, max_code_points_1.MaxCodePoints)(255),
    (0, class_validator_1.IsUrl)({
        protocols: ['http', 'https', 'socks4', 'socks5'],
        require_protocol: true,
        require_tld: false,
        allow_underscores: true,
    }, { message: 'proxyUrl must be a valid http(s)/socks4/socks5 URL' }),
    (0, class_validator_1.Validate)(has_decodable_proxy_credentials_validator_1.HasDecodableProxyCredentialsConstraint),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "proxyUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Deprecated and ignored: the proxyUrl scheme selects the proxy protocol. Accepted for compatibility.',
        enum: ['http', 'https', 'socks4', 'socks5'],
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['http', 'https', 'socks4', 'socks5']),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "proxyType", void 0);
//# sourceMappingURL=create-session.dto.js.map