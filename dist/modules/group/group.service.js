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
exports.GroupService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const media_cap_util_1 = require("../message/media-cap.util");
const wa_id_1 = require("../../engine/identity/wa-id");
const wa_id_2 = require("../../engine/identity/wa-id");
const paginate_1 = require("../../common/utils/paginate");
const send_pacing_service_1 = require("../message/send-pacing.service");
const logger_service_1 = require("../../common/services/logger.service");
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
const engine_throttled_error_1 = require("../../common/errors/engine-throttled.error");
function contactedNobody(error) {
    return (error instanceof common_1.HttpException &&
        (error.getStatus() < 500 || error instanceof engine_not_supported_error_1.EngineNotSupportedError || error instanceof engine_throttled_error_1.EngineThrottledError));
}
let GroupService = class GroupService {
    engines;
    pacing;
    logger = (0, logger_service_1.createLogger)('GroupService');
    constructor(engines, pacing) {
        this.engines = engines;
        this.pacing = pacing;
    }
    getEngine(sessionId) {
        return this.engines.require(sessionId);
    }
    assertAddressableParticipants(participants) {
        const invalid = participants.filter(p => !(0, wa_id_2.isAddressableParticipant)(p));
        if (invalid.length) {
            throw new common_1.BadRequestException(`Not an individual participant id: ${invalid.join(', ')} — pass a phone number, <phone>@c.us or <lid>@lid`);
        }
    }
    listGroups(sessionId) {
        return this.getEngine(sessionId).getGroups();
    }
    getGroups(sessionId, opts = {}) {
        return this.listGroups(sessionId).then(groups => (0, paginate_1.paginate)(groups, opts.limit, opts.offset));
    }
    async getGroupInfo(sessionId, groupId) {
        const group = await this.getEngine(sessionId).getGroupInfo(groupId);
        if (!group) {
            throw new common_1.NotFoundException(`Group ${groupId} not found`);
        }
        return group;
    }
    async createGroup(sessionId, name, participants) {
        this.assertAddressableParticipants(participants);
        const reservation = await this.pacing.assertReachoutAllowed(sessionId, participants);
        try {
            return await this.getEngine(sessionId).createGroup(name, participants);
        }
        catch (error) {
            if (contactedNobody(error))
                this.pacing.refundGroupReachouts(sessionId, reservation);
            throw error;
        }
    }
    async addParticipants(sessionId, groupId, participants) {
        this.assertAddressableParticipants(participants);
        const reservation = await this.pacing.assertReachoutAllowed(sessionId, participants);
        try {
            return await this.getEngine(sessionId).addParticipants(groupId, participants);
        }
        catch (error) {
            if (contactedNobody(error))
                this.pacing.refundGroupReachouts(sessionId, reservation);
            throw error;
        }
    }
    removeParticipants(sessionId, groupId, participants) {
        this.assertAddressableParticipants(participants);
        return this.getEngine(sessionId).removeParticipants(groupId, participants);
    }
    promoteParticipants(sessionId, groupId, participants) {
        this.assertAddressableParticipants(participants);
        return this.getEngine(sessionId).promoteParticipants(groupId, participants);
    }
    demoteParticipants(sessionId, groupId, participants) {
        this.assertAddressableParticipants(participants);
        return this.getEngine(sessionId).demoteParticipants(groupId, participants);
    }
    getGroupMembershipRequests(sessionId, groupId) {
        return this.getEngine(sessionId).getGroupMembershipRequests(groupId);
    }
    approveGroupMembershipRequests(sessionId, groupId, participants) {
        if (participants)
            this.assertAddressableParticipants(participants);
        return this.getEngine(sessionId).approveGroupMembershipRequests(groupId, participants);
    }
    rejectGroupMembershipRequests(sessionId, groupId, participants) {
        if (participants)
            this.assertAddressableParticipants(participants);
        return this.getEngine(sessionId).rejectGroupMembershipRequests(groupId, participants);
    }
    setGroupSubject(sessionId, groupId, subject) {
        return this.getEngine(sessionId).setGroupSubject(groupId, subject);
    }
    setGroupDescription(sessionId, groupId, description) {
        return this.getEngine(sessionId).setGroupDescription(groupId, description);
    }
    setGroupMemberLabel(sessionId, groupId, label) {
        this.assertGroupId(groupId);
        return this.getEngine(sessionId).setGroupMemberLabel((0, wa_id_1.toNeutralJid)(groupId), label);
    }
    leaveGroup(sessionId, groupId) {
        return this.getEngine(sessionId).leaveGroup(groupId);
    }
    getGroupInviteCode(sessionId, groupId) {
        return this.getEngine(sessionId).getGroupInviteCode(groupId);
    }
    revokeGroupInviteCode(sessionId, groupId) {
        return this.getEngine(sessionId).revokeGroupInviteCode(groupId);
    }
    getGroupJoinInfo(sessionId, inviteCode) {
        const code = this.requireInviteCode(inviteCode);
        return this.getEngine(sessionId).getGroupJoinInfo(code);
    }
    joinGroupViaInviteCode(sessionId, inviteCode) {
        const code = this.requireInviteCode(inviteCode);
        return this.getEngine(sessionId).joinGroupViaInviteCode(code);
    }
    requireInviteCode(inviteCode) {
        const code = inviteCode?.trim();
        if (!code) {
            throw new common_1.BadRequestException('An invite code is required');
        }
        return code;
    }
    assertGroupId(groupId) {
        if ((0, wa_id_1.chatKind)(groupId) !== 'group' || groupId.indexOf('@') !== groupId.lastIndexOf('@')) {
            throw new common_1.BadRequestException(`${groupId} is not a group id`);
        }
    }
    getGroupPicture(sessionId, groupId) {
        this.assertGroupId(groupId);
        return this.getEngine(sessionId).getProfilePicture(groupId);
    }
    setGroupPicture(sessionId, groupId, dto) {
        this.assertGroupId(groupId);
        const media = (0, media_cap_util_1.resolveMediaBody)(dto, {
            fallbackMimetype: 'image/jpeg',
            requireMimetypeForBase64: true,
            checkUrl: true,
        });
        return this.getEngine(sessionId).setGroupPicture(groupId, media);
    }
    deleteGroupPicture(sessionId, groupId) {
        this.assertGroupId(groupId);
        return this.getEngine(sessionId).deleteGroupPicture(groupId);
    }
    async getGroupSettings(sessionId, groupId) {
        const group = await this.getGroupInfo(sessionId, groupId);
        return {
            announce: group.announce,
            locked: group.locked,
            ...(group.ephemeralSeconds !== undefined ? { ephemeralSeconds: group.ephemeralSeconds } : {}),
            ...(group.memberAddMode !== undefined ? { memberAddMode: group.memberAddMode } : {}),
        };
    }
    async updateGroupSettings(sessionId, groupId, settings) {
        const { announce, locked, ephemeralSeconds, memberAddMode } = settings;
        if (announce === undefined &&
            locked === undefined &&
            ephemeralSeconds === undefined &&
            memberAddMode === undefined) {
            throw new common_1.BadRequestException('At least one of announce, locked, ephemeralSeconds, memberAddMode must be provided');
        }
        const engine = this.getEngine(sessionId);
        const steps = [];
        if (ephemeralSeconds !== undefined) {
            steps.push(['ephemeralSeconds', () => engine.setGroupEphemeral(groupId, ephemeralSeconds)]);
        }
        if (memberAddMode !== undefined) {
            steps.push(['memberAddMode', () => engine.setGroupMemberAddMode(groupId, memberAddMode)]);
        }
        if (announce !== undefined) {
            steps.push(['announce', () => engine.setGroupMessagesAdminsOnly(groupId, announce)]);
        }
        if (locked !== undefined) {
            steps.push(['locked', () => engine.setGroupInfoAdminsOnly(groupId, locked)]);
        }
        const applied = [];
        for (const [field, apply] of steps) {
            try {
                await apply();
                applied.push(field);
            }
            catch (error) {
                if (applied.length === 0)
                    throw error;
                const status = error instanceof common_1.HttpException ? error.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                let detail = 'internal error';
                if (error instanceof common_1.HttpException) {
                    detail = error.message;
                }
                else {
                    this.logger.error('Group settings step failed after a partial apply', error instanceof Error ? error.stack : String(error), { sessionId, groupId, field, applied: applied.join(',') });
                }
                throw new common_1.HttpException(`Group settings only partially applied: '${field}' failed (${detail}); already applied: ${applied.join(', ')}`, status);
            }
        }
    }
};
exports.GroupService = GroupService;
exports.GroupService = GroupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry,
        send_pacing_service_1.SendPacingService])
], GroupService);
//# sourceMappingURL=group.service.js.map