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
exports.ChatSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const filter_types_1 = require("../../webhook/filters/filter-types");
const CHAT_KINDS = ['individual', 'group', 'channel', 'status', 'broadcast', 'unknown'];
class ChatSummaryDto {
    id;
    name;
    isGroup;
    kind;
    unreadCount;
    timestamp;
    lastMessage;
    lastMessageType;
    archived;
    pinned;
    muted;
    muteExpiration;
}
exports.ChatSummaryDto = ChatSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628111@c.us' }),
    __metadata("design:type", String)
], ChatSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Alice' }),
    __metadata("design:type", String)
], ChatSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Retained for back-compat; true for @g.us chats.', example: false }),
    __metadata("design:type", Boolean)
], ChatSummaryDto.prototype, "isGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CHAT_KINDS, description: 'User-facing chat kind.', example: 'individual' }),
    __metadata("design:type", String)
], ChatSummaryDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], ChatSummaryDto.prototype, "unreadCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix seconds of the last activity.', example: 1700000010 }),
    __metadata("design:type", Number)
], ChatSummaryDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'hi' }),
    __metadata("design:type", String)
], ChatSummaryDto.prototype, "lastMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: filter_types_1.MESSAGE_TYPES,
        description: 'Engine-neutral type of the last message, when available.',
        example: 'image',
    }),
    __metadata("design:type", String)
], ChatSummaryDto.prototype, "lastMessageType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Archived state, as set via POST /sessions/{sessionId}/chats/archive.', example: false }),
    __metadata("design:type", Boolean)
], ChatSummaryDto.prototype, "archived", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pinned state, as set via POST /sessions/{sessionId}/chats/pin.', example: false }),
    __metadata("design:type", Boolean)
], ChatSummaryDto.prototype, "pinned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the chat is muted right now, as set via POST /sessions/{sessionId}/chats/mute. The ' +
            'verdict rather than the expiry: whatsapp-web.js derives it itself from Chat.isMuted, and ' +
            'Baileys carries a muteEndTime that this gateway compares against now. muteExpiration carries ' +
            'the instant itself.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ChatSummaryDto.prototype, "muted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Epoch MILLISECONDS at which the mute ends, present only when muted is true; 0 means muted ' +
            'indefinitely. Milliseconds is the same unit as POST /sessions/{sessionId}/chats/mute ' +
            'muteUntil, so a finite value can be written straight back. The 0 an indefinite mute reports ' +
            'is the exception: muteUntil requires a real future instant, so re-apply an indefinite mute ' +
            'with a far-future timestamp rather than 0.',
        example: 1786003600000,
    }),
    __metadata("design:type", Number)
], ChatSummaryDto.prototype, "muteExpiration", void 0);
//# sourceMappingURL=chat-summary.dto.js.map