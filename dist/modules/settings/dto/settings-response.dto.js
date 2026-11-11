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
exports.SettingsResponseDto = exports.SettingsNotificationsDto = exports.SettingsApiDto = exports.SettingsGeneralDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SettingsGeneralDto {
    apiBaseUrl;
    autoReconnect;
    debugMode;
}
exports.SettingsGeneralDto = SettingsGeneralDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The advertised base URL (BASE_URL), the same value the startup banner and ingress URLs use.',
        example: 'https://wa.example.com',
    }),
    __metadata("design:type", String)
], SettingsGeneralDto.prototype, "apiBaseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Always true: the engine auto-reconnects on a transient disconnect and there is no global off ' +
            'switch. Attempts are unlimited by default; cap them per session with config.maxReconnectAttempts ' +
            '(0-20, PATCH /api/sessions/{sessionId}/config). The cap bounds every reconnect on whatsapp-web.js; ' +
            'on Baileys it bounds only the reconnect after a logged-out close, and the engine retries a transient ' +
            'drop itself with no cap.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SettingsGeneralDto.prototype, "autoReconnect", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether database query logging is on.', example: false }),
    __metadata("design:type", Boolean)
], SettingsGeneralDto.prototype, "debugMode", void 0);
class SettingsApiDto {
    rateLimit;
    rateLimitWindow;
    enableDocs;
}
exports.SettingsApiDto = SettingsApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Requests allowed per window.', example: 100 }),
    __metadata("design:type", Number)
], SettingsApiDto.prototype, "rateLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Window length in milliseconds.', example: 60000 }),
    __metadata("design:type", Number)
], SettingsApiDto.prototype, "rateLimitWindow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether Swagger is actually served — off by default in production.', example: false }),
    __metadata("design:type", Boolean)
], SettingsApiDto.prototype, "enableDocs", void 0);
const NOTIFICATION_PLACEHOLDER = 'Fixed placeholder: no notification feature exists, and the value is not configurable.';
class SettingsNotificationsDto {
    emailEnabled;
    notificationEmail;
    webhookAlerts;
}
exports.SettingsNotificationsDto = SettingsNotificationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: `Always false. ${NOTIFICATION_PLACEHOLDER}`, example: false }),
    __metadata("design:type", Boolean)
], SettingsNotificationsDto.prototype, "emailEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: `Always empty. ${NOTIFICATION_PLACEHOLDER}`, example: '' }),
    __metadata("design:type", String)
], SettingsNotificationsDto.prototype, "notificationEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: `Always false. ${NOTIFICATION_PLACEHOLDER}`, example: false }),
    __metadata("design:type", Boolean)
], SettingsNotificationsDto.prototype, "webhookAlerts", void 0);
class SettingsResponseDto {
    general;
    api;
    notifications;
}
exports.SettingsResponseDto = SettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: SettingsGeneralDto }),
    __metadata("design:type", SettingsGeneralDto)
], SettingsResponseDto.prototype, "general", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SettingsApiDto }),
    __metadata("design:type", SettingsApiDto)
], SettingsResponseDto.prototype, "api", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SettingsNotificationsDto }),
    __metadata("design:type", SettingsNotificationsDto)
], SettingsResponseDto.prototype, "notifications", void 0);
//# sourceMappingURL=settings-response.dto.js.map