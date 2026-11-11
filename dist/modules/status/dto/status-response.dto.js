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
exports.StatusDeletedResponseDto = exports.StatusResultDto = exports.StatusListResponseDto = exports.StatusDto = exports.StatusContactDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class StatusContactDto {
    id;
    name;
    pushName;
}
exports.StatusContactDto = StatusContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Poster id.', example: '628123456789@c.us' }),
    __metadata("design:type", String)
], StatusContactDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Name from the account's addressbook, when saved." }),
    __metadata("design:type", String)
], StatusContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Name the poster set for themselves.', example: 'Ada' }),
    __metadata("design:type", String)
], StatusContactDto.prototype, "pushName", void 0);
class StatusDto {
    id;
    contact;
    type;
    caption;
    mediaUrl;
    backgroundColor;
    font;
    timestamp;
    expiresAt;
}
exports.StatusDto = StatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Status id.', example: 'ABCD1234' }),
    __metadata("design:type", String)
], StatusDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: StatusContactDto, description: 'Who posted it.' }),
    __metadata("design:type", StatusContactDto)
], StatusDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['text', 'image', 'video', 'voice'],
        description: '`voice` is an audio status posted as a voice note. Before voice posting existed, such a ' +
            'status read back as `text`, because anything that was not an image or a video collapsed to it.',
        example: 'image',
    }),
    __metadata("design:type", String)
], StatusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Text of a text status, or the caption of an image or video status.' }),
    __metadata("design:type", String)
], StatusDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Same-origin path to GET /sessions/{sessionId}/status/{statusId}/media, which needs X-API-Key like ' +
            'any other route. Present only when the stored status kept its media.',
        example: '/api/sessions/0a941dac-a965-45e7-b318-74ae8be134f0/status/ABCD1234/media',
    }),
    __metadata("design:type", String)
], StatusDto.prototype, "mediaUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Background colour of a text or voice status.', example: '#0a5c36' }),
    __metadata("design:type", String)
], StatusDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Font index of a text or voice status.', example: 2 }),
    __metadata("design:type", Number)
], StatusDto.prototype, "font", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp the status was posted.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], StatusDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp the status expires.', example: '2026-08-08T12:00:00.000Z' }),
    __metadata("design:type", String)
], StatusDto.prototype, "expiresAt", void 0);
class StatusListResponseDto {
    statuses;
}
exports.StatusListResponseDto = StatusListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StatusDto], description: 'Statuses, newest first.' }),
    __metadata("design:type", Array)
], StatusListResponseDto.prototype, "statuses", void 0);
class StatusResultDto {
    statusId;
    timestamp;
    expiresAt;
}
exports.StatusResultDto = StatusResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id of the status that was posted.', example: 'ABCD1234' }),
    __metadata("design:type", String)
], StatusResultDto.prototype, "statusId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp the engine stamped on it.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], StatusResultDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp it expires — 24 hours later.', example: '2026-08-08T12:00:00.000Z' }),
    __metadata("design:type", String)
], StatusResultDto.prototype, "expiresAt", void 0);
class StatusDeletedResponseDto {
    message;
}
exports.StatusDeletedResponseDto = StatusDeletedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Status deleted successfully' }),
    __metadata("design:type", String)
], StatusDeletedResponseDto.prototype, "message", void 0);
//# sourceMappingURL=status-response.dto.js.map