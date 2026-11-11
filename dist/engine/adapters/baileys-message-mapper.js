"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUTTON_TEXT_MAX_LENGTH = exports.BUTTONS_MAX_ENTRIES = exports.BAILEYS_NON_CONTENT_TYPES = void 0;
exports.mapBaileysEventResponseType = mapBaileysEventResponseType;
exports.mapBaileysMessageType = mapBaileysMessageType;
exports.extractBaileysBody = extractBaileysBody;
exports.baileysMessageText = baileysMessageText;
exports.setBaileysText = setBaileysText;
exports.extractBaileysCommerce = extractBaileysCommerce;
exports.extractBaileysButtonReply = extractBaileysButtonReply;
exports.extractBaileysButtons = extractBaileysButtons;
exports.resolveBaileysButtonClick = resolveBaileysButtonClick;
exports.extractBaileysClickableButtons = extractBaileysClickableButtons;
exports.toBaileysButtonClickContent = toBaileysButtonClickContent;
exports.isBaileysCatalogShare = isBaileysCatalogShare;
exports.extractBaileysLocation = extractBaileysLocation;
exports.extractBaileysContext = extractBaileysContext;
exports.mapBaileysStatus = mapBaileysStatus;
exports.extractBaileysPoll = extractBaileysPoll;
exports.baileysChatJid = baileysChatJid;
exports.storedKeyInChat = storedKeyInChat;
exports.storedKeyInChatPersisted = storedKeyInChatPersisted;
exports.keyParticipant = keyParticipant;
exports.buildIncomingMessageFromBaileys = buildIncomingMessageFromBaileys;
const wa_id_1 = require("../identity/wa-id");
const message_mapper_1 = require("./message-mapper");
exports.BAILEYS_NON_CONTENT_TYPES = new Set([
    'pollUpdateMessage',
    'pinInChatMessage',
    'keepInChatMessage',
    'albumMessage',
    'encReactionMessage',
    'encEventResponseMessage',
    'secretEncryptedMessage',
    'encCommentMessage',
]);
function mapBaileysEventResponseType(type) {
    switch (type) {
        case 1:
            return 'going';
        case 2:
            return 'not_going';
        case 3:
            return 'maybe';
        default:
            return 'unknown';
    }
}
function mapBaileysMessageType(contentType, isPtt = false, isCatalogShare = false) {
    switch (contentType) {
        case 'conversation':
        case 'extendedTextMessage':
            return 'text';
        case 'imageMessage':
            return 'image';
        case 'videoMessage':
        case 'ptvMessage':
            return 'video';
        case 'audioMessage':
            return isPtt ? 'voice' : 'audio';
        case 'documentMessage':
        case 'documentWithCaptionMessage':
            return 'document';
        case 'stickerMessage':
            return 'sticker';
        case 'locationMessage':
        case 'liveLocationMessage':
            return 'location';
        case 'contactMessage':
        case 'contactsArrayMessage':
            return 'contact';
        case 'pollCreationMessage':
        case 'pollCreationMessageV2':
        case 'pollCreationMessageV3':
        case 'pollCreationMessageV4':
        case 'pollCreationMessageV5':
            return 'poll';
        case 'interactiveMessage':
        case 'buttonsMessage':
        case 'templateMessage':
        case 'listMessage':
        case 'interactiveResponseMessage':
        case 'buttonsResponseMessage':
        case 'templateButtonReplyMessage':
        case 'listResponseMessage':
            return 'text';
        case 'orderMessage':
            return 'order';
        case 'productMessage':
            return isCatalogShare ? 'unknown' : 'product';
        case 'placeholderMessage':
            return 'masked';
        default:
            return 'unknown';
    }
}
const pollQuestion = (name) => name == null ? undefined : (0, message_mapper_1.boundPollText)(name);
const pollCreationOf = (content) => content?.pollCreationMessage ??
    content?.pollCreationMessageV2 ??
    content?.pollCreationMessageV3 ??
    content?.pollCreationMessageV5 ??
    undefined;
function extractBaileysBody(content) {
    return (content.conversation ??
        content.extendedTextMessage?.text ??
        content.imageMessage?.caption ??
        content.videoMessage?.caption ??
        content.documentMessage?.caption ??
        content.interactiveMessage?.body?.text ??
        content.buttonsMessage?.contentText ??
        content.templateMessage?.hydratedTemplate?.hydratedContentText ??
        content.templateMessage?.hydratedFourRowTemplate?.hydratedContentText ??
        content.interactiveResponseMessage?.body?.text ??
        content.listMessage?.description ??
        content.listMessage?.title ??
        pollQuestion(content.pollCreationMessage?.name) ??
        pollQuestion(content.pollCreationMessageV2?.name) ??
        pollQuestion(content.pollCreationMessageV3?.name) ??
        pollQuestion(content.pollCreationMessageV5?.name) ??
        pollQuestion(pollCreationOf(content.pollCreationMessageV4?.message)?.name) ??
        content.eventMessage?.name ??
        content.buttonsResponseMessage?.selectedDisplayText ??
        content.templateButtonReplyMessage?.selectedDisplayText ??
        content.listResponseMessage?.title ??
        content.contactMessage?.vcard ??
        extractContactsArrayVcards(content.contactsArrayMessage) ??
        content.orderMessage?.message ??
        content.orderMessage?.orderTitle ??
        content.productMessage?.body ??
        content.productMessage?.product?.title ??
        content.productMessage?.catalog?.title ??
        '');
}
const CONTENT_WRAPPERS = [
    'ephemeralMessage',
    'viewOnceMessage',
    'documentWithCaptionMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'editedMessage',
    'associatedChildMessage',
    'groupStatusMessage',
    'groupStatusMessageV2',
];
function baileysMessageText(message) {
    let content = message;
    for (let depth = 0; depth < 5 && content; depth++) {
        const wrapper = CONTENT_WRAPPERS.find(name => content?.[name]);
        if (!wrapper)
            break;
        content = content[wrapper]?.message;
    }
    if (!content)
        return '';
    return extractBaileysBody(content) || extractBaileysButtonReply(content, 'interactiveResponseMessage')?.text || '';
}
function setBaileysText(content, text) {
    if (typeof content.conversation === 'string') {
        content.conversation = text;
        return true;
    }
    if (content.extendedTextMessage) {
        content.extendedTextMessage.text = text;
        return true;
    }
    const media = content.imageMessage ?? content.videoMessage ?? content.documentMessage;
    if (media) {
        media.caption = text;
        return true;
    }
    return false;
}
function extractContactsArrayVcards(contactsArrayMessage) {
    const vcards = (contactsArrayMessage?.contacts ?? [])
        .map(contact => contact.vcard)
        .filter((vcard) => !!vcard);
    return vcards.length > 0 ? vcards.join('\n') : undefined;
}
function extractBaileysCommerce(content, contentType) {
    if (contentType === 'orderMessage') {
        const orderId = content.orderMessage?.orderId;
        if (!orderId) {
            return {};
        }
        return { order: { orderId, token: content.orderMessage?.token ?? undefined } };
    }
    if (contentType === 'productMessage') {
        const snapshot = content.productMessage?.product;
        return snapshot?.productId
            ? {
                product: {
                    productId: snapshot.productId,
                    title: snapshot.title ?? undefined,
                    description: snapshot.description ?? undefined,
                    businessOwnerJid: content.productMessage?.businessOwnerJid ?? undefined,
                },
            }
            : {};
    }
    return {};
}
function extractBaileysButtonReply(content, contentType) {
    if (contentType === 'buttonsResponseMessage') {
        const id = content.buttonsResponseMessage?.selectedButtonId;
        if (!id) {
            return undefined;
        }
        return {
            id,
            text: content.buttonsResponseMessage?.selectedDisplayText ?? undefined,
        };
    }
    if (contentType === 'templateButtonReplyMessage') {
        const id = content.templateButtonReplyMessage?.selectedId;
        if (!id) {
            return undefined;
        }
        return {
            id,
            text: content.templateButtonReplyMessage?.selectedDisplayText ?? undefined,
        };
    }
    if (contentType === 'listResponseMessage') {
        const id = content.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (!id) {
            return undefined;
        }
        return {
            id,
            text: content.listResponseMessage?.title ?? undefined,
        };
    }
    if (contentType === 'interactiveResponseMessage') {
        const flow = content.interactiveResponseMessage?.nativeFlowResponseMessage;
        const fromParams = parseNativeFlowButtonParams(flow?.paramsJson, { requireId: true });
        if (fromParams) {
            return fromParams;
        }
        return undefined;
    }
    return undefined;
}
exports.BUTTONS_MAX_ENTRIES = 20;
exports.BUTTON_TEXT_MAX_LENGTH = 256;
const CLICKABLE_NATIVE_FLOW_NAMES = new Set(['quick_reply', 'button_click']);
function extractBaileysButtons(content, contentType) {
    const choices = extractBaileysClickableButtons(content, contentType);
    return choices?.map(({ id, text }) => ({ id, text }));
}
const BUTTON_PROMPT_CONTENT_TYPES = new Set(['buttonsMessage', 'templateMessage', 'listMessage', 'interactiveMessage']);
function resolveBaileysButtonClick(content, contentType, buttonId, text) {
    if (!contentType || !BUTTON_PROMPT_CONTENT_TYPES.has(contentType)) {
        return { ok: false, error: 'not_a_prompt' };
    }
    const choices = extractBaileysClickableButtons(content, contentType);
    if (!choices || choices.length === 0) {
        return { ok: false, error: 'not_a_prompt' };
    }
    const trimmedId = buttonId.trim();
    const trimmedText = text?.trim();
    let matchIndex = trimmedText
        ? choices.findIndex(choice => choice.id === trimmedId && choice.text === trimmedText)
        : -1;
    if (matchIndex < 0) {
        matchIndex = choices.findIndex(choice => choice.id === trimmedId);
    }
    if (matchIndex < 0) {
        return { ok: false, error: 'unknown_button' };
    }
    const match = choices[matchIndex];
    const resolvedText = (trimmedText || match.text || trimmedId).trim();
    const selectedIndex = match.index;
    const payload = {
        id: trimmedId,
        text: resolvedText,
        index: selectedIndex,
        content: toBaileysButtonClickContent(contentType, trimmedId, resolvedText, selectedIndex),
    };
    return { ok: true, payload };
}
function extractBaileysClickableButtons(content, contentType) {
    if (contentType === 'buttonsMessage') {
        return collectChoices((content.buttonsMessage?.buttons ?? []).map((button, position) => {
            const text = button?.buttonText?.displayText?.trim();
            if (!text)
                return undefined;
            const flow = button?.nativeFlowInfo;
            if (flow && !CLICKABLE_NATIVE_FLOW_NAMES.has(flow.name ?? '')) {
                return undefined;
            }
            const id = button?.buttonId?.trim() || text;
            return { id, text, index: position };
        }));
    }
    if (contentType === 'interactiveMessage') {
        return collectChoices((content.interactiveMessage?.nativeFlowMessage?.buttons ?? []).map((button, position) => {
            const name = button?.name ?? 'quick_reply';
            if (!CLICKABLE_NATIVE_FLOW_NAMES.has(name)) {
                return undefined;
            }
            const parsed = parseNativeFlowButtonParams(button?.buttonParamsJson);
            if (!parsed)
                return undefined;
            const label = (parsed.text ?? parsed.id).trim();
            if (!label)
                return undefined;
            return { id: parsed.id.trim() || label, text: label, index: position };
        }));
    }
    if (contentType === 'templateMessage') {
        const hydrated = content.templateMessage?.hydratedTemplate?.hydratedButtons ??
            content.templateMessage?.hydratedFourRowTemplate?.hydratedButtons ??
            [];
        const numbered = hydrated.some(entry => typeof entry?.index === 'number');
        return collectChoices(hydrated.map((entry, position) => {
            const quick = entry?.quickReplyButton;
            if (!quick?.displayText?.trim())
                return undefined;
            const label = quick.displayText.trim();
            const protoIndex = numbered ? entry?.index : position;
            return {
                id: quick.id?.trim() || label,
                text: label,
                index: typeof protoIndex === 'number' ? protoIndex : undefined,
            };
        }));
    }
    if (contentType === 'listMessage') {
        const rows = (content.listMessage?.sections ?? []).flatMap(section => section?.rows ?? []);
        return collectChoices(rows.map((row, position) => {
            const text = row?.title?.trim();
            if (!text)
                return undefined;
            return { id: row?.rowId?.trim() || text, text, index: position };
        }));
    }
    return undefined;
}
function collectChoices(entries) {
    const choices = [];
    for (const entry of entries) {
        if (!entry)
            continue;
        const id = entry.id;
        const text = entry.text.slice(0, exports.BUTTON_TEXT_MAX_LENGTH);
        if (!id || id.length > exports.BUTTON_TEXT_MAX_LENGTH || !text)
            continue;
        choices.push({ id, text, index: entry.index });
        if (choices.length >= exports.BUTTONS_MAX_ENTRIES)
            break;
    }
    return choices.length > 0 ? choices : undefined;
}
function toBaileysButtonClickContent(contentType, buttonId, text, index) {
    switch (contentType) {
        case 'buttonsMessage':
            return {
                buttonReply: { displayText: text, id: buttonId, index },
                type: 'plain',
            };
        case 'listMessage':
            return {
                listReply: {
                    title: text,
                    listType: 1,
                    singleSelectReply: { selectedRowId: buttonId },
                },
            };
        case 'templateMessage':
            return {
                buttonReply: { displayText: text, id: buttonId, index },
                type: 'template',
            };
        case 'interactiveMessage':
        default:
            return {
                buttonReply: { displayText: text, id: buttonId, index },
                type: 'template',
            };
    }
}
function parseNativeFlowButtonParams(paramsJson, opts) {
    if (!paramsJson) {
        return undefined;
    }
    try {
        const params = JSON.parse(paramsJson);
        const text = pickNonEmptyString(params, ['display_text', 'displayText', 'title']);
        const id = pickNonEmptyString(params, ['id', 'button_id', 'buttonId']);
        if (id) {
            return { id, text: text ?? undefined };
        }
        if (opts?.requireId) {
            return undefined;
        }
        if (text) {
            return { id: text, text };
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
function pickNonEmptyString(obj, keys) {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
    }
    return undefined;
}
function isBaileysCatalogShare(content) {
    return !content.productMessage?.product?.productId && content.productMessage?.catalog != null;
}
function extractBaileysLocation(content, contentType) {
    if (contentType !== 'locationMessage' && contentType !== 'liveLocationMessage') {
        return undefined;
    }
    const lm = content.locationMessage ?? content.liveLocationMessage;
    if (!lm) {
        return undefined;
    }
    const staticLm = content.locationMessage;
    return {
        latitude: lm.degreesLatitude ?? 0,
        longitude: lm.degreesLongitude ?? 0,
        description: staticLm?.name ?? undefined,
        address: staticLm?.address ?? undefined,
    };
}
function extractBaileysContext(content) {
    const subForContext = content.extendedTextMessage ??
        content.imageMessage ??
        content.videoMessage ??
        content.ptvMessage ??
        content.audioMessage ??
        content.documentMessage ??
        content.stickerMessage ??
        content.locationMessage ??
        content.buttonsResponseMessage ??
        content.templateButtonReplyMessage ??
        content.listResponseMessage ??
        content.interactiveResponseMessage;
    const extText = content.extendedTextMessage;
    const contexts = Object.values(content)
        .concat(Object.values(content.pollCreationMessageV4?.message ?? {}))
        .map(node => node?.contextInfo);
    const contextInfo = subForContext?.contextInfo ?? contexts.find(info => info != null);
    const expiration = contextInfo?.expiration ??
        contexts.map(info => info?.expiration).find((e) => typeof e === 'number' && e > 0);
    const context = {
        ephemeralDuration: expiration ?? undefined,
        mentionedJids: contextInfo?.mentionedJid ?? undefined,
        backgroundArgb: typeof extText?.backgroundArgb === 'number' ? extText.backgroundArgb : undefined,
        font: typeof extText?.font === 'number' ? extText.font : undefined,
    };
    if (contextInfo?.quotedMessage && contextInfo.stanzaId) {
        context.quotedMessage = { id: contextInfo.stanzaId, body: baileysMessageText(contextInfo.quotedMessage) };
    }
    return context;
}
function mapBaileysStatus(status) {
    switch (status) {
        case 0:
            return 'failed';
        case 1:
            return 'pending';
        case 2:
            return 'sent';
        case 3:
            return 'delivered';
        case 4:
            return 'read';
        case 5:
            return 'read';
        default:
            return null;
    }
}
function extractBaileysPoll(content) {
    const poll = pollCreationOf(content) ?? pollCreationOf(content.pollCreationMessageV4?.message);
    if (!poll)
        return undefined;
    const options = (poll.options ?? [])
        .map(option => option.optionName)
        .filter((option) => typeof option === 'string');
    if (!options.length)
        return undefined;
    return {
        name: (0, message_mapper_1.boundPollText)(poll.name ?? ''),
        options: (0, message_mapper_1.boundPollOptions)(options),
        allowMultipleAnswers: poll.selectableOptionsCount !== 1,
    };
}
function baileysChatJid(remoteJid, participant, fromMe) {
    const isList = remoteJid.endsWith('@broadcast') && remoteJid !== 'status@broadcast';
    return isList && !fromMe && participant ? participant : remoteJid;
}
function storedKeyInChat(key, chatId, neutral) {
    const raw = key.remoteJid ?? '';
    const want = neutral(chatId);
    return neutral(raw) === want || neutral(baileysChatJid(raw, key.participant, key.fromMe === true)) === want;
}
async function storedKeyInChatPersisted(key, chatId, resolveLid) {
    if (storedKeyInChat(key, chatId, wa_id_1.toNeutralJid))
        return true;
    if (!resolveLid)
        return false;
    const want = (0, wa_id_1.parseWaId)(chatId);
    for (const raw of [key.remoteJid ?? '', baileysChatJid(key.remoteJid ?? '', key.participant, key.fromMe === true)]) {
        const stored = (0, wa_id_1.parseWaId)(raw);
        if (!((stored.kind === 'lid' && want.kind === 'user') || (stored.kind === 'user' && want.kind === 'lid')))
            continue;
        const lid = stored.kind === 'lid' ? raw : chatId;
        const phone = stored.kind === 'user' ? stored.userPart : want.userPart;
        if ((await resolveLid(lid).catch(() => null)) === phone)
            return true;
    }
    return false;
}
function keyParticipant(key) {
    return key.participant ? key.participant : undefined;
}
function buildIncomingMessageFromBaileys(fields, normalizeJid = jid => jid) {
    const rawChatId = fields.remoteJid;
    const isGroup = rawChatId.endsWith('@g.us');
    const isStatusBroadcast = rawChatId === 'status@broadcast';
    const chatId = normalizeJid(baileysChatJid(rawChatId, fields.participant, fields.fromMe));
    const self = normalizeJid(fields.selfJid ?? '');
    const incoming = {
        id: fields.id,
        from: fields.fromMe ? self : chatId,
        to: fields.fromMe ? chatId : self,
        chatId,
        body: fields.body || fields.button?.text || '',
        type: mapBaileysMessageType(fields.contentType, fields.isPtt, fields.isCatalogShare),
        timestamp: fields.timestamp,
        fromMe: fields.fromMe,
        isGroup,
        kind: (0, wa_id_1.chatKind)(chatId),
        isStatusBroadcast,
    };
    if ((isGroup || rawChatId.endsWith('@broadcast')) && fields.participant) {
        incoming.author = normalizeJid(fields.participant);
    }
    const senderJid = fields.participant ? fields.participant : rawChatId;
    if (senderJid.endsWith('@lid')) {
        incoming.isLidSender = true;
    }
    if (fields.pushName) {
        incoming.contact = { pushName: fields.pushName };
    }
    if (fields.backgroundArgb !== undefined && Number.isFinite(fields.backgroundArgb)) {
        incoming.backgroundColor = `#${(fields.backgroundArgb & 0xffffff).toString(16).padStart(6, '0')}`;
    }
    if (fields.font !== undefined) {
        incoming.font = fields.font;
    }
    if (fields.media) {
        incoming.media = fields.media;
    }
    if (fields.poll)
        incoming.poll = fields.poll;
    if (fields.location) {
        incoming.location = fields.location;
    }
    if (fields.quotedMessage) {
        incoming.quotedMessage = fields.quotedMessage;
    }
    if (fields.order) {
        incoming.order = fields.order;
    }
    if (fields.product) {
        const { businessOwnerJid } = fields.product;
        incoming.product = businessOwnerJid
            ? { ...fields.product, businessOwnerJid: normalizeJid(businessOwnerJid) }
            : fields.product;
    }
    if (fields.button) {
        incoming.button = fields.button;
    }
    if (fields.buttons) {
        incoming.buttons = fields.buttons;
    }
    if (fields.ephemeralDuration && fields.ephemeralDuration > 0) {
        incoming.ephemeralDuration = fields.ephemeralDuration;
    }
    if (fields.mentionedJids && fields.mentionedJids.length > 0) {
        incoming.mentionedIds = fields.mentionedJids.map(normalizeJid);
    }
    return incoming;
}
//# sourceMappingURL=baileys-message-mapper.js.map