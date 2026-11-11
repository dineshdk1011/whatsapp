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
exports.MessageResponseDto = exports.SendAudioMessageDto = exports.SEND_POLL_BODY_EXAMPLES = exports.SEND_CONTACT_BODY_EXAMPLES = exports.SEND_LOCATION_BODY_EXAMPLES = exports.SEND_STICKER_BODY_EXAMPLES = exports.SEND_DOCUMENT_BODY_EXAMPLES = exports.SEND_AUDIO_BODY_EXAMPLES = exports.SEND_VIDEO_BODY_EXAMPLES = exports.SEND_IMAGE_BODY_EXAMPLES = exports.SendMediaMessageDto = exports.SEND_TEXT_BODY_EXAMPLES = exports.SendTextMessageDto = exports.CustomLinkPreviewDto = exports.QUOTED_MESSAGE_ID_EXAMPLE = exports.QUOTED_MESSAGE_ID_DESCRIPTION = exports.BUTTON_ID_MAX_LENGTH = exports.CHAT_JID_MESSAGE = exports.CHAT_JID_PATTERN = exports.BATCH_ID_MAX_LENGTH = exports.CHAT_ID_MAX_LENGTH = exports.MESSAGE_TEXT_MAX_LENGTH = exports.CUSTOM_PREVIEW_DESCRIPTION_MAX_LENGTH = exports.CUSTOM_PREVIEW_TITLE_MAX_LENGTH = exports.CUSTOM_PREVIEW_URL_MAX_LENGTH = exports.MENTION_WID_MAX_LENGTH = exports.MENTIONS_MAX = exports.MENTIONS_DESCRIPTION = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const is_mention_wid_validator_1 = require("./is-mention-wid.validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const media_url_1 = require("../../../common/media/media-url");
const media_cap_util_1 = require("../media-cap.util");
exports.MENTIONS_DESCRIPTION = 'WIDs to @mention (e.g. ["62811@c.us"]). The text/caption must also contain the @<number> token.';
exports.MENTIONS_MAX = 1024;
exports.MENTION_WID_MAX_LENGTH = 64;
exports.CUSTOM_PREVIEW_URL_MAX_LENGTH = 2048;
exports.CUSTOM_PREVIEW_TITLE_MAX_LENGTH = 256;
exports.CUSTOM_PREVIEW_DESCRIPTION_MAX_LENGTH = 1024;
exports.MESSAGE_TEXT_MAX_LENGTH = 4096;
exports.CHAT_ID_MAX_LENGTH = 255;
exports.BATCH_ID_MAX_LENGTH = 255;
exports.CHAT_JID_PATTERN = /^[^\s@]+@[^\s@]+$/;
exports.CHAT_JID_MESSAGE = 'chatId must be a valid chat JID in the form localpart@host';
exports.BUTTON_ID_MAX_LENGTH = 256;
exports.QUOTED_MESSAGE_ID_DESCRIPTION = 'Quote an earlier message, turning this send into a reply. The id is engine-specific: ' +
    'whatsapp-web.js matches the serialized message id, Baileys matches the raw message key id and ' +
    'can only quote a message it has already stored. An id that cannot be resolved fails the send ' +
    'rather than delivering it unquoted.';
exports.QUOTED_MESSAGE_ID_EXAMPLE = 'true_628123456789@c.us_3EB0ABCD';
class CustomLinkPreviewDto {
    url;
    title;
    description;
    thumbnailUrl;
    thumbnailBase64;
}
exports.CustomLinkPreviewDto = CustomLinkPreviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The URL as it appears in the message text — WhatsApp anchors the preview to it.',
        example: 'https://example.com/launch',
        maxLength: exports.CUSTOM_PREVIEW_URL_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CUSTOM_PREVIEW_URL_MAX_LENGTH),
    __metadata("design:type", String)
], CustomLinkPreviewDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Required: WhatsApp will not render a preview without a title.',
        example: 'We just launched',
        maxLength: 256,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CUSTOM_PREVIEW_TITLE_MAX_LENGTH),
    __metadata("design:type", String)
], CustomLinkPreviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Preview description', example: 'Read the announcement.', maxLength: 1024 }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.CUSTOM_PREVIEW_DESCRIPTION_MAX_LENGTH),
    __metadata("design:type", String)
], CustomLinkPreviewDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preview image URL (http/https), fetched by the gateway under the same SSRF rules as a media URL. ' +
            'Rendered as the large preview card. At most 5 MiB.',
        example: 'https://example.com/launch.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: o => !!(0, media_cap_util_1.stripBase64DataUri)(o.thumbnailBase64) }),
    __metadata("design:type", String)
], CustomLinkPreviewDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preview image as base64, with or without a data: prefix. Wins over thumbnailUrl. At most 5 MiB decoded.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomLinkPreviewDto.prototype, "thumbnailBase64", void 0);
class SendTextMessageDto {
    chatId;
    text;
    mentions;
    linkPreview;
    customLinkPreview;
    quotedMessageId;
}
exports.SendTextMessageDto = SendTextMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WhatsApp chat ID (phone@c.us for individual, groupId@g.us for groups)',
        example: '628123456789@c.us',
        maxLength: exports.CHAT_ID_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(exports.CHAT_JID_PATTERN, { message: exports.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendTextMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Text message content',
        example: 'Hello from OpenWA!',
        maxLength: exports.MESSAGE_TEXT_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.MESSAGE_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendTextMessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: exports.MENTIONS_DESCRIPTION,
        example: ['628123456789@c.us'],
        type: [String],
        maxItems: exports.MENTIONS_MAX,
        items: { type: 'string', maxLength: exports.MENTION_WID_MAX_LENGTH },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.MENTIONS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(exports.MENTION_WID_MAX_LENGTH, { each: true }),
    (0, class_validator_1.Validate)(is_mention_wid_validator_1.IsMentionWidConstraint, { each: true }),
    __metadata("design:type", Array)
], SendTextMessageDto.prototype, "mentions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Controls the URL preview, and the engines differ. On whatsapp-web.js WhatsApp Web builds one ' +
            'by default and `false` suppresses it. On Baileys previews are OPT-IN: `true` asks the gateway ' +
            'to fetch the page and attach one, while unset or `false` sends none — generating a preview is ' +
            'a blocking outbound fetch per URL in the text, so it is never done unless asked for.',
        example: false,
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendTextMessageDto.prototype, "linkPreview", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: CustomLinkPreviewDto,
        description: 'Attach a preview you supply yourself, instead of one fetched from the URL. The page at `url` ' +
            'is never fetched, so a preview can be attached even for a URL this server cannot reach; only ' +
            'a `thumbnailUrl`, when given, is. ' +
            '**Baileys only** — whatsapp-web.js takes a boolean and answers `501`. Cannot be combined ' +
            'with `linkPreview: false`, which asks for the opposite.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CustomLinkPreviewDto),
    __metadata("design:type", CustomLinkPreviewDto)
], SendTextMessageDto.prototype, "customLinkPreview", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: exports.QUOTED_MESSAGE_ID_DESCRIPTION,
        example: exports.QUOTED_MESSAGE_ID_EXAMPLE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendTextMessageDto.prototype, "quotedMessageId", void 0);
exports.SEND_TEXT_BODY_EXAMPLES = {
    minimal: {
        summary: 'Plain text message',
        value: { chatId: '628123456789@c.us', text: 'Hello from OpenWA!' },
    },
    withMentions: {
        summary: 'Group message with an @mention (the text must carry the @<number> token)',
        value: { chatId: '120363000000000000@g.us', text: 'Hello @62811', mentions: ['62811@c.us'] },
    },
};
class SendMediaMessageDto {
    chatId;
    url;
    base64;
    mimetype;
    filename;
    caption;
    mentions;
    quotedMessageId;
}
exports.SendMediaMessageDto = SendMediaMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WhatsApp chat ID',
        example: '628123456789@c.us',
        maxLength: exports.CHAT_ID_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(exports.CHAT_JID_PATTERN, { message: exports.CHAT_JID_MESSAGE }),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Media URL (http/https)',
        example: 'https://example.com/image.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: o => !!(0, media_cap_util_1.stripBase64DataUri)(o.base64) }),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Base64 encoded media data',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Media MIME type (required when using base64)',
        example: 'image/jpeg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "mimetype", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Filename for the media. Only rendered on document sends — defaults to 'file' when omitted (a URL-based document send on whatsapp-web.js first derives the URL basename)",
        example: 'image.jpg',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Caption for the media',
        example: 'Check out this image!',
        maxLength: 1024,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: exports.MENTIONS_DESCRIPTION,
        example: ['628123456789@c.us'],
        type: [String],
        maxItems: exports.MENTIONS_MAX,
        items: { type: 'string', maxLength: exports.MENTION_WID_MAX_LENGTH },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(exports.MENTIONS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(exports.MENTION_WID_MAX_LENGTH, { each: true }),
    (0, class_validator_1.Validate)(is_mention_wid_validator_1.IsMentionWidConstraint, { each: true }),
    __metadata("design:type", Array)
], SendMediaMessageDto.prototype, "mentions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: exports.QUOTED_MESSAGE_ID_DESCRIPTION,
        example: exports.QUOTED_MESSAGE_ID_EXAMPLE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMediaMessageDto.prototype, "quotedMessageId", void 0);
const mediaBodyExample = (url, extra = {}) => ({
    fromUrl: {
        summary: 'Fetch the media from a URL',
        value: { chatId: '628123456789@c.us', url, ...extra },
    },
});
exports.SEND_IMAGE_BODY_EXAMPLES = mediaBodyExample('https://example.com/image.jpg', {
    caption: 'Check out this image!',
});
exports.SEND_VIDEO_BODY_EXAMPLES = mediaBodyExample('https://example.com/video.mp4');
exports.SEND_AUDIO_BODY_EXAMPLES = mediaBodyExample('https://example.com/audio.ogg', { ptt: true });
exports.SEND_DOCUMENT_BODY_EXAMPLES = mediaBodyExample('https://example.com/report.pdf', {
    filename: 'report.pdf',
});
exports.SEND_STICKER_BODY_EXAMPLES = mediaBodyExample('https://example.com/sticker.webp');
exports.SEND_LOCATION_BODY_EXAMPLES = {
    minimal: {
        summary: 'Share a location',
        value: { chatId: '628123456789@c.us', latitude: -6.2088, longitude: 106.8456, description: 'Jakarta' },
    },
};
exports.SEND_CONTACT_BODY_EXAMPLES = {
    minimal: {
        summary: 'Share a contact card',
        value: { chatId: '628123456789@c.us', contactName: 'Alice', contactNumber: '628999888777' },
    },
};
exports.SEND_POLL_BODY_EXAMPLES = {
    minimal: {
        summary: 'Ask a single-choice poll',
        value: { chatId: '120363000000000000@g.us', name: 'Where should we meet?', options: ['Park', 'Beach'] },
    },
};
class SendAudioMessageDto extends SendMediaMessageDto {
    ptt;
}
exports.SendAudioMessageDto = SendAudioMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Send as a WhatsApp voice note (PTT — mic bubble + waveform). Provide audio/ogg; codecs=opus ' +
            'bytes for reliable playback; when the mimetype is omitted it defaults to that for voice notes. ' +
            'Expects a JSON boolean. Default false = plain audio file. Only valid on send-audio.',
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendAudioMessageDto.prototype, "ptt", void 0);
class MessageResponseDto {
    messageId;
    timestamp;
}
exports.MessageResponseDto = MessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The message id, assigned when the gateway accepts the message for sending. A 201 here means the ' +
            'message was handed to the WhatsApp session; it does not confirm delivery. Baileys checks phone ' +
            'destinations without a LID mapping and rejects a number reported as unregistered with 400. An ' +
            'unanswered lookup returns 503 before sending. Known LIDs skip the number check. Track delivery ' +
            'through the message status (sent, delivered, read, or failed). A message resting at sent can ' +
            'also belong to a registered recipient whose device is offline.',
        example: 'true_628123456789@c.us_3EB0123456789',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unix timestamp (seconds) at which the gateway accepted the message for sending.',
        example: 1706868000,
    }),
    __metadata("design:type", Number)
], MessageResponseDto.prototype, "timestamp", void 0);
//# sourceMappingURL=send-message.dto.js.map