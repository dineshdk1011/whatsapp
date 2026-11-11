"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIncomingStatus = buildIncomingStatus;
function statusType(t) {
    return t === 'image' || t === 'video' || t === 'voice' ? t : 'text';
}
function buildIncomingStatus(msg) {
    if (!msg.isStatusBroadcast || !msg.id)
        return null;
    const contactJid = msg.author ?? msg.from;
    if (!contactJid || contactJid === 'status@broadcast')
        return null;
    return {
        waStatusId: msg.id,
        contactJid,
        contactName: msg.contact?.name,
        contactPushName: msg.contact?.pushName,
        type: statusType(msg.type),
        caption: msg.body || undefined,
        backgroundColor: msg.backgroundColor,
        font: msg.font,
        media: msg.media
            ? {
                mimetype: msg.media.mimetype,
                data: msg.media.data,
                omitted: msg.media.omitted,
                sizeBytes: msg.media.sizeBytes,
            }
            : undefined,
        postedAt: msg.timestamp * 1000,
    };
}
//# sourceMappingURL=incoming-status.js.map