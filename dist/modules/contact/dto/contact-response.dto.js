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
exports.ContactAckResponseDto = exports.ResolvedPhoneResponseDto = exports.NumberCheckResponseDto = exports.ProfilePicturesResponseDto = exports.ProfilePictureResponseDto = exports.ContactDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ContactDto {
    id;
    name;
    pushName;
    number;
    isMyContact;
    isBlocked;
    profilePicUrl;
}
exports.ContactDto = ContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contact id in the neutral form both engines return (`<phone>@c.us`, never `@s.whatsapp.net`). On ' +
            'Baileys this is frequently an `@lid` rather than a phone-number JID; use GET /contacts/{contactId}/phone ' +
            'to resolve one.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "The name from the account's own addressbook. Absent for a contact that was never saved.",
        example: 'Ada Lovelace',
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The display name the contact set for themselves. Present even when the contact is not saved.',
        example: 'Ada',
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "pushName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MSISDN digits, without a leading + or any separators, for a `<phone>@c.us` contact. For a `<lid>@lid` ' +
            "contact it depends on the engine: Baileys carries the phone's digits when the phone is known and an empty " +
            "string when it is not; whatsapp-web.js carries the lid's digits, which are not a phone number.",
        example: '628123456789',
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Whether the entry exists in the account's addressbook.", example: true }),
    __metadata("design:type", Boolean)
], ContactDto.prototype, "isMyContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this account has blocked the contact.', example: false }),
    __metadata("design:type", Boolean)
], ContactDto.prototype, "isBlocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'A cached profile picture URL. Only Baileys can fill it (whatsapp-web.js never sets it), and it is often ' +
            'absent there too, so its absence does not say whether the contact has a picture; fetch the URL from ' +
            'GET /contacts/{contactId}/profile-picture.',
        example: 'https://pps.whatsapp.net/v/...',
    }),
    __metadata("design:type", String)
], ContactDto.prototype, "profilePicUrl", void 0);
class ProfilePictureResponseDto {
    url;
}
exports.ProfilePictureResponseDto = ProfilePictureResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'Profile picture URL, or null when the contact has none or their privacy settings hide it.',
        example: 'https://pps.whatsapp.net/v/t61.24694-24/12345_678_910_n.jpg',
    }),
    __metadata("design:type", Object)
], ProfilePictureResponseDto.prototype, "url", void 0);
class ProfilePicturesResponseDto {
    pictures;
}
exports.ProfilePicturesResponseDto = ProfilePicturesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Map of the requested contact ids to their picture URL. An id resolves to null when the ' +
            'contact has no picture, hides it, or its lookup failed. Ids beyond the first 50, and ids skipped ' +
            'after a lookup timed out, are absent from the map: ask for them again.',
        example: { '628123456789@c.us': 'https://pps.whatsapp.net/v/t61.24694-24/12345_678_910_n.jpg' },
        additionalProperties: { type: 'string', nullable: true },
    }),
    __metadata("design:type", Object)
], ProfilePicturesResponseDto.prototype, "pictures", void 0);
class NumberCheckResponseDto {
    number;
    exists;
    whatsappId;
}
exports.NumberCheckResponseDto = NumberCheckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The number exactly as supplied in the path.', example: '628123456789' }),
    __metadata("design:type", String)
], NumberCheckResponseDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the number is a registered WhatsApp account.', example: true }),
    __metadata("design:type", Boolean)
], NumberCheckResponseDto.prototype, "exists", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'The chat id WhatsApp holds for the number, in the neutral `<phone>@c.us` form on both engines ' +
            '(it can differ from the digits supplied), or null when the number is not registered.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", Object)
], NumberCheckResponseDto.prototype, "whatsappId", void 0);
class ResolvedPhoneResponseDto {
    contactId;
    phone;
}
exports.ResolvedPhoneResponseDto = ResolvedPhoneResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The contact id exactly as supplied in the path.', example: '12345678901234@lid' }),
    __metadata("design:type", String)
], ResolvedPhoneResponseDto.prototype, "contactId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'MSISDN digits for the contact, or null when the engine has not learned the mapping. ' +
            'Best-effort: a null here is not a statement that the contact has no number.',
        example: '628123456789',
    }),
    __metadata("design:type", Object)
], ResolvedPhoneResponseDto.prototype, "phone", void 0);
class ContactAckResponseDto {
    success;
    message;
}
exports.ContactAckResponseDto = ContactAckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always true — a failure is reported as a non-2xx status, not as false.', example: true }),
    __metadata("design:type", Boolean)
], ContactAckResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable confirmation of what was done.', example: 'Contact saved' }),
    __metadata("design:type", String)
], ContactAckResponseDto.prototype, "message", void 0);
//# sourceMappingURL=contact-response.dto.js.map