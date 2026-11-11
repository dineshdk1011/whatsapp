"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILTER_FIELDS = exports.MAX_TEXT_VALUE_LENGTH = exports.MAX_VALUES_PER_CONDITION = exports.MAX_CONDITIONS = exports.CHAT_KINDS = exports.MESSAGE_TYPES = void 0;
exports.eventFamily = eventFamily;
exports.getFieldDefinition = getFieldDefinition;
exports.findFieldDefinition = findFieldDefinition;
const wa_id_1 = require("../../../engine/identity/wa-id");
const MESSAGE_TYPE_FLAGS = {
    text: true,
    image: true,
    video: true,
    audio: true,
    voice: true,
    document: true,
    sticker: true,
    location: true,
    contact: true,
    poll: true,
    call: true,
    revoked: true,
    order: true,
    product: true,
    masked: true,
    unknown: true,
};
exports.MESSAGE_TYPES = Object.keys(MESSAGE_TYPE_FLAGS);
exports.CHAT_KINDS = ['individual', 'group', 'channel', 'status', 'broadcast', 'unknown'];
exports.MAX_CONDITIONS = 20;
exports.MAX_VALUES_PER_CONDITION = 100;
exports.MAX_TEXT_VALUE_LENGTH = 1000;
const ID_OPERATORS = ['is', 'isNot'];
const TEXT_OPERATORS = ['contains', 'equals'];
const ENUM_OPERATORS = ['is', 'isNot'];
const BOOLEAN_OPERATORS = ['is'];
const str = (v) => (typeof v === 'string' ? v : undefined);
exports.FILTER_FIELDS = {
    message: [
        {
            field: 'sender',
            kind: 'id',
            operators: ID_OPERATORS,
            resolve: data => str(data.author) ?? str(data.from),
        },
        {
            field: 'recipient',
            kind: 'id',
            operators: ID_OPERATORS,
            resolve: data => str(data.to),
        },
        {
            field: 'chatId',
            kind: 'id',
            operators: ID_OPERATORS,
            resolve: data => str(data.chatId),
        },
        {
            field: 'body',
            kind: 'text',
            operators: TEXT_OPERATORS,
            resolve: data => str(data.body) ?? '',
        },
        {
            field: 'type',
            kind: 'enum',
            operators: ENUM_OPERATORS,
            enumValues: exports.MESSAGE_TYPES,
            resolve: data => str(data.type),
        },
        {
            field: 'isGroup',
            kind: 'boolean',
            operators: BOOLEAN_OPERATORS,
            resolve: data => data.isGroup === true,
        },
        {
            field: 'kind',
            kind: 'enum',
            operators: ENUM_OPERATORS,
            enumValues: exports.CHAT_KINDS,
            resolve: data => {
                const k = str(data.kind);
                if (k)
                    return k;
                const chatId = str(data.chatId);
                return chatId ? (0, wa_id_1.chatKind)(chatId) : undefined;
            },
        },
        {
            field: 'fromMe',
            kind: 'boolean',
            operators: BOOLEAN_OPERATORS,
            resolve: data => data.fromMe === true,
        },
        {
            field: 'hasMedia',
            kind: 'boolean',
            operators: BOOLEAN_OPERATORS,
            resolve: data => data.hasMedia === true || data.media != null,
        },
        {
            field: 'mentions',
            kind: 'idArray',
            operators: ID_OPERATORS,
            resolve: data => (Array.isArray(data.mentionedIds) ? data.mentionedIds : []),
        },
    ],
};
function eventFamily(event) {
    const dot = event.indexOf('.');
    return dot === -1 ? event : event.slice(0, dot);
}
function getFieldDefinition(family, field) {
    return exports.FILTER_FIELDS[family]?.find(f => f.field === field);
}
function findFieldDefinition(field) {
    for (const defs of Object.values(exports.FILTER_FIELDS)) {
        const found = defs.find(f => f.field === field);
        if (found)
            return found;
    }
    return undefined;
}
//# sourceMappingURL=filter-types.js.map