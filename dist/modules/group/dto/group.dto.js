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
exports.GroupSettingsDto = exports.SetGroupPictureDto = exports.JoinGroupDto = exports.GroupMemberLabelDto = exports.GroupDescriptionDto = exports.GroupSubjectDto = exports.MembershipRequestActionDto = exports.ParticipantsDto = exports.CreateGroupDto = exports.GROUP_PARTICIPANTS_MAX = exports.GROUP_MEMBER_LABEL_MAX_LENGTH = exports.GROUP_DESCRIPTION_MAX_LENGTH = exports.GROUP_NAME_MAX_LENGTH = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const media_url_1 = require("../../../common/media/media-url");
const media_cap_util_1 = require("../../message/media-cap.util");
exports.GROUP_NAME_MAX_LENGTH = 100;
exports.GROUP_DESCRIPTION_MAX_LENGTH = 1024;
exports.GROUP_MEMBER_LABEL_MAX_LENGTH = 30;
exports.GROUP_PARTICIPANTS_MAX = 256;
class CreateGroupDto {
    name;
    participants;
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group subject/name', maxLength: exports.GROUP_NAME_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.GROUP_NAME_MAX_LENGTH),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Participant WhatsApp IDs (e.g. 628123456789@c.us)',
        type: [String],
        maxItems: exports.GROUP_PARTICIPANTS_MAX,
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ArrayMaxSize)(exports.GROUP_PARTICIPANTS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateGroupDto.prototype, "participants", void 0);
class ParticipantsDto {
    participants;
}
exports.ParticipantsDto = ParticipantsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Participant WhatsApp IDs (e.g. 628123456789@c.us)',
        type: [String],
        maxItems: exports.GROUP_PARTICIPANTS_MAX,
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ArrayMaxSize)(exports.GROUP_PARTICIPANTS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ParticipantsDto.prototype, "participants", void 0);
class MembershipRequestActionDto {
    participants;
}
exports.MembershipRequestActionDto = MembershipRequestActionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Requester WhatsApp IDs (e.g. 628123456789@c.us). Omit to act on every pending request.',
        type: [String],
        maxItems: exports.GROUP_PARTICIPANTS_MAX,
    }),
    (0, class_validator_1.ValidateIf)(o => o.participants !== undefined),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ArrayMaxSize)(exports.GROUP_PARTICIPANTS_MAX),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MembershipRequestActionDto.prototype, "participants", void 0);
class GroupSubjectDto {
    subject;
}
exports.GroupSubjectDto = GroupSubjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New group subject/name', maxLength: exports.GROUP_NAME_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(exports.GROUP_NAME_MAX_LENGTH),
    __metadata("design:type", String)
], GroupSubjectDto.prototype, "subject", void 0);
class GroupDescriptionDto {
    description;
}
exports.GroupDescriptionDto = GroupDescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New group description (may be empty to clear it)',
        maxLength: exports.GROUP_DESCRIPTION_MAX_LENGTH,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.GROUP_DESCRIPTION_MAX_LENGTH),
    __metadata("design:type", String)
], GroupDescriptionDto.prototype, "description", void 0);
class GroupMemberLabelDto {
    label;
}
exports.GroupMemberLabelDto = GroupMemberLabelDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "This account's label in the group, shown beside its name (may be empty to clear it). Counted in " +
            'UTF-16 code units, so an emoji outside the Basic Multilingual Plane takes two of the 30.',
        maxLength: exports.GROUP_MEMBER_LABEL_MAX_LENGTH,
        example: 'Site A Management',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(new RegExp(`^[\\s\\S]{0,${exports.GROUP_MEMBER_LABEL_MAX_LENGTH}}$`), {
        message: `label must be shorter than or equal to ${exports.GROUP_MEMBER_LABEL_MAX_LENGTH} UTF-16 code units`,
    }),
    __metadata("design:type", String)
], GroupMemberLabelDto.prototype, "label", void 0);
class JoinGroupDto {
    inviteCode;
}
exports.JoinGroupDto = JoinGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Group invite code (the token from a https://chat.whatsapp.com/<code> link)',
        maxLength: 128,
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], JoinGroupDto.prototype, "inviteCode", void 0);
class SetGroupPictureDto {
    url;
    base64;
    mimetype;
}
exports.SetGroupPictureDto = SetGroupPictureDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Image URL (http/https)', example: 'https://example.com/group.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, media_url_1.IsMediaUrl)({ ignoreWhen: o => !!(0, media_cap_util_1.stripBase64DataUri)(o.base64) }),
    __metadata("design:type", String)
], SetGroupPictureDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base64 encoded image data' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetGroupPictureDto.prototype, "base64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Image MIME type (required when using base64)', example: 'image/jpeg' }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^image\//),
    __metadata("design:type", String)
], SetGroupPictureDto.prototype, "mimetype", void 0);
class GroupSettingsDto {
    announce;
    locked;
    ephemeralSeconds;
    memberAddMode;
}
exports.GroupSettingsDto = GroupSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins can send messages (announce group)' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.ValidateIf)((o) => o.announce !== undefined),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "announce", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins can edit group info (locked group)' }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.ValidateIf)((o) => o.locked !== undefined),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "locked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Disappearing-messages timer in seconds; 0 disables. Known values: 86400 (24h), 604800 (7d), 7776000 (90d)',
        minimum: 0,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.ValidateIf)((o) => o.ephemeralSeconds !== undefined),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GroupSettingsDto.prototype, "ephemeralSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Who may add participants: 'all' (any member) or 'admins' (admins only)",
        enum: ['all', 'admins'],
    }),
    (0, class_validator_1.ValidateIf)((o) => o.memberAddMode !== undefined),
    (0, class_validator_1.IsIn)(['all', 'admins']),
    __metadata("design:type", String)
], GroupSettingsDto.prototype, "memberAddMode", void 0);
//# sourceMappingURL=group.dto.js.map