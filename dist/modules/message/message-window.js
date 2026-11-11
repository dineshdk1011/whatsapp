"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageTimeBoundarySeconds = messageTimeBoundarySeconds;
exports.validateMessageWindow = validateMessageWindow;
exports.parseMessageWindow = parseMessageWindow;
const common_1 = require("@nestjs/common");
const message_entity_1 = require("./entities/message.entity");
function messageTimeBoundarySeconds(milliseconds) {
    return milliseconds === 0 ? 0 : Math.max(1, Math.ceil(milliseconds / 1000));
}
function validateMessageWindow(window) {
    for (const key of ['since', 'until']) {
        const value = window[key];
        if (value !== undefined &&
            (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER)) {
            throw new common_1.BadRequestException(`${key} must be Unix epoch milliseconds between 0 and ${Number.MAX_SAFE_INTEGER}`);
        }
    }
    if (window.since !== undefined && window.until !== undefined && window.since >= window.until) {
        throw new common_1.BadRequestException('since must be earlier than the exclusive until boundary');
    }
    if (window.direction !== undefined && !Object.values(message_entity_1.MessageDirection).includes(window.direction)) {
        throw new common_1.BadRequestException('direction must be incoming or outgoing');
    }
    if (window.type !== undefined && (typeof window.type !== 'string' || !/^[a-z][a-z0-9_]{0,49}$/.test(window.type))) {
        throw new common_1.BadRequestException('type must be a non-empty message type token');
    }
    if (window.messageId !== undefined &&
        (typeof window.messageId !== 'string' ||
            !window.messageId.length ||
            window.messageId.length > 200 ||
            /\s/.test(window.messageId) ||
            [...window.messageId].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) {
        throw new common_1.BadRequestException('messageId must be a non-empty WhatsApp message reference up to 200 characters');
    }
    if (window.orderBy !== undefined && !['createdAt', 'timestamp'].includes(window.orderBy)) {
        throw new common_1.BadRequestException('orderBy must be createdAt or timestamp');
    }
}
function parseMessageWindow(query) {
    const milliseconds = (key) => {
        const value = query[key];
        if (value === undefined)
            return undefined;
        if (typeof value !== 'string' || !/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value))
            throw new common_1.BadRequestException(`${key} must be Unix epoch milliseconds`);
        return Number(value);
    };
    const window = {
        since: milliseconds('since'),
        until: milliseconds('until'),
        direction: query.direction,
        type: query.type,
        messageId: query.messageId,
        orderBy: query.orderBy,
    };
    validateMessageWindow(window);
    return Object.fromEntries(Object.entries(window).filter(([, value]) => value !== undefined));
}
//# sourceMappingURL=message-window.js.map