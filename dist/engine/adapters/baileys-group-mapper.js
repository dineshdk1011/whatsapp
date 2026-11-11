"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSelfParticipant = findSelfParticipant;
exports.mapBaileysGroup = mapBaileysGroup;
exports.mapBaileysGroupInfo = mapBaileysGroupInfo;
const wa_id_1 = require("../identity/wa-id");
const identity = jid => jid;
function preferPhoneDialect(jid, phoneTwin, normalizeJid) {
    return normalizeJid(phoneTwin ?? jid);
}
function findSelfParticipant(metadata, selfJid, normalizeJid) {
    const self = (0, wa_id_1.parseWaId)(normalizeJid(selfJid));
    if (!self.userPart || (self.kind !== 'user' && self.kind !== 'lid'))
        return undefined;
    return metadata.participants.find(p => {
        const participant = (0, wa_id_1.parseWaId)(preferPhoneDialect(p.id, p.phoneNumber, normalizeJid));
        return participant.kind === self.kind && participant.userPart === self.userPart;
    });
}
function isSelfAdmin(metadata, selfJid, normalizeJid) {
    const admin = findSelfParticipant(metadata, selfJid, normalizeJid)?.admin;
    return admin === 'admin' || admin === 'superadmin';
}
function mapBaileysGroup(metadata, selfJid, normalizeJid = identity) {
    return {
        id: metadata.id,
        name: metadata.subject,
        participantsCount: metadata.participants.length,
        isAdmin: isSelfAdmin(metadata, selfJid, normalizeJid),
        linkedParentJID: metadata.linkedParent ?? null,
    };
}
function mapBaileysGroupInfo(metadata, normalizeJid = identity, selfJid) {
    const participants = metadata.participants.map(p => {
        const id = preferPhoneDialect(p.id, p.phoneNumber, normalizeJid);
        return {
            id,
            number: (0, wa_id_1.userPart)(id),
            name: p.name,
            isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
            isSuperAdmin: p.admin === 'superadmin',
        };
    });
    return {
        id: metadata.id,
        name: metadata.subject,
        description: metadata.desc,
        owner: metadata.owner ? preferPhoneDialect(metadata.owner, metadata.ownerPn, normalizeJid) : metadata.owner,
        createdAt: metadata.creation,
        participants,
        isAnnounce: metadata.announce,
        isReadOnly: selfJid
            ? Boolean(metadata.announce) && !isSelfAdmin(metadata, selfJid, normalizeJid)
            : metadata.announce,
        announce: metadata.announce,
        locked: metadata.restrict,
        ephemeralSeconds: metadata.ephemeralDuration,
        memberAddMode: metadata.memberAddMode === undefined
            ? undefined
            : metadata.memberAddMode
                ? 'all'
                : 'admins',
        linkedParentJID: metadata.linkedParent ?? null,
    };
}
//# sourceMappingURL=baileys-group-mapper.js.map