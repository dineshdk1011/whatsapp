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
exports.SessionConfigResponseDto = exports.UpdateSessionConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class UpdateSessionConfigDto {
    autoRejectCalls;
    maxReconnectAttempts;
    reconnectBaseDelay;
}
exports.UpdateSessionConfigDto = UpdateSessionConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Auto-reject every incoming call as soon as it rings. Baileys engine only: whatsapp-web.js cannot ' +
            'reject a call. The call.received event is still ' +
            'emitted first, so a webhook consumer sees the call regardless. Takes effect on the next ' +
            'incoming call, and the session is not restarted.',
        example: true,
        nullable: true,
        type: Boolean,
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], UpdateSessionConfigDto.prototype, "autoRejectCalls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cap on consecutive reconnect attempts (`0` disables reconnect entirely). Send `null` for ' +
            'unlimited, which is the default. Applies on the next session start, not to a reconnect ' +
            "sequence already in flight. Bounds the gateway's own reconnect, which is every reconnect on " +
            'whatsapp-web.js and, on Baileys, only the one after a logged-out close: the Baileys engine ' +
            'retries a transient drop itself, with a fixed 1s to 60s backoff and no cap.',
        minimum: 0,
        maximum: 20,
        example: 5,
        nullable: true,
        type: Number,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Object)
], UpdateSessionConfigDto.prototype, "maxReconnectAttempts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Base delay of the reconnect backoff in milliseconds. Applies on the next session start, ' +
            'not to a reconnect sequence already in flight. Same engine scope as `maxReconnectAttempts`: ' +
            "the Baileys engine's internal retry uses its own fixed backoff instead.",
        minimum: 1000,
        maximum: 300000,
        example: 5000,
        nullable: true,
        type: Number,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(300000),
    __metadata("design:type", Object)
], UpdateSessionConfigDto.prototype, "reconnectBaseDelay", void 0);
class SessionConfigResponseDto {
    autoRejectCalls;
    maxReconnectAttempts;
    reconnectBaseDelay;
}
exports.SessionConfigResponseDto = SessionConfigResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether incoming calls are auto-rejected (Baileys engine only)', example: false }),
    __metadata("design:type", Boolean)
], SessionConfigResponseDto.prototype, "autoRejectCalls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Reconnect attempt cap; `null` means unlimited. Bounds the gateway's own reconnect (every " +
            'reconnect on whatsapp-web.js; on Baileys only the one after a logged-out close).',
        example: 5,
        nullable: true,
        type: Number,
    }),
    __metadata("design:type", Object)
], SessionConfigResponseDto.prototype, "maxReconnectAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Base reconnect backoff in milliseconds, on the same engine scope as `maxReconnectAttempts`',
        example: 5000,
    }),
    __metadata("design:type", Number)
], SessionConfigResponseDto.prototype, "reconnectBaseDelay", void 0);
//# sourceMappingURL=session-config.dto.js.map