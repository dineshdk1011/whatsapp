"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wwebjsGroupUpdateChanges = wwebjsGroupUpdateChanges;
exports.wwebjsGroupRecipientIds = wwebjsGroupRecipientIds;
exports.registerWwebjsGroupEvents = registerWwebjsGroupEvents;
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
function parseWwebjsOnOff(body) {
    const v = body.trim().toLowerCase();
    if (v === 'on' || v === 'true')
        return true;
    if (v === 'off' || v === 'false')
        return false;
    return undefined;
}
function wwebjsGroupUpdateChanges(notification) {
    const body = typeof notification.body === 'string' ? notification.body : '';
    switch (String(notification.type)) {
        case 'subject':
            return { subject: body };
        case 'description':
            return { description: body };
        case 'announce': {
            const on = parseWwebjsOnOff(body);
            return on === undefined ? {} : { announce: on };
        }
        case 'restrict':
        case 'locked': {
            const on = parseWwebjsOnOff(body);
            return on === undefined ? {} : { locked: on };
        }
        default:
            return {};
    }
}
function wwebjsGroupRecipientIds(notification) {
    const raw = notification.recipientIds;
    if (!Array.isArray(raw))
        return [];
    return raw
        .map(entry => {
        if (typeof entry === 'string')
            return entry;
        const wid = entry;
        return (0, whatsapp_web_js_types_1.readWid)(wid) ?? '';
    })
        .filter(id => id.length > 0);
}
function registerWwebjsGroupEvents(client, host) {
    client.on('group_join', notification => handleGroupNotification(host, 'join', notification));
    client.on('group_leave', notification => handleGroupNotification(host, 'leave', notification));
    client.on('group_update', notification => handleGroupNotification(host, 'update', notification));
    client.on('group_membership_request', notification => handleGroupNotification(host, 'join_request', notification));
}
function handleGroupNotification(host, kind, notification) {
    try {
        if (!notification.chatId) {
            return;
        }
        const payload = {
            kind,
            groupId: notification.chatId,
            actorId: notification.author || undefined,
            participantIds: wwebjsGroupRecipientIds(notification),
            timestamp: typeof notification.timestamp === 'number' && notification.timestamp > 0
                ? Math.floor(notification.timestamp)
                : Math.floor(Date.now() / 1000),
        };
        if (kind === 'join_request' && payload.participantIds.length === 0) {
            if (!payload.actorId) {
                return;
            }
            payload.participantIds = [payload.actorId];
        }
        if (kind === 'update') {
            payload.changes = wwebjsGroupUpdateChanges(notification);
        }
        host.getCallbacks().onGroupEvent?.(payload);
    }
    catch (error) {
        host.logger.error(`Error processing group_${kind} notification`, String(error));
    }
}
//# sourceMappingURL=wwebjs-group-events.js.map