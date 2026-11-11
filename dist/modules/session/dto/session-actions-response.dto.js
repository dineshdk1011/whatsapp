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
exports.SessionsOverviewResponseDto = exports.SessionMemoryUsageDto = exports.SessionGroupSummaryDto = exports.SessionActionResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionActionResponseDto {
    success;
}
exports.SessionActionResponseDto = SessionActionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the engine applied the change. Routes where the engine can decline spell out what ' +
            '`false` means in their own description; on the rest it is always `true`.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SessionActionResponseDto.prototype, "success", void 0);
class SessionGroupSummaryDto {
    id;
    name;
    linkedParentJID;
}
exports.SessionGroupSummaryDto = SessionGroupSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group id.', example: '120363000000000000@g.us' }),
    __metadata("design:type", String)
], SessionGroupSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group subject.', example: 'Engineering' }),
    __metadata("design:type", String)
], SessionGroupSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'JID of the parent community, or null when the group is standalone.',
        example: null,
    }),
    __metadata("design:type", Object)
], SessionGroupSummaryDto.prototype, "linkedParentJID", void 0);
class SessionMemoryUsageDto {
    heapUsed;
    heapTotal;
    rss;
}
exports.SessionMemoryUsageDto = SessionMemoryUsageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'V8 heap in use, in MiB.', example: 128 }),
    __metadata("design:type", Number)
], SessionMemoryUsageDto.prototype, "heapUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'V8 heap reserved, in MiB.', example: 256 }),
    __metadata("design:type", Number)
], SessionMemoryUsageDto.prototype, "heapTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resident set size, in MiB.', example: 512 }),
    __metadata("design:type", Number)
], SessionMemoryUsageDto.prototype, "rss", void 0);
class SessionsOverviewResponseDto {
    total;
    active;
    ready;
    disconnected;
    byStatus;
    memoryUsage;
}
exports.SessionsOverviewResponseDto = SessionsOverviewResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sessions on record, connected or not.', example: 5 }),
    __metadata("design:type", Number)
], SessionsOverviewResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sessions with a live engine in this process.', example: 2 }),
    __metadata("design:type", Number)
], SessionsOverviewResponseDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Sessions whose status is 'ready'.", example: 2 }),
    __metadata("design:type", Number)
], SessionsOverviewResponseDto.prototype, "ready", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Sessions whose status is 'disconnected'.", example: 3 }),
    __metadata("design:type", Number)
], SessionsOverviewResponseDto.prototype, "disconnected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session count per status value.',
        example: { ready: 2, disconnected: 3 },
        additionalProperties: { type: 'integer' },
    }),
    __metadata("design:type", Object)
], SessionsOverviewResponseDto.prototype, "byStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SessionMemoryUsageDto, description: 'Process memory usage of this gateway.' }),
    __metadata("design:type", SessionMemoryUsageDto)
], SessionsOverviewResponseDto.prototype, "memoryUsage", void 0);
//# sourceMappingURL=session-actions-response.dto.js.map