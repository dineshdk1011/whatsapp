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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const group_service_1 = require("./group.service");
const group_dto_1 = require("./dto/group.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const group_response_dto_1 = require("./dto/group-response.dto");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
const THROTTLED_503 = ' On Baileys, also answered when WhatsApp rate-limits or times out the request (code 429 or 408); ' +
    'retry after a pause.';
const INVITE_CODE_403 = 'The engine refused the request — admin rights required for this group';
const INVITE_CODE_503 = 'WhatsApp did not answer the invite-code query — retry shortly.' + THROTTLED_503;
const PARTICIPANTS_503 = 'WhatsApp did not answer within the request budget, so no per-participant outcome was read at all. ' +
    'Deliberately not folded into the 200 above — a participant WhatsApp turned down is reported inside ' +
    '`results` and is an answer; an update that never came back is not.' +
    THROTTLED_503;
const PARTICIPANT_ID_400 = 'A participant does not name an individual. Pass a phone number, `<phone>@c.us` or `<lid>@lid`; ' +
    'a group id or free text is rejected.';
const PACED_PARTICIPANT_400 = PARTICIPANT_ID_400 +
    ' With send pacing on, also answered (without `retryAfterSeconds`) when the request names more new ' +
    "contacts than the whole day's cold-reachout allowance; split it into smaller batches.";
const BODY_OR_SESSION_400 = 'The body failed validation, or the session is not started (no engine is running for it).';
function assertActionBodyRead(req) {
    const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
    if (hasBody && req.is(['application/json', 'application/x-www-form-urlencoded']) === false) {
        throw new common_1.BadRequestException('The request body was not read: send it as application/json, or send no body to act on every request');
    }
    if (Array.isArray(req.body)) {
        throw new common_1.BadRequestException('The body must be a JSON object such as {"participants": [...]}, not a list');
    }
}
let GroupController = class GroupController {
    groupService;
    constructor(groupService) {
        this.groupService = groupService;
    }
    async joinInfo(sessionId, code) {
        return this.groupService.getGroupJoinInfo(sessionId, code);
    }
    async findOne(sessionId, groupId) {
        return this.groupService.getGroupInfo(sessionId, groupId);
    }
    async join(sessionId, dto) {
        const groupId = await this.groupService.joinGroupViaInviteCode(sessionId, dto.inviteCode);
        return { success: true, groupId };
    }
    async getSettings(sessionId, groupId) {
        return this.groupService.getGroupSettings(sessionId, groupId);
    }
    async updateSettings(sessionId, groupId, dto) {
        await this.groupService.updateGroupSettings(sessionId, groupId, dto);
        return { success: true, message: 'Group settings updated' };
    }
    async create(sessionId, dto) {
        return this.groupService.createGroup(sessionId, dto.name, dto.participants);
    }
    async addParticipants(sessionId, groupId, dto) {
        const results = await this.groupService.addParticipants(sessionId, groupId, dto.participants);
        return { success: true, message: 'Participants added', results };
    }
    async removeParticipants(sessionId, groupId, dto) {
        const results = await this.groupService.removeParticipants(sessionId, groupId, dto.participants);
        return { success: true, message: 'Participants removed', results };
    }
    async promoteParticipants(sessionId, groupId, dto) {
        const results = await this.groupService.promoteParticipants(sessionId, groupId, dto.participants);
        return { success: true, message: 'Participants promoted to admin', results };
    }
    async demoteParticipants(sessionId, groupId, dto) {
        const results = await this.groupService.demoteParticipants(sessionId, groupId, dto.participants);
        return { success: true, message: 'Participants demoted from admin', results };
    }
    async getMembershipRequests(sessionId, groupId) {
        return this.groupService.getGroupMembershipRequests(sessionId, groupId);
    }
    async approveMembershipRequests(sessionId, groupId, dto, req) {
        assertActionBodyRead(req);
        const results = await this.groupService.approveGroupMembershipRequests(sessionId, groupId, dto.participants);
        return { success: true, message: 'Membership requests approved', results };
    }
    async rejectMembershipRequests(sessionId, groupId, dto, req) {
        assertActionBodyRead(req);
        const results = await this.groupService.rejectGroupMembershipRequests(sessionId, groupId, dto.participants);
        return { success: true, message: 'Membership requests rejected', results };
    }
    async setSubject(sessionId, groupId, dto) {
        await this.groupService.setGroupSubject(sessionId, groupId, dto.subject);
        return { success: true, message: 'Group subject updated' };
    }
    async setDescription(sessionId, groupId, dto) {
        await this.groupService.setGroupDescription(sessionId, groupId, dto.description);
        return { success: true, message: 'Group description updated' };
    }
    async setMemberLabel(sessionId, groupId, dto) {
        await this.groupService.setGroupMemberLabel(sessionId, groupId, dto.label);
        return { success: true, message: 'Group member label sent' };
    }
    async leave(sessionId, groupId) {
        await this.groupService.leaveGroup(sessionId, groupId);
        return { success: true, message: 'Left the group' };
    }
    async getPicture(sessionId, groupId) {
        return { url: await this.groupService.getGroupPicture(sessionId, groupId) };
    }
    async setPicture(sessionId, groupId, dto) {
        await this.groupService.setGroupPicture(sessionId, groupId, dto);
        return { success: true, message: 'Group picture updated' };
    }
    async deletePicture(sessionId, groupId) {
        await this.groupService.deleteGroupPicture(sessionId, groupId);
        return { success: true, message: 'Group picture removed' };
    }
    async getInviteCode(sessionId, groupId) {
        const inviteCode = await this.groupService.getGroupInviteCode(sessionId, groupId);
        return {
            inviteCode,
            inviteLink: `https://chat.whatsapp.com/${inviteCode}`,
        };
    }
    async revokeInviteCode(sessionId, groupId) {
        const newCode = await this.groupService.revokeGroupInviteCode(sessionId, groupId);
        return {
            inviteCode: newCode,
            inviteLink: `https://chat.whatsapp.com/${newCode}`,
            message: 'Invite code revoked and new one generated',
        };
    }
};
exports.GroupController = GroupController;
__decorate([
    (0, common_1.Get)('join-info'),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview a group from its invite code, without joining',
        description: 'Read-only: nothing about the account changes, which is what makes it safe to call on a code ' +
            'from an untrusted source. Supported on both engines.\n\n' +
            'There is no participant LIST — the account is not a member — only a count, and only when ' +
            'WhatsApp discloses one. Fields the engine does not report are omitted rather than defaulted, ' +
            'because whatsapp-web.js returns an untyped object with no guaranteed shape.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiQuery)({ name: 'code', description: 'Group invite code (the part after the invite link)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'What the invite discloses about the group', type: group_response_dto_1.GroupJoinInfoDto }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. Deliberately not folded into the 404 above — ' +
            'a query that never came back is not the same claim as a group that does not exist.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session not started, or no code supplied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No such invite — invalid, expired or revoked' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "joinInfo", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':groupId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed group info' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID (e.g., 120363xxx@g.us)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group details with participants', type: group_response_dto_1.GroupInfoDto }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The API key is restricted to selected chats and this group is outside its allowlist.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. Deliberately not folded into the 404 above — ' +
            'a query that never came back is not the same claim as a group that does not exist.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Group not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('join'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Join a group via invite code' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.JoinGroupDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Joined the group', type: group_response_dto_1.GroupJoinedResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired invite code, or session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, group_dto_1.JoinGroupDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "join", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':groupId/settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get group settings (announce / locked / ephemeral timer / member-add mode)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group settings', type: group_response_dto_1.GroupSettingsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Group not found' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The API key is restricted to selected chats and this group is outside its allowlist.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — nothing could be read.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getSettings", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':groupId/settings'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Update group settings (announce / locked / ephemeral timer / member-add mode)' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.GroupSettingsDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group settings updated', type: group_response_dto_1.GroupAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'No setting provided, an unknown body field, or an invalid value: `announce` and `locked` take a boolean, ' +
            '`ephemeralSeconds` an integer of 0 or more, `memberAddMode` `all` or `admins`, and `null` is refused. ' +
            'Also answered when the session is not started (no engine is running for it).',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused the change (the account is not a group admin)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Group not found' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'The active engine does not support a requested setting' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.GroupSettingsDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new group' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.CreateGroupDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Group created', type: group_response_dto_1.GroupSummaryDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: PACED_PARTICIPANT_400 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp rate-limited the create (code 429); nothing was created, so retrying after a pause is safe. ' +
            'A timed-out create is not answered 503, because the group may have been created.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'Not supported by the active engine: whatsapp-web.js reaches a WhatsApp Web internal that no longer exists, so group creation is Baileys-only.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':groupId/participants'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Add participants to a group' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.ParticipantsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Participants processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: PACED_PARTICIPANT_400 }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.ParticipantsDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "addParticipants", null);
__decorate([
    (0, common_1.Delete)(':groupId/participants'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Remove participants from a group' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.ParticipantsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Participants processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: PARTICIPANT_ID_400 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.ParticipantsDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "removeParticipants", null);
__decorate([
    (0, common_1.Post)(':groupId/participants/promote'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Promote participants to admin' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.ParticipantsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Participants processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiResponse)({ status: 400, description: PARTICIPANT_ID_400 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.ParticipantsDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "promoteParticipants", null);
__decorate([
    (0, common_1.Post)(':groupId/participants/demote'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Demote participants from admin' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.ParticipantsDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Participants processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiResponse)({ status: 400, description: PARTICIPANT_ID_400 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.ParticipantsDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "demoteParticipants", null);
__decorate([
    (0, common_1.Get)(':groupId/membership-requests'),
    (0, swagger_1.ApiOperation)({
        summary: 'List pending join requests for a group',
        description: 'The join-approval queue of a group the account administers (join-approval mode on). ' +
            'Admin-only on both engines — a non-admin read is refused. Fields the engine does not ' +
            'report are omitted rather than defaulted.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending membership requests', type: [group_response_dto_1.GroupMembershipRequestDto] }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — retry shortly.' + THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getMembershipRequests", null);
__decorate([
    (0, common_1.Post)(':groupId/membership-requests/approve'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Approve pending join requests',
        description: 'Approves the named requesters, or EVERY pending request when the body names none. ' +
            'Approving an empty queue is a no-op that returns an empty results list. On whatsapp-web.js ' +
            'the engine pauses 250-500ms between requesters (upstream anti-abuse pacing), so acting on a ' +
            'large queue is a proportionally long request.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.MembershipRequestActionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Requests processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal of NAMED requesters is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: BODY_OR_SESSION_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.MembershipRequestActionDto, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "approveMembershipRequests", null);
__decorate([
    (0, common_1.Post)(':groupId/membership-requests/reject'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reject pending join requests',
        description: 'Rejects the named requesters, or EVERY pending request when the body names none. ' +
            'Rejecting an empty queue is a no-op that returns an empty results list. On whatsapp-web.js ' +
            'the engine pauses 250-500ms between requesters (upstream anti-abuse pacing), so acting on a ' +
            'large queue is a proportionally long request.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.MembershipRequestActionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Requests processed — `results` carries the per-participant outcome (a partial refusal does not fail the batch; a total refusal of NAMED requesters is an error)',
        type: group_response_dto_1.ParticipantsOperationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: PARTICIPANTS_503 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: BODY_OR_SESSION_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 403, description: engine_status_responses_1.ENGINE_REFUSED_403 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.MembershipRequestActionDto, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "rejectMembershipRequests", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':groupId/subject'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Change group name/subject' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.GroupSubjectDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subject updated', type: group_response_dto_1.GroupAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused the change — admin rights are required' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: BODY_OR_SESSION_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.GroupSubjectDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "setSubject", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':groupId/description'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Change group description' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.GroupDescriptionDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Description updated', type: group_response_dto_1.GroupAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused the change — admin rights are required' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: BODY_OR_SESSION_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.GroupDescriptionDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "setDescription", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':groupId/member-label'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: "Set this account's member label in a group",
        description: "Sets the per-group label WhatsApp shows beside this account's name in the group; an empty string clears " +
            'it. Baileys only: whatsapp-web.js has no member-label setter and answers 501.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiBody)({ type: group_dto_1.GroupMemberLabelDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The label message was handed to WhatsApp. Baileys sends it to the group as a protocol message with no ' +
            'per-request confirmation, and group metadata does not carry the label, so it cannot be read back.',
        type: group_response_dto_1.GroupAckResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'The body failed validation (`label` missing, not a string, or longer than 30 UTF-16 code units), the id ' +
            'does not name a group, or the session is not started (no engine is running for it).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'WhatsApp refused the group lookup the label message depends on, for example because the account is ' +
            'no longer a member of the group',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 501,
        description: 'Not supported by the active engine: whatsapp-web.js has no member-label setter, so this is Baileys-only.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The label may or may not have been sent; the ' +
            'gateway stopped waiting for the send to finish.' +
            THROTTLED_503,
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.GroupMemberLabelDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "setMemberLabel", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':groupId/leave'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Leave a group' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Left the group', type: group_response_dto_1.GroupAckResponseDto }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "leave", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':groupId/picture'),
    (0, swagger_1.ApiOperation)({ summary: "Get the group's picture URL" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Picture URL, or null when the group has none',
        type: group_response_dto_1.GroupPictureResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The id does not name a group, or the session is not active' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget — nothing could be read.' +
            THROTTLED_503 +
            ' On Baileys, a WhatsApp server error (5xx) on the lookup also answers 503.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getPicture", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':groupId/picture'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Set the group's picture" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group picture updated', type: group_response_dto_1.GroupAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'The id does not name a group, the session is not active, neither url nor base64 was supplied, ' +
            'the url answers non-2xx, times out or cannot be reached, or the image cannot be read (Baileys ' +
            'refuses an SVG)',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused the change — admin rights required' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503 +
            ' ' +
            engine_status_responses_1.MEDIA_URL_PROXY_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    (0, swagger_1.ApiResponse)({ status: 413, description: engine_status_responses_1.MEDIA_TOO_LARGE_413 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.SetGroupPictureDto]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "setPicture", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Delete)(':groupId/picture'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Remove the group's picture" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group picture removed', type: group_response_dto_1.GroupAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'The id does not name a group, or the session is not active' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'The engine refused the change — admin rights required' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.' +
            THROTTLED_503,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "deletePicture", null);
__decorate([
    (0, common_1.Get)(':groupId/invite-code'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get group invite code/link' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Group invite code', type: group_response_dto_1.GroupInviteCodeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: INVITE_CODE_403 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: INVITE_CODE_503 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getInviteCode", null);
__decorate([
    (0, common_1.Post)(':groupId/invite-code/revoke'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke group invite code and generate new one' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'groupId', description: 'Group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New invite code generated', type: group_response_dto_1.GroupInviteCodeRevokedResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: INVITE_CODE_403 }),
    (0, swagger_1.ApiResponse)({ status: 503, description: INVITE_CODE_503 }),
    (0, swagger_1.ApiResponse)({ status: 400, description: engine_status_responses_1.SESSION_NOT_STARTED_400 }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: engine_status_responses_1.GROUP_NOT_FOUND_404 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "revokeInviteCode", null);
exports.GroupController = GroupController = __decorate([
    (0, swagger_1.ApiTags)('groups'),
    (0, common_1.Controller)('sessions/:sessionId/groups'),
    __metadata("design:paramtypes", [group_service_1.GroupService])
], GroupController);
//# sourceMappingURL=group.controller.js.map