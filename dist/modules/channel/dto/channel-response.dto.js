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
exports.ChannelAckResponseDto = exports.ChannelMessageDto = exports.ChannelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ChannelDto {
    id;
    name;
    description;
    inviteCode;
    subscriberCount;
    picture;
    verified;
    createdAt;
}
exports.ChannelDto = ChannelDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Channel (newsletter) id.', example: '120363000000000000@newsletter' }),
    __metadata("design:type", String)
], ChannelDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Channel name.', example: 'Release notes' }),
    __metadata("design:type", String)
], ChannelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Channel description, when set.' }),
    __metadata("design:type", String)
], ChannelDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Invite code, when the engine discloses one. Absent does not mean the channel is private.',
        example: '0029Va...',
    }),
    __metadata("design:type", String)
], ChannelDto.prototype, "inviteCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Subscriber count, when the engine reports it.', example: 1024 }),
    __metadata("design:type", Number)
], ChannelDto.prototype, "subscriberCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Channel picture URL. Not currently filled by either engine: WhatsApp reports only a media path.',
    }),
    __metadata("design:type", String)
], ChannelDto.prototype, "picture", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether WhatsApp marks the channel verified.', example: false }),
    __metadata("design:type", Boolean)
], ChannelDto.prototype, "verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unix SECONDS the channel was created, when reported.', example: 1786000000 }),
    __metadata("design:type", Number)
], ChannelDto.prototype, "createdAt", void 0);
class ChannelMessageDto {
    id;
    body;
    timestamp;
    hasMedia;
    mediaUrl;
}
exports.ChannelMessageDto = ChannelMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message id.', example: 'ABCD1234' }),
    __metadata("design:type", String)
], ChannelMessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message text. Empty for a media-only post.', example: 'v0.14.4 is out' }),
    __metadata("design:type", String)
], ChannelMessageDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix SECONDS the message was posted.', example: 1786000000 }),
    __metadata("design:type", Number)
], ChannelMessageDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the post carries media.', example: false }),
    __metadata("design:type", Boolean)
], ChannelMessageDto.prototype, "hasMedia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Media URL. Neither engine populates it today; use hasMedia.' }),
    __metadata("design:type", String)
], ChannelMessageDto.prototype, "mediaUrl", void 0);
class ChannelAckResponseDto {
    success;
}
exports.ChannelAckResponseDto = ChannelAckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always true — a failure is reported as a non-2xx status, not as false.', example: true }),
    __metadata("design:type", Boolean)
], ChannelAckResponseDto.prototype, "success", void 0);
//# sourceMappingURL=channel-response.dto.js.map