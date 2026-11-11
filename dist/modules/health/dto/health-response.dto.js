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
exports.ReadinessResponseDto = exports.LivenessResponseDto = exports.HealthCheckResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class HealthCheckResponseDto {
    status;
    timestamp;
    version;
}
exports.HealthCheckResponseDto = HealthCheckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Liveness marker. This route does not probe dependencies.', example: 'ok' }),
    __metadata("design:type", String)
], HealthCheckResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp of the reply.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], HealthCheckResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Running application version. Included only when the request carries a valid API key.',
        example: '0.14.4',
    }),
    __metadata("design:type", String)
], HealthCheckResponseDto.prototype, "version", void 0);
class LivenessResponseDto {
    status;
}
exports.LivenessResponseDto = LivenessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always `ok` when the process can answer at all.', example: 'ok' }),
    __metadata("design:type", String)
], LivenessResponseDto.prototype, "status", void 0);
class ReadinessResponseDto {
    status;
    details;
}
exports.ReadinessResponseDto = ReadinessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Only `ok` reaches a 200 — a failing dependency answers 503 with this same shape.',
        example: 'ok',
    }),
    __metadata("design:type", String)
], ReadinessResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Per-dependency outcome, keyed by dependency name. Present on both the 200 and the 503.',
        example: { mainDatabase: { status: 'up' }, dataDatabase: { status: 'up' } },
        additionalProperties: { type: 'object' },
    }),
    __metadata("design:type", Object)
], ReadinessResponseDto.prototype, "details", void 0);
//# sourceMappingURL=health-response.dto.js.map