"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysGroups = void 0;
exports.refusedStatusCode = refusedStatusCode;
exports.mapServerRefusal = mapServerRefusal;
exports.toEngineParticipants = toEngineParticipants;
exports.collectGroupLidTwins = collectGroupLidTwins;
const baileys_group_mapper_1 = require("./baileys-group-mapper");
const group_not_found_error_1 = require("../../common/errors/group-not-found.error");
const baileys_messaging_1 = require("./baileys-messaging");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const engine_throttled_error_1 = require("../../common/errors/engine-throttled.error");
const invalid_invite_code_error_1 = require("../../common/errors/invalid-invite-code.error");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
const wa_id_1 = require("../identity/wa-id");
function refusedStatusCode(error) {
    const err = error;
    return typeof err?.data === 'number' ? err.data : undefined;
}
async function mapServerRefusal(operation, op, classify = refusedStatusCode, notFound) {
    try {
        return await op();
    }
    catch (error) {
        const code = classify(error);
        if (code === 404 && notFound) {
            throw notFound();
        }
        if (code === 429) {
            throw new engine_throttled_error_1.EngineThrottledError(`${operation} was rate-limited by WhatsApp (code ${code})`);
        }
        if (code === 408) {
            throw new engine_transport_error_1.EngineTransportError(`${operation} was timed out by WhatsApp (code ${code})`);
        }
        if (code !== undefined && code >= 400 && code < 500) {
            throw new engine_refused_error_1.EngineRefusedError(`${operation} was refused by WhatsApp (code ${code}) — admin rights or permissions may be missing`);
        }
        throw error;
    }
}
function toEngineParticipants(participants, toEngineJid) {
    return participants.map(p => toEngineJid((0, wa_id_1.toParticipantWid)(p)));
}
const MEMBERSHIP_REQUEST_METHODS = [
    'invite_link',
    'non_admin_add',
    'linked_group_join',
];
function collectGroupLidTwins(metadata) {
    const twins = [];
    for (const p of metadata.participants ?? []) {
        if (p.id?.endsWith('@lid') && p.phoneNumber) {
            twins.push({ lid: p.id, pn: p.phoneNumber });
        }
    }
    if (metadata.owner?.endsWith('@lid') && metadata.ownerPn) {
        twins.push({ lid: metadata.owner, pn: metadata.ownerPn });
    }
    return twins;
}
class BaileysGroups {
    host;
    queryBudgetMs;
    constructor(host, queryBudgetMs = baileys_query_deadline_1.BAILEYS_QUERY_BUDGET_MS) {
        this.host = host;
        this.queryBudgetMs = queryBudgetMs;
    }
    confirmed(work, operation) {
        return (0, baileys_query_deadline_1.confirmedWrite)(work, this.queryBudgetMs, operation);
    }
    sock() {
        return this.host.getSocket();
    }
    async groupWrite(groupId, operation, op) {
        try {
            return await mapServerRefusal(operation, op, refusedStatusCode, () => new group_not_found_error_1.GroupNotFoundError(groupId));
        }
        finally {
            this.host.forgetGroupMetadata?.(groupId);
        }
    }
    toEngineParticipants(participants) {
        return toEngineParticipants(participants, jid => this.host.toEngineJid(jid));
    }
    async getGroups() {
        this.host.ensureReady();
        let all;
        try {
            all = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupFetchAllParticipating(), this.queryBudgetMs, 'WhatsApp did not answer the group list query in time');
        }
        catch (err) {
            const code = refusedStatusCode(err);
            if (code === 408 || code === 429) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp rate-limited or timed out the group list query (code ${code})`);
            }
            throw err;
        }
        const self = this.host.normalizedSelfJid();
        return Object.values(all).map(metadata => (0, baileys_group_mapper_1.mapBaileysGroup)(metadata, self, jid => this.host.toNeutralJid(jid)));
    }
    async getGroupInfo(groupId) {
        this.host.ensureReady();
        try {
            const metadata = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupMetadata(groupId), this.queryBudgetMs, 'WhatsApp did not answer the group metadata query in time');
            this.host.addLidMappings(collectGroupLidTwins(metadata));
            return (0, baileys_group_mapper_1.mapBaileysGroupInfo)(metadata, jid => this.host.toNeutralJid(jid), this.host.normalizedSelfJid());
        }
        catch (err) {
            const code = refusedStatusCode(err);
            if (code === 408 || code === 429) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp rate-limited or timed out the group metadata query (code ${code})`);
            }
            if (code === 401 || code === 403 || code === 404) {
                this.host.logger.debug('groupMetadata refused; treating as not-found', {
                    groupId,
                    error: err instanceof Error ? err.message : String(err),
                });
                return null;
            }
            throw err;
        }
    }
    async createGroup(name, participants) {
        this.host.ensureReady();
        const metadata = await mapServerRefusal('Creating the group', () => this.sock().groupCreate(name, this.toEngineParticipants(participants)), error => {
            const code = refusedStatusCode(error);
            return code === 408 ? undefined : code;
        });
        return (0, baileys_group_mapper_1.mapBaileysGroup)(metadata, this.host.normalizedSelfJid(), jid => this.host.toNeutralJid(jid));
    }
    async addParticipants(groupId, participants) {
        return this.runParticipantsUpdate(groupId, participants, 'add');
    }
    async removeParticipants(groupId, participants) {
        return this.runParticipantsUpdate(groupId, participants, 'remove');
    }
    async promoteParticipants(groupId, participants) {
        return this.runParticipantsUpdate(groupId, participants, 'promote');
    }
    async demoteParticipants(groupId, participants) {
        return this.runParticipantsUpdate(groupId, participants, 'demote');
    }
    async runParticipantsUpdate(groupId, participants, action) {
        this.host.ensureReady();
        const raw = await this.groupWrite(groupId, `The participant ${action}`, () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupParticipantsUpdate(groupId, this.toEngineParticipants(participants), action), this.queryBudgetMs, `WhatsApp did not answer the participant ${action} in time`));
        const results = (raw ?? []).map(entry => ({
            id: entry.jid ? this.host.toNeutralJid(entry.jid) : '',
            success: entry.status === '200',
            status: Number.isFinite(Number(entry.status)) ? Number(entry.status) : undefined,
        }));
        if (results.length === 0) {
            throw new engine_refused_error_1.EngineRefusedError(`groupParticipantsUpdate(${action}) returned no per-participant outcome for group ${groupId}`);
        }
        if (results.every(r => !r.success)) {
            const detail = results.map(r => `${r.id || '?'} (${r.status ?? '?'})`).join(', ');
            throw new engine_refused_error_1.EngineRefusedError(`${action}Participants failed for all ${results.length} participant(s) in group ${groupId}: ${detail}`);
        }
        return results;
    }
    async leaveGroup(groupId) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Leaving the group', () => this.confirmed(this.sock().groupLeave(groupId), 'leaving the group'));
    }
    async setGroupSubject(groupId, subject) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting the group subject', () => this.confirmed(this.sock().groupUpdateSubject(groupId, subject), 'the group subject change'));
    }
    async setGroupDescription(groupId, description) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting the group description', () => this.confirmed(this.sock().groupUpdateDescription(groupId, description), 'the group description change'));
    }
    async getGroupInviteCode(groupId) {
        this.host.ensureReady();
        const code = await this.groupWrite(groupId, 'Fetching the group invite code', () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupInviteCode(groupId), this.queryBudgetMs, 'WhatsApp did not answer the group invite-code query in time'));
        if (!code) {
            throw new engine_transport_error_1.EngineTransportError('WhatsApp did not answer the group invite-code query');
        }
        return code;
    }
    async revokeGroupInviteCode(groupId) {
        this.host.ensureReady();
        const code = await this.groupWrite(groupId, 'Revoking the group invite code', () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupRevokeInvite(groupId), this.queryBudgetMs, 'WhatsApp did not answer the group invite-code revocation in time'));
        if (!code) {
            throw new engine_transport_error_1.EngineTransportError('WhatsApp did not answer the group invite-code revocation');
        }
        return code;
    }
    async getGroupJoinInfo(inviteCode) {
        this.host.ensureReady();
        let meta;
        try {
            meta = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupGetInviteInfo(inviteCode), this.queryBudgetMs, 'WhatsApp did not answer the invite-info query in time');
        }
        catch (error) {
            const code = refusedStatusCode(error);
            if (code === 408 || code === 429) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp rate-limited or timed out the invite-info query (code ${code})`);
            }
            if (code !== undefined && code >= 400 && code < 500) {
                throw new group_not_found_error_1.GroupNotFoundError(inviteCode);
            }
            throw error;
        }
        if (!meta?.id) {
            throw new group_not_found_error_1.GroupNotFoundError(inviteCode);
        }
        const count = typeof meta.size === 'number' ? meta.size : meta.participants?.length;
        return {
            id: this.host.toNeutralJid(meta.id),
            name: String(meta.subject ?? ''),
            ...(meta.desc ? { description: String(meta.desc) } : {}),
            ...((meta.ownerPn ?? meta.owner) ? { owner: this.host.toNeutralJid(meta.ownerPn ?? meta.owner) } : {}),
            ...(typeof meta.creation === 'number' ? { createdAt: meta.creation } : {}),
            ...(typeof count === 'number' ? { participantCount: count } : {}),
        };
    }
    async joinGroupViaInviteCode(inviteCode) {
        this.host.ensureReady();
        let jid;
        try {
            jid = await (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupAcceptInvite(inviteCode), this.queryBudgetMs, 'WhatsApp did not answer the group join in time');
        }
        catch (error) {
            const code = refusedStatusCode(error);
            if (code === undefined || code < 400 || code >= 500) {
                throw error;
            }
            if (code === 408 || code === 429) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp rate-limited or timed out the group join (code ${code})`);
            }
            this.host.logger.warn('Group invite refused', { error: String(error) });
            jid = undefined;
        }
        if (!jid) {
            throw new invalid_invite_code_error_1.InvalidInviteCodeError();
        }
        return this.host.toNeutralJid(jid);
    }
    async setGroupMessagesAdminsOnly(groupId, adminsOnly) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting who may send messages', () => this.confirmed(this.sock().groupSettingUpdate(groupId, adminsOnly ? 'announcement' : 'not_announcement'), 'the who-may-send change'));
    }
    async setGroupInfoAdminsOnly(groupId, adminsOnly) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting who may edit group info', () => this.confirmed(this.sock().groupSettingUpdate(groupId, adminsOnly ? 'locked' : 'unlocked'), 'the who-may-edit change'));
    }
    async setGroupPicture(groupId, media) {
        this.host.ensureReady();
        const { data } = await (0, baileys_messaging_1.resolveMediaBuffer)(media, this.host.sessionProxyUrl());
        await (0, baileys_messaging_1.assertReadableImage)(data);
        await this.pictureWrite(groupId, 'Setting the group picture', () => this.confirmed(this.sock().updateProfilePicture(groupId, data), 'the group picture change'));
    }
    async deleteGroupPicture(groupId) {
        this.host.ensureReady();
        await this.pictureWrite(groupId, 'Removing the group picture', () => this.confirmed(this.sock().removeProfilePicture(groupId), 'the group picture removal'));
    }
    async pictureWrite(groupId, operation, op) {
        try {
            await mapServerRefusal(operation, op);
        }
        catch (err) {
            if (err instanceof engine_refused_error_1.EngineRefusedError) {
                const lookupCode = await Promise.resolve()
                    .then(() => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupMetadata(groupId), this.queryBudgetMs, 'WhatsApp did not answer the group metadata query in time'))
                    .then(() => undefined, (lookupErr) => refusedStatusCode(lookupErr));
                if (lookupCode === 404)
                    throw new group_not_found_error_1.GroupNotFoundError(groupId);
            }
            throw err;
        }
    }
    async setGroupMemberAddMode(groupId, mode) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting the member-add mode', () => this.confirmed(this.sock().groupMemberAddMode(groupId, mode === 'admins' ? 'admin_add' : 'all_member_add'), 'the member-add-mode change'));
    }
    async setGroupEphemeral(groupId, durationSec) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting the disappearing-message timer', () => this.confirmed(this.sock().groupToggleEphemeral(groupId, durationSec), 'the disappearing-message timer change'));
    }
    async setGroupMemberLabel(groupId, label) {
        this.host.ensureReady();
        await this.groupWrite(groupId, 'Setting the member label', () => this.confirmed(this.sock().updateMemberLabel(groupId, label), 'the member label change'));
    }
    async getGroupMembershipRequests(groupId) {
        this.host.ensureReady();
        const raw = await this.groupWrite(groupId, 'Listing the membership requests', () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupRequestParticipantsList(groupId), this.queryBudgetMs, 'WhatsApp did not answer the membership-request list query in time'));
        return (raw ?? []).flatMap(attrs => {
            if (!attrs.jid) {
                return [];
            }
            const method = MEMBERSHIP_REQUEST_METHODS.includes(attrs.request_method)
                ? attrs.request_method
                : undefined;
            const requestedAt = Number(attrs.request_time);
            return [
                {
                    participantId: this.host.toNeutralJid(attrs.jid),
                    ...(method ? { method } : {}),
                    ...(Number.isFinite(requestedAt) && requestedAt > 0 ? { requestedAt: Math.floor(requestedAt) } : {}),
                },
            ];
        });
    }
    approveGroupMembershipRequests(groupId, participants) {
        return this.runMembershipRequestsUpdate(groupId, participants, 'approve');
    }
    rejectGroupMembershipRequests(groupId, participants) {
        return this.runMembershipRequestsUpdate(groupId, participants, 'reject');
    }
    async runMembershipRequestsUpdate(groupId, participants, action) {
        this.host.ensureReady();
        let targets;
        if (participants) {
            targets = this.toEngineParticipants(participants);
        }
        else {
            const pending = await this.groupWrite(groupId, `Listing the membership requests to ${action}`, () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupRequestParticipantsList(groupId), this.queryBudgetMs, 'WhatsApp did not answer the membership-request list query in time'));
            targets = (pending ?? []).map(attrs => attrs.jid).filter((jid) => Boolean(jid));
            if (targets.length === 0) {
                return [];
            }
        }
        const raw = await this.groupWrite(groupId, `Membership-request ${action}`, () => (0, baileys_query_deadline_1.withQueryDeadline)(this.sock().groupRequestParticipantsUpdate(groupId, targets, action), this.queryBudgetMs, `WhatsApp did not answer the membership-request ${action} in time`));
        const results = (raw ?? []).map(entry => ({
            id: entry.jid ? this.host.toNeutralJid(entry.jid) : '',
            success: entry.status === '200',
            status: Number.isFinite(Number(entry.status)) ? Number(entry.status) : undefined,
        }));
        if (!participants) {
            return results;
        }
        if (results.length === 0) {
            throw new engine_refused_error_1.EngineRefusedError(`groupRequestParticipantsUpdate(${action}) returned no per-participant outcome for group ${groupId}`);
        }
        if (results.every(r => !r.success)) {
            const detail = results.map(r => `${r.id || '?'} (${r.status ?? '?'})`).join(', ');
            throw new engine_refused_error_1.EngineRefusedError(`Membership-request ${action} failed for all ${results.length} participant(s) in group ${groupId}: ${detail}`);
        }
        return results;
    }
}
exports.BaileysGroups = BaileysGroups;
//# sourceMappingURL=baileys-groups.js.map