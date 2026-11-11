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
exports.MessageReactionDto = exports.MessageReactionSenderDto = exports.ChatHistoryMessageDto = exports.ChatHistoryPollDto = exports.ChatHistoryProductDto = exports.ChatHistoryOrderDto = exports.ChatHistoryCallDto = exports.ChatHistoryLocationDto = exports.ChatHistoryQuotedMessageDto = exports.ChatHistoryMediaDto = exports.ChatHistoryContactDto = exports.MessageListResponseDto = exports.MessageListItemDto = exports.MessageActionResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const message_entity_1 = require("../entities/message.entity");
const MESSAGE_TYPES = [
    'text',
    'image',
    'video',
    'audio',
    'voice',
    'document',
    'sticker',
    'location',
    'contact',
    'poll',
    'call',
    'revoked',
    'order',
    'product',
    'masked',
    'unknown',
];
const CHAT_KINDS = ['individual', 'group', 'channel', 'status', 'broadcast', 'unknown'];
class MessageActionResponseDto {
    success;
}
exports.MessageActionResponseDto = MessageActionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always true — a failure is reported as a non-2xx status, not as false.', example: true }),
    __metadata("design:type", Boolean)
], MessageActionResponseDto.prototype, "success", void 0);
class MessageListItemDto {
    id;
    sessionId;
    waMessageId;
    chatId;
    chatName;
    author;
    from;
    to;
    body;
    type;
    direction;
    timestamp;
    metadata;
    mediaPath;
    mediaMimetype;
    status;
    createdAt;
}
exports.MessageListItemDto = MessageListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'WhatsApp message id, once the engine has assigned one.',
        example: 'true_628123456789@c.us_3EB0123456789',
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "waMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: "Sender's push name, or their saved contact name when the engine reported no push name; in a group this is the member who posted, not the group subject. Null when neither was known.",
        example: 'Alice',
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "chatName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'Sender of a group, status or broadcast-list message (`from` is the group, `status@broadcast` or list id there). On Baileys a list message the account received is filed under the sender, so `from` is the sender too.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628987654321@c.us' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true, description: 'Message text body.', example: 'hi' }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Engine-neutral message type.', example: 'text' }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: message_entity_1.MessageDirection, example: message_entity_1.MessageDirection.INCOMING }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        nullable: true,
        description: 'Unix seconds the message was sent, when the engine reported one.',
        example: 1700000010,
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        nullable: true,
        description: 'Engine-specific extras (media inline copy, poll data, …). Absent when none were stored.',
        additionalProperties: true,
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'Storage key of the archived media, when one was archived.',
    }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "mediaPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, nullable: true, description: 'Mimetype of the archived media.' }),
    __metadata("design:type", Object)
], MessageListItemDto.prototype, "mediaMimetype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: message_entity_1.MessageStatus, example: message_entity_1.MessageStatus.DELIVERED }),
    __metadata("design:type", String)
], MessageListItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time', example: '2026-08-13T09:00:00Z' }),
    __metadata("design:type", Date)
], MessageListItemDto.prototype, "createdAt", void 0);
class MessageListResponseDto {
    unknownTimestampTotal;
    messages;
    total;
}
exports.MessageListResponseDto = MessageListResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rows matching the non-time filters with unknown message time, before time bounds. Present only for time selections; excluded from their messages and total. Stored history is not proof of complete remote history.',
    }),
    __metadata("design:type", Number)
], MessageListResponseDto.prototype, "unknownTimestampTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MessageListItemDto], description: 'Newest first.' }),
    __metadata("design:type", Array)
], MessageListResponseDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total rows matching the filters (before pagination).', example: 132 }),
    __metadata("design:type", Number)
], MessageListResponseDto.prototype, "total", void 0);
class ChatHistoryContactDto {
    id;
    number;
    name;
    pushName;
    shortName;
    type;
    isMyContact;
    isWAContact;
    isBusiness;
    isEnterprise;
    verifiedName;
    verifiedLevel;
    isBlocked;
    labels;
}
exports.ChatHistoryContactDto = ChatHistoryContactDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sender JID (`…@c.us` or a `…@lid` privacy id).', example: '628123456789@c.us' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Phone digits, best-effort.', example: '628123456789' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Alice' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Alice' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "pushName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Al' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "shortName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engine contact type token.', example: 'in' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Saved in the account address book.', example: true }),
    __metadata("design:type", Boolean)
], ChatHistoryContactDto.prototype, "isMyContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is a WhatsApp user.', example: true }),
    __metadata("design:type", Boolean)
], ChatHistoryContactDto.prototype, "isWAContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryContactDto.prototype, "isBusiness", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryContactDto.prototype, "isEnterprise", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Business verified name.' }),
    __metadata("design:type", String)
], ChatHistoryContactDto.prototype, "verifiedName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Business verification level.', example: 2 }),
    __metadata("design:type", Number)
], ChatHistoryContactDto.prototype, "verifiedLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryContactDto.prototype, "isBlocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Label ids (CRM); names are not resolved.' }),
    __metadata("design:type", Array)
], ChatHistoryContactDto.prototype, "labels", void 0);
class ChatHistoryMediaDto {
    mimetype;
    filename;
    data;
    omitted;
    sizeBytes;
}
exports.ChatHistoryMediaDto = ChatHistoryMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'image/jpeg' }),
    __metadata("design:type", String)
], ChatHistoryMediaDto.prototype, "mimetype", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'photo.jpg' }),
    __metadata("design:type", String)
], ChatHistoryMediaDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base64 payload; absent when the blob was omitted.' }),
    __metadata("design:type", String)
], ChatHistoryMediaDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'True when the blob was dropped by a size cap, timeout, or saturation.' }),
    __metadata("design:type", Boolean)
], ChatHistoryMediaDto.prototype, "omitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Decoded byte size of the media; always set when omitted.', example: 102400 }),
    __metadata("design:type", Number)
], ChatHistoryMediaDto.prototype, "sizeBytes", void 0);
class ChatHistoryQuotedMessageDto {
    id;
    body;
}
exports.ChatHistoryQuotedMessageDto = ChatHistoryQuotedMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true_628123456789@c.us_3EB0123456789' }),
    __metadata("design:type", String)
], ChatHistoryQuotedMessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'original text' }),
    __metadata("design:type", String)
], ChatHistoryQuotedMessageDto.prototype, "body", void 0);
class ChatHistoryLocationDto {
    latitude;
    longitude;
    description;
    address;
    url;
}
exports.ChatHistoryLocationDto = ChatHistoryLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -6.2088 }),
    __metadata("design:type", Number)
], ChatHistoryLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 106.8456 }),
    __metadata("design:type", Number)
], ChatHistoryLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Monas' }),
    __metadata("design:type", String)
], ChatHistoryLocationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Jakarta' }),
    __metadata("design:type", String)
], ChatHistoryLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://maps.example.com/…' }),
    __metadata("design:type", String)
], ChatHistoryLocationDto.prototype, "url", void 0);
class ChatHistoryCallDto {
    video;
    missed;
}
exports.ChatHistoryCallDto = ChatHistoryCallDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Video (true) vs voice (false) call.', example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryCallDto.prototype, "video", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether an incoming call went unanswered.', example: true }),
    __metadata("design:type", Boolean)
], ChatHistoryCallDto.prototype, "missed", void 0);
class ChatHistoryOrderDto {
    orderId;
    token;
}
exports.ChatHistoryOrderDto = ChatHistoryOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Id of the cart the customer placed from the business catalog.',
        example: '1000000000000001',
    }),
    __metadata("design:type", String)
], ChatHistoryOrderDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Opaque single-order credential that accompanies `orderId`. Pass through unchanged; do not log it.',
    }),
    __metadata("design:type", String)
], ChatHistoryOrderDto.prototype, "token", void 0);
class ChatHistoryProductDto {
    productId;
    title;
    description;
    businessOwnerJid;
}
exports.ChatHistoryProductDto = ChatHistoryProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id of the shared catalog product.', example: '2000000000000002' }),
    __metadata("design:type", String)
], ChatHistoryProductDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sample product' }),
    __metadata("design:type", String)
], ChatHistoryProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'A sample product description.' }),
    __metadata("design:type", String)
], ChatHistoryProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "JID of the catalog's owner.", example: '628123456789@c.us' }),
    __metadata("design:type", String)
], ChatHistoryProductDto.prototype, "businessOwnerJid", void 0);
class ChatHistoryPollDto {
    name;
    options;
    allowMultipleAnswers;
}
exports.ChatHistoryPollDto = ChatHistoryPollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Where?' }),
    __metadata("design:type", String)
], ChatHistoryPollDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['Park', 'Beach'] }),
    __metadata("design:type", Array)
], ChatHistoryPollDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryPollDto.prototype, "allowMultipleAnswers", void 0);
class ChatHistoryMessageDto {
    id;
    from;
    to;
    chatId;
    body;
    type;
    timestamp;
    fromMe;
    isGroup;
    kind;
    isStatusBroadcast;
    ephemeralDuration;
    author;
    mentionedIds;
    call;
    isLidSender;
    senderPhone;
    contact;
    backgroundColor;
    font;
    media;
    quotedMessage;
    poll;
    location;
    order;
    product;
}
exports.ChatHistoryMessageDto = ChatHistoryMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true_628123456789@c.us_3EB0123456789' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628987654321@c.us' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'hi' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: MESSAGE_TYPES, description: 'Engine-neutral message type.', example: 'text' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix seconds the message was sent.', example: 1700000010 }),
    __metadata("design:type", Number)
], ChatHistoryMessageDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryMessageDto.prototype, "fromMe", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryMessageDto.prototype, "isGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CHAT_KINDS, description: 'User-facing chat kind of the conversation.', example: 'individual' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'True for a status/story broadcast.', example: false }),
    __metadata("design:type", Boolean)
], ChatHistoryMessageDto.prototype, "isStatusBroadcast", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Disappearing-messages timer in seconds; 0 or absent means off.', example: 0 }),
    __metadata("design:type", Number)
], ChatHistoryMessageDto.prototype, "ephemeralDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sender of a group, status or broadcast-list message (`from` is the group, `status@broadcast` or list id there). On Baileys a list message the account received is filed under the sender, so `from` is the sender too.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'WIDs @mentioned in the message.' }),
    __metadata("design:type", Array)
], ChatHistoryMessageDto.prototype, "mentionedIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryCallDto, description: 'Set for `call` messages.' }),
    __metadata("design:type", ChatHistoryCallDto)
], ChatHistoryMessageDto.prototype, "call", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sender is identified by a privacy id rather than a phone number.' }),
    __metadata("design:type", Boolean)
], ChatHistoryMessageDto.prototype, "isLidSender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'Never set on this route: live history does no privacy-id resolution. Resolve an @lid sender with GET /api/sessions/{sessionId}/contacts/{contactId}/phone.',
        example: null,
    }),
    __metadata("design:type", Object)
], ChatHistoryMessageDto.prototype, "senderPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryContactDto, description: 'Sender contact info, best-effort.' }),
    __metadata("design:type", ChatHistoryContactDto)
], ChatHistoryMessageDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Text-status background as `#RRGGBB`.', example: '#FF5733' }),
    __metadata("design:type", String)
], ChatHistoryMessageDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Text-status WhatsApp font index.', example: 1 }),
    __metadata("design:type", Number)
], ChatHistoryMessageDto.prototype, "font", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryMediaDto }),
    __metadata("design:type", ChatHistoryMediaDto)
], ChatHistoryMessageDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryQuotedMessageDto }),
    __metadata("design:type", ChatHistoryQuotedMessageDto)
], ChatHistoryMessageDto.prototype, "quotedMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryPollDto, description: 'Poll choices and selection mode, when available.' }),
    __metadata("design:type", ChatHistoryPollDto)
], ChatHistoryMessageDto.prototype, "poll", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryLocationDto }),
    __metadata("design:type", ChatHistoryLocationDto)
], ChatHistoryMessageDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryOrderDto, description: 'Set for `order` messages.' }),
    __metadata("design:type", ChatHistoryOrderDto)
], ChatHistoryMessageDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ChatHistoryProductDto, description: 'Set for `product` messages.' }),
    __metadata("design:type", ChatHistoryProductDto)
], ChatHistoryMessageDto.prototype, "product", void 0);
class MessageReactionSenderDto {
    senderId;
    emoji;
    timestamp;
}
exports.MessageReactionSenderDto = MessageReactionSenderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], MessageReactionSenderDto.prototype, "senderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '👍' }),
    __metadata("design:type", String)
], MessageReactionSenderDto.prototype, "emoji", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix seconds the reaction was placed.', example: 1700000010 }),
    __metadata("design:type", Number)
], MessageReactionSenderDto.prototype, "timestamp", void 0);
class MessageReactionDto {
    emoji;
    senders;
}
exports.MessageReactionDto = MessageReactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The emoji this entry groups.', example: '👍' }),
    __metadata("design:type", String)
], MessageReactionDto.prototype, "emoji", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MessageReactionSenderDto], description: 'Who placed this emoji.' }),
    __metadata("design:type", Array)
], MessageReactionDto.prototype, "senders", void 0);
//# sourceMappingURL=message-responses.dto.js.map