"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsGroups = void 0;
exports.extractLinkedParentJID = extractLinkedParentJID;
exports.revokeInviteInPage = revokeInviteInPage;
exports.normalizeWwebjsMemberAddMode = normalizeWwebjsMemberAddMode;
exports.normalizeWwebjsRequestMethod = normalizeWwebjsRequestMethod;
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const wa_id_1 = require("../identity/wa-id");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
const group_not_found_error_1 = require("../../common/errors/group-not-found.error");
const invalid_invite_code_error_1 = require("../../common/errors/invalid-invite-code.error");
const wwebjs_messaging_1 = require("./wwebjs-messaging");
const wwebjs_host_1 = require("./wwebjs-host");
const wwebjs_lifecycle_1 = require("./wwebjs-lifecycle");
const wwebjs_chats_1 = require("./wwebjs-chats");
function extractLinkedParentJID(groupMetadata) {
    const candidate = groupMetadata?.parentGroup ?? groupMetadata?.linkedParentGroup ?? groupMetadata?.linkedParent ?? null;
    if (!candidate) {
        return null;
    }
    return (0, whatsapp_web_js_types_1.readWid)(candidate) ?? null;
}
async function revokeInviteInPage(chatId) {
    const w = window;
    try {
        const res = await w
            .require('WAWebGroupQueryJob')
            .resetGroupInviteCode(w.require('WAWebWidFactory').createWid(chatId));
        return res?.code;
    }
    catch (err) {
        if (err?.name === 'ServerStatusCodeError')
            return undefined;
        throw err;
    }
}
function normalizeWwebjsMemberAddMode(raw) {
    if (raw === 'admin_add')
        return 'admins';
    if (raw === 'all_member_add')
        return 'all';
    if (raw === true)
        return 'admins';
    if (raw === false)
        return 'all';
    return undefined;
}
function normalizeWwebjsRequestMethod(raw) {
    if (raw === 'InviteLink')
        return 'invite_link';
    if (raw === 'NonAdminAdd')
        return 'non_admin_add';
    if (raw === 'LinkedGroupJoin')
        return 'linked_group_join';
    return undefined;
}
class WwebjsGroups {
    host;
    constructor(host) {
        this.host = host;
    }
    client() {
        return this.host.getClient();
    }
    async getGroups() {
        this.host.ensureReady();
        const client = this.client();
        const chats = await (0, wwebjs_chats_1.listChats)(this.host, 'getGroups');
        const groups = chats.filter(chat => chat.isGroup);
        return groups.map(g => {
            const groupChat = g;
            return {
                id: g.id._serialized,
                name: g.name,
                participantsCount: groupChat.participants?.length,
                isAdmin: groupChat.participants?.some(p => p.isAdmin && (0, whatsapp_web_js_types_1.readWid)(p.id) !== undefined && (0, whatsapp_web_js_types_1.readWid)(p.id) === (0, whatsapp_web_js_types_1.readWid)(client.info?.wid)),
                linkedParentJID: extractLinkedParentJID(groupChat.groupMetadata),
            };
        });
    }
    async getGroupInfo(groupId) {
        this.host.ensureReady();
        try {
            const chat = await this.client()
                .getChatById(groupId)
                .catch(async (error) => {
                if (!(0, wwebjs_chats_1.isPageInvariant)(error))
                    throw error;
                return (await (0, wwebjs_chats_1.readChats)(this.host, 'getGroupInfo', [groupId]))[0];
            });
            if (!chat.isGroup) {
                return null;
            }
            const groupChat = chat;
            const participants = (groupChat.participants || [])
                .filter(p => (0, whatsapp_web_js_types_1.readWid)(p.id) !== undefined)
                .map(p => ({
                id: (0, whatsapp_web_js_types_1.readWid)(p.id),
                number: String(p.id.user),
                name: p.name ? String(p.name) : undefined,
                isAdmin: Boolean(p.isAdmin),
                isSuperAdmin: Boolean(p.isSuperAdmin),
            }));
            const creation = groupChat.groupMetadata?.creation;
            const announce = Boolean(groupChat.groupMetadata?.announce);
            const selfWid = (0, whatsapp_web_js_types_1.readWid)(this.client().info?.wid);
            const selfIsAdmin = participants.some(p => p.isAdmin && selfWid !== undefined && p.id === selfWid);
            return {
                id: chat.id._serialized,
                name: chat.name,
                description: groupChat.description ? String(groupChat.description) : undefined,
                owner: (0, whatsapp_web_js_types_1.readWid)(groupChat.owner),
                createdAt: typeof creation === 'number' ? creation : undefined,
                participants,
                isReadOnly: announce && !selfIsAdmin,
                isAnnounce: announce,
                announce: groupChat.groupMetadata?.announce,
                locked: groupChat.groupMetadata?.restrict,
                ephemeralSeconds: groupChat.groupMetadata?.ephemeralDuration,
                memberAddMode: normalizeWwebjsMemberAddMode(groupChat.groupMetadata?.memberAddMode),
                linkedParentJID: extractLinkedParentJID(groupChat.groupMetadata),
            };
        }
        catch (error) {
            if (error instanceof engine_not_ready_error_1.EngineNotReadyError) {
                throw error;
            }
            (0, wwebjs_host_1.rethrowIfNavigation)(this.host, error);
            if (this.host.isPageTransportError(error)) {
                this.host.reportIfPageTransportError(error, 'getGroupInfo');
                throw new engine_transport_error_1.EngineTransportError(`Transport died while reading group ${groupId}`);
            }
            if ((0, wwebjs_lifecycle_1.isProtocolTimeout)(error)) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp Web did not answer the read of group ${groupId} in time`);
            }
            this.host.logger.warn(`Failed to get group: ${groupId}`, { error: String(error) });
            return null;
        }
    }
    async createGroup(_name, _participants) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('createGroup');
    }
    async addParticipants(groupId, participants) {
        const chat = await this.requireGroupChat(groupId, 'addParticipants');
        const participantIds = participants.map(wa_id_1.toParticipantWid);
        const raw = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'addParticipants', () => chat.addParticipants(participantIds));
        if (typeof raw === 'string') {
            throw new engine_refused_error_1.EngineRefusedError(raw);
        }
        const results = Object.entries(raw ?? {}).map(([id, r]) => {
            const inviteSent = r.code === 403 && r.isInviteV4Sent === true;
            return {
                id,
                success: r.code === 200 || inviteSent,
                status: r.code,
                message: inviteSent
                    ? 'the participant can only be added by private invitation — invite sent'
                    : r.message || undefined,
            };
        });
        return this.assertParticipantResults('addParticipants', groupId, results);
    }
    async removeParticipants(groupId, participants) {
        return this.runStatusOnlyParticipantOp('removeParticipants', groupId, participants);
    }
    async promoteParticipants(groupId, participants) {
        return this.runStatusOnlyParticipantOp('promoteParticipants', groupId, participants);
    }
    async demoteParticipants(groupId, participants) {
        return this.runStatusOnlyParticipantOp('demoteParticipants', groupId, participants);
    }
    async runStatusOnlyParticipantOp(op, groupId, participants) {
        const chat = await this.requireGroupChat(groupId, op);
        const participantIds = participants.map(wa_id_1.toParticipantWid);
        const res = await this.runParticipantBatch(op, groupId, chat, participantIds);
        if (res?.status !== 200) {
            throw new engine_refused_error_1.EngineRefusedError(`${op} refused for group ${groupId} (status ${res?.status ?? 'unknown'})`);
        }
        const matched = Array.isArray(res.matched) && res.matched.length === participantIds.length ? res.matched : null;
        const results = participantIds.map((id, i) => {
            const resolved = matched ? matched[i] === true : true;
            return {
                id,
                success: resolved,
                status: resolved ? 200 : 404,
                message: resolved
                    ? 'confirmed with the batch — wwebjs reports no per-participant outcome'
                    : 'not a member of this group — WhatsApp was not asked to act on this participant',
            };
        });
        return this.assertParticipantResults(op, groupId, results);
    }
    async runParticipantBatch(op, groupId, chat, participantIds) {
        try {
            return await (0, wwebjs_host_1.reportPageDeath)(this.host, op, () => chat[op](participantIds));
        }
        catch (error) {
            if (/expected at least 1 children/.test(error?.message ?? '')) {
                throw new engine_refused_error_1.EngineRefusedError(`${op}: none of the requested participants is a member of group ${groupId}`);
            }
            throw error;
        }
    }
    assertParticipantResults(op, groupId, results) {
        if (results.length === 0) {
            throw new engine_refused_error_1.EngineRefusedError(`${op} returned no per-participant outcome for group ${groupId}`);
        }
        if (results.every(r => !r.success)) {
            const detail = results.map(r => `${r.id} (${r.status ?? '?'})`).join(', ');
            throw new engine_refused_error_1.EngineRefusedError(`${op} failed for all ${results.length} participant(s) in group ${groupId}: ${detail}`);
        }
        return results;
    }
    async leaveGroup(groupId) {
        const chat = await this.requireGroupChat(groupId, 'leaveGroup');
        await (0, wwebjs_host_1.reportPageDeath)(this.host, 'leaveGroup', () => chat.leave());
    }
    async setGroupSubject(groupId, subject) {
        const chat = await this.requireGroupChat(groupId, 'setGroupSubject');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupSubject', () => chat.setSubject(subject));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to set the subject for group ${groupId} — admin rights required`);
        }
    }
    async setGroupDescription(groupId, description) {
        const chat = await this.requireGroupChat(groupId, 'setGroupDescription');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupDescription', () => chat.setDescription(description));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to set the description for group ${groupId} — admin rights required`);
        }
    }
    async getGroupInviteCode(groupId) {
        const chat = await this.requireGroupChat(groupId, 'getGroupInviteCode');
        const inviteCode = await (0, wwebjs_host_1.withPage)(this.host, 'getGroupInviteCode', () => chat.getInviteCode());
        if (!inviteCode) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to get the invite code for group ${groupId} — admin rights required`);
        }
        this.host.logger.debug('Got group invite code', { groupId });
        return inviteCode;
    }
    async revokeGroupInviteCode(groupId) {
        await this.requireGroupChat(groupId, 'revokeGroupInviteCode');
        const page = this.client().pupPage;
        const newCode = await (0, wwebjs_host_1.reportPageDeath)(this.host, 'revokeGroupInviteCode', () => page.evaluate(revokeInviteInPage, groupId));
        if (!newCode) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to revoke the invite code for group ${groupId} — admin rights required`);
        }
        this.host.logger.debug('Revoked group invite code, new code generated', { groupId });
        return newCode;
    }
    async getGroupJoinInfo(inviteCode) {
        this.host.ensureReady();
        let raw;
        try {
            raw = await this.client().getInviteInfo(inviteCode);
        }
        catch (error) {
            (0, wwebjs_host_1.rethrowIfNavigation)(this.host, error);
            if (this.host.isPageTransportError(error)) {
                this.host.reportIfPageTransportError(error, 'getGroupJoinInfo');
                throw new engine_transport_error_1.EngineTransportError(`Transport died while previewing invite ${inviteCode}`);
            }
            if ((0, wwebjs_lifecycle_1.isProtocolTimeout)(error)) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp Web did not answer the preview of invite ${inviteCode} in time`);
            }
            this.host.logger.debug('getInviteInfo rejected; treating the invite as not found', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new group_not_found_error_1.GroupNotFoundError(inviteCode);
        }
        const id = (0, whatsapp_web_js_types_1.readWid)(raw?.id);
        if (!id) {
            throw new group_not_found_error_1.GroupNotFoundError(inviteCode);
        }
        const owner = (0, whatsapp_web_js_types_1.readWid)(raw?.owner);
        const count = typeof raw?.size === 'number' ? raw.size : raw?.participants?.length;
        return {
            id,
            name: String(raw?.subject ?? ''),
            ...(raw?.desc ? { description: String(raw.desc) } : {}),
            ...(owner ? { owner } : {}),
            ...(typeof raw?.creation === 'number' ? { createdAt: raw.creation } : {}),
            ...(typeof count === 'number' ? { participantCount: count } : {}),
        };
    }
    async joinGroupViaInviteCode(inviteCode) {
        this.host.ensureReady();
        let groupId;
        try {
            groupId = await this.client().acceptInvite(inviteCode);
        }
        catch (error) {
            if (this.host.isPageTransportError(error)) {
                this.host.reportIfPageTransportError(error, 'joinGroupViaInviteCode');
                throw new engine_transport_error_1.EngineTransportError('Transport died while accepting the group invite');
            }
            if ((0, wwebjs_lifecycle_1.isProtocolTimeout)(error)) {
                throw new engine_transport_error_1.EngineTransportError('WhatsApp Web did not answer the group invite acceptance in time');
            }
            if ((0, wwebjs_lifecycle_1.isNavigationError)(error)) {
                throw new engine_transport_error_1.EngineTransportError('WhatsApp Web reloaded its page during the group invite acceptance');
            }
            this.host.logger.warn(`Failed to accept group invite: ${String(error)}`);
            groupId = undefined;
        }
        if (!groupId) {
            throw new invalid_invite_code_error_1.InvalidInviteCodeError();
        }
        this.host.logger.debug('Joined group via invite code', { groupId });
        return groupId;
    }
    async requireGroupChat(groupId, context) {
        this.host.ensureReady();
        const chat = await (0, wwebjs_host_1.withPage)(this.host, context, () => this.client().getChatById(groupId));
        if (!chat?.isGroup) {
            throw new group_not_found_error_1.GroupNotFoundError(groupId);
        }
        this.host.ensureReady();
        return chat;
    }
    async setGroupMessagesAdminsOnly(groupId, adminsOnly) {
        const groupChat = await this.requireGroupChat(groupId, 'setGroupMessagesAdminsOnly');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupMessagesAdminsOnly', () => groupChat.setMessagesAdminsOnly(adminsOnly));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to update the messages-admins-only setting for group ${groupId} — admin rights required`);
        }
    }
    async setGroupPicture(groupId, media) {
        const groupChat = await this.requireGroupChat(groupId, 'setGroupPicture');
        const picture = await (0, wwebjs_messaging_1.toMessageMedia)(media, this.host.config.proxy?.url);
        this.host.ensureReady();
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupPicture', () => groupChat.setPicture(picture));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to set the picture for group ${groupId} — admin rights required`);
        }
    }
    async deleteGroupPicture(groupId) {
        const groupChat = await this.requireGroupChat(groupId, 'deleteGroupPicture');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'deleteGroupPicture', () => groupChat.deletePicture());
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to delete the picture for group ${groupId} — admin rights required`);
        }
    }
    async setGroupMemberAddMode(groupId, mode) {
        const groupChat = await this.requireGroupChat(groupId, 'setGroupMemberAddMode');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupMemberAddMode', () => groupChat.setAddMembersAdminsOnly(mode === 'admins'));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to update the member-add-mode setting for group ${groupId} — admin rights required`);
        }
    }
    async setGroupInfoAdminsOnly(groupId, adminsOnly) {
        const groupChat = await this.requireGroupChat(groupId, 'setGroupInfoAdminsOnly');
        const ok = await (0, wwebjs_host_1.withPage)(this.host, 'setGroupInfoAdminsOnly', () => groupChat.setInfoAdminsOnly(adminsOnly));
        if (!ok) {
            throw new engine_refused_error_1.EngineRefusedError(`Failed to update the info-admins-only setting for group ${groupId} — admin rights required`);
        }
    }
    async setGroupEphemeral(_groupId, _durationSec) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('setGroupEphemeral');
    }
    async setGroupMemberLabel(_groupId, _label) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('setGroupMemberLabel');
    }
    async getGroupMembershipRequests(groupId) {
        await this.requireGroupChat(groupId, 'getGroupMembershipRequests');
        return (0, wwebjs_host_1.withPage)(this.host, 'getGroupMembershipRequests', async () => {
            const raw = await this.client().getGroupMembershipRequests(groupId);
            return (raw ?? []).flatMap(entry => {
                const e = entry;
                const participantId = (0, whatsapp_web_js_types_1.readWid)(e.id);
                if (!participantId) {
                    return [];
                }
                const addedById = (0, whatsapp_web_js_types_1.readWid)(e.addedBy);
                const method = normalizeWwebjsRequestMethod(e.requestMethod);
                return [
                    {
                        participantId,
                        ...(addedById ? { addedById } : {}),
                        ...(method ? { method } : {}),
                        ...(typeof e.t === 'number' ? { requestedAt: e.t } : {}),
                    },
                ];
            });
        });
    }
    approveGroupMembershipRequests(groupId, participants) {
        return this.runMembershipRequestAction('approveGroupMembershipRequests', groupId, participants);
    }
    rejectGroupMembershipRequests(groupId, participants) {
        return this.runMembershipRequestAction('rejectGroupMembershipRequests', groupId, participants);
    }
    async runMembershipRequestAction(op, groupId, participants) {
        await this.requireGroupChat(groupId, op);
        const options = {
            requesterIds: participants?.map(wa_id_1.toParticipantWid) ?? null,
            sleep: [250, 500],
        };
        const raw = await (0, wwebjs_host_1.reportPageDeath)(this.host, op, () => this.client()[op](groupId, options));
        const results = (raw ?? []).map(entry => {
            const e = entry;
            return {
                id: (0, whatsapp_web_js_types_1.readWid)(e.requesterId ?? undefined) ?? '',
                success: e.error === undefined && e.message !== 'ServerStatusCodeError',
                ...(e.error !== undefined ? { status: e.error } : {}),
                ...(e.message ? { message: e.message } : {}),
            };
        });
        if (!participants) {
            return results;
        }
        return this.assertParticipantResults(op, groupId, results);
    }
}
exports.WwebjsGroups = WwebjsGroups;
//# sourceMappingURL=wwebjs-groups.js.map