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
exports.UpdateSessionProxyDto = exports.SessionProxyResponseDto = void 0;
exports.projectSessionProxy = projectSessionProxy;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const max_code_points_1 = require("../../../common/validation/max-code-points");
const has_decodable_proxy_credentials_validator_1 = require("./has-decodable-proxy-credentials.validator");
const PROTOCOL_TO_PROXY_TYPE = {
    'http:': 'http',
    'https:': 'https',
    'socks4:': 'socks4',
    'socks5:': 'socks5',
};
function proxyTypeFromProtocol(protocol) {
    return PROTOCOL_TO_PROXY_TYPE[protocol] ?? null;
}
class SessionProxyResponseDto {
    enabled;
    proxyType;
    proxyHost;
    hasCredentials;
}
exports.SessionProxyResponseDto = SessionProxyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a proxy URL is configured for this session', example: true }),
    __metadata("design:type", Boolean)
], SessionProxyResponseDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Proxy protocol derived from the stored URL scheme; `null` when no proxy is set',
        enum: ['http', 'https', 'socks4', 'socks5', null],
        nullable: true,
        example: 'http',
    }),
    __metadata("design:type", Object)
], SessionProxyResponseDto.prototype, "proxyType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Proxy host:port parsed from the stored URL — credentials are never returned',
        type: String,
        nullable: true,
        example: 'proxy.example.com:8080',
    }),
    __metadata("design:type", Object)
], SessionProxyResponseDto.prototype, "proxyHost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the stored proxy URL embeds username/password credentials',
        example: false,
    }),
    __metadata("design:type", Boolean)
], SessionProxyResponseDto.prototype, "hasCredentials", void 0);
class UpdateSessionProxyDto {
    proxyUrl;
}
exports.UpdateSessionProxyDto = UpdateSessionProxyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Per-session egress proxy URL (http/https/socks4/socks5; credentialed form allowed). Send ' +
            '`null` to clear the proxy. Must be a real, reachable proxy — an unreachable value blocks the ' +
            'WhatsApp WebSocket (no QR is delivered). On whatsapp-web.js the session start then times out ' +
            '(~30s); on Baileys the start succeeds and the session keeps retrying the connection.',
        type: String,
        nullable: true,
        maxLength: 255,
        example: 'http://user:pass@proxy.example.com:8080',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, max_code_points_1.MaxCodePoints)(255),
    (0, class_validator_1.IsUrl)({
        protocols: ['http', 'https', 'socks4', 'socks5'],
        require_protocol: true,
        require_tld: false,
        allow_underscores: true,
    }, { message: 'proxyUrl must be a valid http(s)/socks4/socks5 URL' }),
    (0, class_validator_1.Validate)(has_decodable_proxy_credentials_validator_1.HasDecodableProxyCredentialsConstraint),
    __metadata("design:type", Object)
], UpdateSessionProxyDto.prototype, "proxyUrl", void 0);
function projectSessionProxy(session) {
    if (!session.proxyUrl) {
        return { enabled: false, proxyType: null, proxyHost: null, hasCredentials: false };
    }
    try {
        const parsed = new URL(session.proxyUrl);
        return {
            enabled: true,
            proxyType: proxyTypeFromProtocol(parsed.protocol),
            proxyHost: parsed.host,
            hasCredentials: !!(parsed.username || parsed.password),
        };
    }
    catch {
        return {
            enabled: true,
            proxyType: null,
            proxyHost: null,
            hasCredentials: false,
        };
    }
}
//# sourceMappingURL=session-proxy.dto.js.map