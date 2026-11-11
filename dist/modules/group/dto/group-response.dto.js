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
exports.GroupInviteCodeRevokedResponseDto = exports.GroupInviteCodeResponseDto = exports.GroupPictureResponseDto = exports.GroupJoinedResponseDto = exports.GroupMembershipRequestDto = exports.ParticipantsOperationResponseDto = exports.ParticipantOperationResultDto = exports.GroupAckResponseDto = exports.GroupSettingsResponseDto = exports.GroupJoinInfoDto = exports.GroupInfoDto = exports.GroupSummaryDto = exports.GroupParticipantDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class GroupParticipantDto {
    id;
    number;
    name;
    isAdmin;
    isSuperAdmin;
}
exports.GroupParticipantDto = GroupParticipantDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Participant id in the neutral form both engines return: `<phone>@c.us`, or `<lid>@lid` when the phone ' +
            'is not known.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", String)
], GroupParticipantDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MSISDN digits, without a leading + or separators, for a `<phone>@c.us` participant. For a `<lid>@lid` ' +
            "participant it carries the lid's digits on both engines, which are not a phone number.",
        example: '628123456789',
    }),
    __metadata("design:type", String)
], GroupParticipantDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Display name, when the engine reports one.', example: 'Ada Lovelace' }),
    __metadata("design:type", String)
], GroupParticipantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the participant is a group admin.', example: false }),
    __metadata("design:type", Boolean)
], GroupParticipantDto.prototype, "isAdmin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the participant created the group.', example: false }),
    __metadata("design:type", Boolean)
], GroupParticipantDto.prototype, "isSuperAdmin", void 0);
class GroupSummaryDto {
    id;
    name;
    participantsCount;
    isAdmin;
    linkedParentJID;
}
exports.GroupSummaryDto = GroupSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group id.', example: '120363000000000000@g.us' }),
    __metadata("design:type", String)
], GroupSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group subject.', example: 'Engineering' }),
    __metadata("design:type", String)
], GroupSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Member count, when the engine reports it.', example: 42 }),
    __metadata("design:type", Number)
], GroupSummaryDto.prototype, "participantsCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether this account is an admin of the group.', example: true }),
    __metadata("design:type", Boolean)
], GroupSummaryDto.prototype, "isAdmin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'JID of the parent community, or null when the group is standalone.',
        example: null,
    }),
    __metadata("design:type", Object)
], GroupSummaryDto.prototype, "linkedParentJID", void 0);
class GroupInfoDto {
    id;
    name;
    linkedParentJID;
    description;
    owner;
    createdAt;
    participants;
    isReadOnly;
    isAnnounce;
    announce;
    locked;
    ephemeralSeconds;
    memberAddMode;
}
exports.GroupInfoDto = GroupInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group id.', example: '120363000000000000@g.us' }),
    __metadata("design:type", String)
], GroupInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group subject.', example: 'Engineering' }),
    __metadata("design:type", String)
], GroupInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'JID of the parent community, or null when the group is standalone.',
        example: null,
    }),
    __metadata("design:type", Object)
], GroupInfoDto.prototype, "linkedParentJID", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Group description.', example: 'Release coordination' }),
    __metadata("design:type", String)
], GroupInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Owner id in the neutral form both engines return: `<phone>@c.us`, or `<lid>@lid` when the phone ' +
            'is not known.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", String)
], GroupInfoDto.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unix SECONDS the group was created.', example: 1786000000 }),
    __metadata("design:type", Number)
], GroupInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [GroupParticipantDto], description: 'Members of the group.' }),
    __metadata("design:type", Array)
], GroupInfoDto.prototype, "participants", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether this account cannot post: the group is announce-only and this account is not an admin.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], GroupInfoDto.prototype, "isReadOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engine-reported announce flag.', example: false }),
    __metadata("design:type", Boolean)
], GroupInfoDto.prototype, "isAnnounce", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins may send messages.', example: false }),
    __metadata("design:type", Boolean)
], GroupInfoDto.prototype, "announce", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins may edit subject, description and picture.', example: false }),
    __metadata("design:type", Boolean)
], GroupInfoDto.prototype, "locked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Disappearing-messages timer in seconds; 0 or absent means off.', example: 0 }),
    __metadata("design:type", Number)
], GroupInfoDto.prototype, "ephemeralSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['all', 'admins'],
        description: 'Who may add participants. Absent when the engine did not report it.',
        example: 'admins',
    }),
    __metadata("design:type", String)
], GroupInfoDto.prototype, "memberAddMode", void 0);
class GroupJoinInfoDto {
    id;
    name;
    description;
    owner;
    createdAt;
    participantCount;
}
exports.GroupJoinInfoDto = GroupJoinInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group id.', example: '120363000000000000@g.us' }),
    __metadata("design:type", String)
], GroupJoinInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group subject.', example: 'Engineering' }),
    __metadata("design:type", String)
], GroupJoinInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Group description.', example: 'Release coordination' }),
    __metadata("design:type", String)
], GroupJoinInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Owner id in the neutral form both engines return: `<phone>@c.us`, or `<lid>@lid` when the phone ' +
            'is not known.',
        example: '628123456789@c.us',
    }),
    __metadata("design:type", String)
], GroupJoinInfoDto.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unix SECONDS the group was created.', example: 1786000000 }),
    __metadata("design:type", Number)
], GroupJoinInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Member count, when disclosed.', example: 42 }),
    __metadata("design:type", Number)
], GroupJoinInfoDto.prototype, "participantCount", void 0);
class GroupSettingsResponseDto {
    announce;
    locked;
    ephemeralSeconds;
    memberAddMode;
}
exports.GroupSettingsResponseDto = GroupSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins may send messages.', example: false }),
    __metadata("design:type", Boolean)
], GroupSettingsResponseDto.prototype, "announce", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only admins may edit subject, description and picture.', example: false }),
    __metadata("design:type", Boolean)
], GroupSettingsResponseDto.prototype, "locked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Disappearing-messages timer in seconds. Absent when the engine did not report it.',
        example: 0,
    }),
    __metadata("design:type", Number)
], GroupSettingsResponseDto.prototype, "ephemeralSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['all', 'admins'],
        description: 'Who may add participants. Absent when the engine did not report it.',
        example: 'admins',
    }),
    __metadata("design:type", String)
], GroupSettingsResponseDto.prototype, "memberAddMode", void 0);
class GroupAckResponseDto {
    success;
    message;
}
exports.GroupAckResponseDto = GroupAckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always true — a failure is reported as a non-2xx status, not as false.', example: true }),
    __metadata("design:type", Boolean)
], GroupAckResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable confirmation of what was done.', example: 'Group subject updated' }),
    __metadata("design:type", String)
], GroupAckResponseDto.prototype, "message", void 0);
class ParticipantOperationResultDto {
    id;
    success;
    status;
    message;
}
exports.ParticipantOperationResultDto = ParticipantOperationResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Neutral participant id the outcome belongs to.', example: '628123456789@c.us' }),
    __metadata("design:type", String)
], ParticipantOperationResultDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True only when the engine confirmed the change for this participant.', example: true }),
    __metadata("design:type", Boolean)
], ParticipantOperationResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "The engine's own status code, when it gave one.", example: 200 }),
    __metadata("design:type", Number)
], ParticipantOperationResultDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engine-reported reason, when it gave one.', example: 'ok' }),
    __metadata("design:type", String)
], ParticipantOperationResultDto.prototype, "message", void 0);
class ParticipantsOperationResponseDto extends GroupAckResponseDto {
    results;
}
exports.ParticipantsOperationResponseDto = ParticipantsOperationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ParticipantOperationResultDto], description: 'One entry per requested participant.' }),
    __metadata("design:type", Array)
], ParticipantsOperationResponseDto.prototype, "results", void 0);
class GroupMembershipRequestDto {
    participantId;
    addedById;
    method;
    requestedAt;
}
exports.GroupMembershipRequestDto = GroupMembershipRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Neutral id of the user asking to join.', example: '628123456789@c.us' }),
    __metadata("design:type", String)
], GroupMembershipRequestDto.prototype, "participantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Who created the request, when the engine reports it (differs from the requester on a non-admin add).',
        example: '628987654321@c.us',
    }),
    __metadata("design:type", String)
], GroupMembershipRequestDto.prototype, "addedById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'How the request was made, when the engine reports it.',
        enum: ['invite_link', 'non_admin_add', 'linked_group_join'],
        example: 'invite_link',
    }),
    __metadata("design:type", String)
], GroupMembershipRequestDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unix seconds the request was created, when the engine reports it.',
        example: 1754700000,
    }),
    __metadata("design:type", Number)
], GroupMembershipRequestDto.prototype, "requestedAt", void 0);
class GroupJoinedResponseDto {
    success;
    groupId;
}
exports.GroupJoinedResponseDto = GroupJoinedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always true — a failure is reported as a non-2xx status.', example: true }),
    __metadata("design:type", Boolean)
], GroupJoinedResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Id of the group that was joined.', example: '120363000000000000@g.us' }),
    __metadata("design:type", String)
], GroupJoinedResponseDto.prototype, "groupId", void 0);
class GroupPictureResponseDto {
    url;
}
exports.GroupPictureResponseDto = GroupPictureResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'Group picture URL, or null when the group has none.',
        example: 'https://pps.whatsapp.net/v/t61.24694-24/12345_678_910_n.jpg',
    }),
    __metadata("design:type", Object)
], GroupPictureResponseDto.prototype, "url", void 0);
class GroupInviteCodeResponseDto {
    inviteCode;
    inviteLink;
}
exports.GroupInviteCodeResponseDto = GroupInviteCodeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The invite code on its own.', example: 'EXAMPLEINVITECODE12345' }),
    __metadata("design:type", String)
], GroupInviteCodeResponseDto.prototype, "inviteCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The same code as a joinable link.',
        example: 'https://chat.whatsapp.com/EXAMPLEINVITECODE12345',
    }),
    __metadata("design:type", String)
], GroupInviteCodeResponseDto.prototype, "inviteLink", void 0);
class GroupInviteCodeRevokedResponseDto extends GroupInviteCodeResponseDto {
    message;
}
exports.GroupInviteCodeRevokedResponseDto = GroupInviteCodeRevokedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmation that the previous code was revoked.',
        example: 'Invite code revoked and new one generated',
    }),
    __metadata("design:type", String)
], GroupInviteCodeRevokedResponseDto.prototype, "message", void 0);
//# sourceMappingURL=group-response.dto.js.map