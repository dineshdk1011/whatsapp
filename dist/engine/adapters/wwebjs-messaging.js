"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsMessaging = void 0;
exports.wwebjsAckToDeliveryStatus = wwebjsAckToDeliveryStatus;
exports.extractWwebjsCall = extractWwebjsCall;
exports.declaredOnlyMedia = declaredOnlyMedia;
exports.declaredMediaSize = declaredMediaSize;
exports.plannedInboundDownload = plannedInboundDownload;
exports.downloadMediaInPage = downloadMediaInPage;
exports.downloadCappedMedia = downloadCappedMedia;
exports.isHttpUrl = isHttpUrl;
exports.loadRemoteMedia = loadRemoteMedia;
exports.isNoLidForUserError = isNoLidForUserError;
exports.isQuoteUnresolvedError = isQuoteUnresolvedError;
exports.toMessageMedia = toMessageMedia;
exports.toMessageResult = toMessageResult;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const common_1 = require("@nestjs/common");
const message_not_found_error_1 = require("../../common/errors/message-not-found.error");
const engine_refused_error_1 = require("../../common/errors/engine-refused.error");
const load_remote_media_1 = require("../../common/media/load-remote-media");
const wa_id_1 = require("../identity/wa-id");
const inbound_media_cap_1 = require("./inbound-media-cap");
const message_mapper_1 = require("./message-mapper");
const vcard_1 = require("./vcard");
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
const recipient_unreachable_error_1 = require("../../common/errors/recipient-unreachable.error");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const engine_not_sent_error_1 = require("../../common/errors/engine-not-sent.error");
const engine_page_error_1 = require("../../common/errors/engine-page.error");
const wwebjs_host_1 = require("./wwebjs-host");
const wwebjs_lifecycle_1 = require("./wwebjs-lifecycle");
function wwebjsAckToDeliveryStatus(ack) {
    if (ack < 0)
        return 'failed';
    if (ack >= 3)
        return 'read';
    if (ack === 2)
        return 'delivered';
    if (ack === 1)
        return 'sent';
    return 'pending';
}
function extractWwebjsCall(msg) {
    if (msg.type !== 'call_log')
        return undefined;
    const d = msg._data ?? {};
    return { video: Boolean(d.isVideoCall), missed: !msg.fromMe && !d.callDuration };
}
function declaredOnlyMedia(msg) {
    const data = msg._data;
    return {
        mimetype: data?.mimetype ?? '',
        filename: data?.filename || undefined,
        omitted: true,
        sizeBytes: (0, inbound_media_cap_1.coerceDeclaredSize)(data?.size),
    };
}
function declaredMediaSize(msg) {
    return (0, inbound_media_cap_1.coerceDeclaredSize)(msg._data?.size);
}
function plannedInboundDownload(msg) {
    return Boolean(msg.hasMedia) && (0, inbound_media_cap_1.isMediaDownloadEnabled)() && declaredMediaSize(msg) <= (0, inbound_media_cap_1.inboundMediaMaxBytes)();
}
async function downloadMediaInPage(args) {
    const w = window;
    const collection = w.require('WAWebCollections').Msg;
    const msg = collection.get(args.msgId) || (await collection.getMessagesById([args.msgId]))?.messages?.[0];
    if (!msg || !msg.mediaData || msg.mediaData.mediaStage === 'REUPLOADING')
        return null;
    if (msg.mediaData.mediaStage !== 'RESOLVED') {
        await msg.downloadMedia({ downloadEvenIfExpensive: true, rmrReason: 1 });
    }
    if (msg.mediaData.mediaStage.includes('ERROR') || msg.mediaData.mediaStage === 'FETCHING')
        return undefined;
    try {
        const noopQpl = {
            addAnnotations() {
                return this;
            },
            addPoint() {
                return this;
            },
        };
        const decrypted = await w.require('WAWebDownloadManager').downloadManager.downloadAndMaybeDecrypt({
            directPath: msg.directPath,
            encFilehash: msg.encFilehash,
            filehash: msg.filehash,
            mediaKey: msg.mediaKey,
            mediaKeyTimestamp: msg.mediaKeyTimestamp,
            type: msg.type,
            mimetype: msg.mimetype,
            signal: new AbortController().signal,
            downloadQpl: noopQpl,
        });
        const meta = { mimetype: msg.mimetype, filename: msg.filename, sizeBytes: decrypted.byteLength };
        if (meta.sizeBytes > args.maxBytes)
            return { ...meta, data: '' };
        return { ...meta, data: await w.WWebJS.arrayBufferToBase64Async(decrypted) };
    }
    catch (e) {
        if (e?.status === 404)
            return undefined;
        const thrown = e;
        const part = (value) => value === undefined || value === null ? '' : String(value);
        let summary;
        if (thrown instanceof Object) {
            const name = part(thrown.name) || (thrown.constructor === Object ? '' : part(thrown.constructor?.name));
            const reason = part(thrown.message) || (thrown.status === undefined ? '' : `status ${part(thrown.status)}`);
            summary = name && reason ? `${name}: ${reason}` : name || reason;
        }
        else {
            summary = part(thrown);
        }
        const build = window.Debug?.VERSION;
        throw new Error(`${summary || 'unknown rejection'} (WhatsApp Web ${String(build)})`, {
            cause: e,
        });
    }
}
async function downloadCappedMedia(msg, maxBytes) {
    const { pupPage } = msg.client;
    return pupPage.evaluate(downloadMediaInPage, { msgId: (0, whatsapp_web_js_types_1.readWid)(msg.id) ?? '', maxBytes });
}
function isHttpUrl(value) {
    return /^https?:\/\//i.test(value);
}
async function loadRemoteMedia(url, sessionProxyUrl) {
    const { data, mimetype } = await (0, load_remote_media_1.loadRemoteMediaBuffer)(url, sessionProxyUrl);
    let filename = new URL(url).pathname.split('/').pop() || undefined;
    try {
        filename = filename && decodeURIComponent(filename).replace(/[/\\]/g, '_');
    }
    catch {
    }
    return new whatsapp_web_js_1.MessageMedia(mimetype || 'application/octet-stream', data.toString('base64'), filename);
}
function isNoLidForUserError(err) {
    return err instanceof Error && err.message.includes('No LID for user');
}
function isQuoteUnresolvedError(err) {
    return err instanceof Error && err.message.includes('Could not get the quoted message');
}
async function toMessageMedia(media, sessionProxyUrl, opts) {
    if (typeof media.data === 'string' && isHttpUrl(media.data)) {
        const fetched = await loadRemoteMedia(media.data, sessionProxyUrl);
        if (opts?.trustDeclaredType !== false && media.mimetype && media.mimetype !== 'application/octet-stream') {
            fetched.mimetype = media.mimetype;
        }
        const normalizeMediaType = (value) => (value ?? '').split(';', 1)[0].trim().toLowerCase();
        const fetchedType = normalizeMediaType(fetched.mimetype);
        const declaredType = normalizeMediaType(media.mimetype);
        const fetchedTypeIsGeneric = !fetchedType || fetchedType === 'application/octet-stream' || fetchedType === 'binary/octet-stream';
        const declaredTypeIsConvertible = declaredType.startsWith('image/') || declaredType.startsWith('video/');
        if (opts?.trustDeclaredType === false && fetchedTypeIsGeneric && declaredTypeIsConvertible) {
            fetched.mimetype = declaredType;
        }
        const declaredTypeIsUnknown = !declaredType || declaredType === 'application/octet-stream';
        if (opts?.fallbackType && fetchedTypeIsGeneric && declaredTypeIsUnknown) {
            fetched.mimetype = opts.fallbackType;
        }
        if (media.filename) {
            fetched.filename = media.filename;
        }
        return fetched;
    }
    const data = typeof media.data === 'string' ? media.data : media.data.toString('base64');
    return new whatsapp_web_js_1.MessageMedia(media.mimetype, data, media.filename);
}
function toMessageResult(msg) {
    if (!msg) {
        throw new Error('the engine returned no message for this send, so it may not have been delivered — check the chat before retrying');
    }
    const id = msg.id;
    return { id: (0, whatsapp_web_js_types_1.readWid)(id) ?? '', timestamp: msg.timestamp };
}
function ensureSendable(chatId, shape) {
    const channel = /@\w*newsletter\b/.test(chatId);
    if (/@\w*broadcast\b/.test(chatId) || (channel && shape !== 'poll' && shape !== 'sticker')) {
        const to = channel ? 'a channel' : 'a status or broadcast list';
        throw new common_1.NotImplementedException(`whatsapp-web.js cannot send a ${shape} to ${to}; nothing was sent.`);
    }
}
class WwebjsMessaging {
    host;
    constructor(host) {
        this.host = host;
    }
    client() {
        return (0, wwebjs_host_1.requireClient)(this.host);
    }
    ensureReadyToSend() {
        try {
            this.host.ensureReady();
        }
        catch (error) {
            throw (0, engine_not_sent_error_1.markNothingSent)(error);
        }
    }
    withPage(context, op) {
        return (0, wwebjs_host_1.withPage)(this.host, context, op);
    }
    async readBeforeSend(context, read) {
        try {
            return await read();
        }
        catch (error) {
            this.host.reportIfPageTransportError(error, context);
            this.ensureReadyToSend();
            throw error;
        }
    }
    resolvedSendIds = new Map();
    unreportedLids = new Set();
    async resolveSendId(chatId) {
        return (await this.lookupSendId(chatId)).id;
    }
    async lookupSendId(chatId) {
        if (!chatId.endsWith('@c.us')) {
            return { id: chatId, answered: true };
        }
        const cached = this.resolvedSendIds.get(chatId);
        if (cached) {
            if (this.unreportedLids.delete(chatId))
                this.reportLid(chatId, cached);
            return { id: cached, answered: true };
        }
        try {
            const wid = await this.host.getNumberId(chatId);
            if (wid) {
                this.resolvedSendIds.set(chatId, wid);
                if (wid.endsWith('@lid'))
                    this.reportLid(chatId, wid);
                return { id: wid, answered: true };
            }
            return { id: chatId, answered: true };
        }
        catch (failure) {
            return { id: chatId, answered: false, failure };
        }
    }
    unansweredLookup(chatId, sendError, failure) {
        if (failure instanceof engine_not_ready_error_1.EngineNotReadyError)
            return failure;
        this.host.logger.warn('Could not re-resolve a recipient after "No LID for user": the lookup did not answer', {
            sessionId: this.host.config.sessionId,
            chatId,
            error: failure instanceof Error ? failure.message : String(failure),
        });
        return new engine_page_error_1.RecipientLookupUnansweredError({ name: sendError.name || 'Error', message: sendError.message }, sendError);
    }
    reportLid(chatId, wid) {
        const failed = () => {
            if (this.resolvedSendIds.get(chatId) === wid)
                this.unreportedLids.add(chatId);
        };
        void this.host.config.lidMappingStore
            ?.remember((0, wa_id_1.userPart)(wid), (0, wa_id_1.userPart)(chatId), this.host.config.sessionId)
            ?.then(stored => {
            if (stored === false)
                failed();
        }, failed);
    }
    quoteOptions(quotedMessageId) {
        return quotedMessageId ? { quotedMessageId, ignoreQuoteErrors: false } : {};
    }
    async sendResolved(chatId, send, quotedMessageId) {
        if (quotedMessageId)
            ensureSendable(chatId, 'reply');
        const to = await this.resolveSendId(chatId);
        this.ensureReadyToSend();
        try {
            return await send(to);
        }
        catch (err) {
            this.host.reportIfPageTransportError(err, 'sendMessage');
            if (quotedMessageId && isQuoteUnresolvedError(err)) {
                throw new message_not_found_error_1.MessageNotFoundError(quotedMessageId);
            }
            if (!chatId.endsWith('@c.us') || !isNoLidForUserError(err)) {
                throw (0, wwebjs_lifecycle_1.toCapturedPageError)(err);
            }
            this.resolvedSendIds.delete(chatId);
            this.unreportedLids.delete(chatId);
            const lookup = await this.lookupSendId(chatId);
            const fresh = lookup.id;
            this.host.ensureReady();
            if (!lookup.answered) {
                throw this.unansweredLookup(chatId, err, lookup.failure);
            }
            if (fresh === to) {
                throw new recipient_unreachable_error_1.RecipientUnreachableError(chatId);
            }
            this.host.logger.warn('Send retried against a re-resolved id after "No LID for user"; may duplicate', {
                chatId,
                staleId: to,
                freshId: fresh,
            });
            try {
                return await send(fresh);
            }
            catch (retryErr) {
                this.host.reportIfPageTransportError(retryErr, 'sendMessage');
                if (quotedMessageId && isQuoteUnresolvedError(retryErr)) {
                    throw new message_not_found_error_1.MessageNotFoundError(quotedMessageId);
                }
                if (isNoLidForUserError(retryErr)) {
                    throw new recipient_unreachable_error_1.RecipientUnreachableError(chatId);
                }
                throw (0, wwebjs_lifecycle_1.toCapturedPageError)(retryErr);
            }
        }
    }
    async sendTextMessage(chatId, text, mentions, options) {
        this.ensureReadyToSend();
        if (options?.customPreview) {
            throw new engine_not_supported_error_1.EngineNotSupportedError('sendTextMessage(customPreview)');
        }
        const sendOptions = this.quoteOptions(options?.quotedMessageId);
        if (mentions?.length)
            sendOptions.mentions = mentions;
        if (options?.linkPreview === false)
            sendOptions.linkPreview = false;
        const msg = await this.sendResolved(chatId, to => Object.keys(sendOptions).length
            ? this.client().sendMessage(to, text, sendOptions)
            : this.client().sendMessage(to, text), options?.quotedMessageId);
        return toMessageResult(msg);
    }
    async sendImageMessage(chatId, media) {
        return this.sendMediaMessage(chatId, media, undefined, 'image/jpeg');
    }
    async sendVideoMessage(chatId, media) {
        return this.sendMediaMessage(chatId, media, undefined, 'video/mp4');
    }
    async sendAudioMessage(chatId, media) {
        return this.sendMediaMessage(chatId, media, media.ptt ? { sendAudioAsVoice: true } : undefined, 'audio/mpeg');
    }
    async sendDocumentMessage(chatId, media) {
        const kind = (0, wa_id_1.chatKind)(chatId);
        const asDocument = kind !== 'status' && kind !== 'broadcast';
        return this.sendMediaMessage(chatId, media, asDocument ? { sendMediaAsDocument: true } : undefined);
    }
    async sendMediaMessage(chatId, media, extraOptions, fallbackType) {
        this.ensureReadyToSend();
        this.host.ensureNotChannelRecipient(chatId);
        const messageMedia = await toMessageMedia(media, this.host.config.proxy?.url, { fallbackType });
        if (extraOptions?.sendMediaAsDocument && !messageMedia.filename) {
            messageMedia.filename = 'file';
        }
        const msg = await this.sendResolved(chatId, to => this.client().sendMessage(to, messageMedia, {
            caption: media.caption,
            ...(media.mentions?.length ? { mentions: media.mentions } : {}),
            ...extraOptions,
            ...this.quoteOptions(media.quotedMessageId),
        }), media.quotedMessageId);
        return toMessageResult(msg);
    }
    async sendLocationMessage(chatId, location) {
        this.ensureReadyToSend();
        ensureSendable(chatId, 'location');
        const module = await import('whatsapp-web.js');
        const Location = module.Location || module.default?.Location;
        const loc = new Location(location.latitude, location.longitude, {
            name: location.description || '',
            address: location.address || '',
        });
        const msg = await this.sendResolved(chatId, to => this.client().sendMessage(to, loc, this.quoteOptions(location.quotedMessageId)), location.quotedMessageId);
        return toMessageResult(msg);
    }
    async sendContactMessage(chatId, contact) {
        this.ensureReadyToSend();
        ensureSendable(chatId, 'contact card');
        const vcard = (0, vcard_1.buildVCard)(contact);
        const msg = await this.sendResolved(chatId, to => this.client().sendMessage(to, vcard, {
            parseVCards: true,
            ...this.quoteOptions(contact.quotedMessageId),
        }), contact.quotedMessageId);
        return toMessageResult(msg);
    }
    async sendStickerMessage(chatId, media) {
        this.ensureReadyToSend();
        this.host.ensureNotChannelRecipient(chatId);
        ensureSendable(chatId, 'sticker');
        const messageMedia = await toMessageMedia(media, this.host.config.proxy?.url, { trustDeclaredType: false });
        const msg = await this.sendResolved(chatId, to => this.client().sendMessage(to, messageMedia, {
            sendMediaAsSticker: true,
            ...this.quoteOptions(media.quotedMessageId),
            ...(media.mentions?.length ? { mentions: media.mentions } : {}),
        }), media.quotedMessageId);
        return toMessageResult(msg);
    }
    async sendPollMessage(chatId, poll) {
        this.ensureReadyToSend();
        ensureSendable(chatId, 'poll');
        const module = await import('whatsapp-web.js');
        const Poll = module.Poll || module.default?.Poll;
        const pollOptions = { allowMultipleAnswers: poll.allowMultipleAnswers === true };
        const msg = await this.sendResolved(chatId, to => this.client().sendMessage(to, new Poll(poll.name, poll.options, pollOptions), this.quoteOptions(poll.quotedMessageId)), poll.quotedMessageId);
        return toMessageResult(msg);
    }
    async replyToMessage(chatId, quotedMsgId, text, mentions) {
        this.ensureReadyToSend();
        ensureSendable(chatId, 'reply');
        try {
            const chat = await this.readBeforeSend('replyToMessage', () => this.client().getChatById(chatId));
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(quotedMsgId, chatId);
            }
            const messages = await this.readBeforeSend('replyToMessage', () => chat.fetchMessages({ limit: 100 }));
            const quotedMsg = messages.find(m => m.id._serialized === quotedMsgId);
            if (!quotedMsg) {
                throw new message_not_found_error_1.MessageNotFoundError(quotedMsgId);
            }
            const msg = await this.sendResolved(chatId, to => mentions?.length ? quotedMsg.reply(text, to, { mentions }) : quotedMsg.reply(text, to));
            return toMessageResult(msg);
        }
        catch (error) {
            this.host.reportIfPageTransportError(error, 'replyToMessage');
            throw error;
        }
    }
    async forwardMessage(fromChatId, toChatId, messageId) {
        this.ensureReadyToSend();
        try {
            const chat = await this.readBeforeSend('forwardMessage', () => this.client().getChatById(fromChatId));
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, fromChatId);
            }
            const messages = await this.readBeforeSend('forwardMessage', () => chat.fetchMessages({ limit: 100 }));
            const msgToForward = messages.find(m => m.id._serialized === messageId);
            if (!msgToForward) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId);
            }
            let resolvedTo = toChatId;
            let before = undefined;
            let attempted = false;
            await this.sendResolved(toChatId, async (to) => {
                resolvedTo = to;
                before = undefined;
                try {
                    const snapshot = await this.loadedOwnMessages(to);
                    before = {
                        ids: new Set(snapshot.map(m => toMessageResult(m).id)),
                        newest: snapshot.reduce((newest, m) => Math.max(newest, m.timestamp), 0),
                    };
                }
                catch (error) {
                    await this.host.reportOnceGone?.(error, 'forwardMessage');
                    this.host.logger.warn(`Could not read the destination chat before forwarding: ${String(error)}`);
                }
                if (attempted)
                    this.host.ensureReady();
                else
                    this.ensureReadyToSend();
                attempted = true;
                return msgToForward.forward(to);
            });
            try {
                if (before) {
                    const known = before;
                    const fresh = (await this.loadedOwnMessages(resolvedTo)).filter(m => {
                        const id = toMessageResult(m).id;
                        return id !== '' && !known.ids.has(id) && m.timestamp >= known.newest;
                    });
                    const forwarded = fresh.filter(m => m.isForwarded);
                    const sent = fresh.length === 1 ? fresh[0] : forwarded.length === 1 ? forwarded[0] : undefined;
                    if (sent) {
                        return toMessageResult(sent);
                    }
                }
            }
            catch (error) {
                this.host.reportIfPageTransportError(error, 'forwardMessage');
                this.host.logger.warn(`Forward succeeded but recovering the sent message id failed: ${String(error)}`);
            }
            return { id: '', timestamp: Math.floor(Date.now() / 1000) };
        }
        catch (error) {
            this.host.reportIfPageTransportError(error, 'forwardMessage');
            throw error;
        }
    }
    async loadedOwnMessages(chatId) {
        const chat = await this.client().getChatById(chatId);
        return (await chat?.fetchMessages({ fromMe: true })) ?? [];
    }
    async reactToMessage(chatId, messageId, emoji) {
        this.host.ensureReady();
        await this.withPage('reactToMessage', async () => {
            const chat = await this.client().getChatById(chatId);
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            const messages = await chat.fetchMessages({ limit: 100 });
            const message = messages.find(m => m.id._serialized === messageId);
            if (!message) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            this.host.ensureReady();
            await message.react(emoji);
        });
        this.host.logger.debug('Reacted to message', { messageId, emoji: emoji || '(removed)' });
    }
    async getMessageReactions(chatId, messageId) {
        this.host.ensureReady();
        const reactions = await this.withPage('getMessageReactions', async () => {
            const chat = await this.client().getChatById(chatId);
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            const messages = await chat.fetchMessages({ limit: 100 });
            const message = messages.find(m => m.id._serialized === messageId);
            if (!message) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            const msgWithReactions = message;
            return msgWithReactions.hasReaction ? msgWithReactions.getReactions() : [];
        });
        if (!reactions) {
            return [];
        }
        const result = [];
        for (const r of reactions) {
            result.push({
                emoji: String(r.id),
                senders: (r.senders || []).map(s => ({
                    senderId: String(s.senderId),
                    emoji: String(s.reaction),
                    timestamp: Number(s.timestamp),
                })),
            });
        }
        return result;
    }
    async getChatHistory(chatId, limit = 50, includeMedia = false, mediaMaxBytes, signal) {
        this.host.ensureReady();
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.trunc(limit) : 50;
        const messages = await this.withPage('getChatHistory', async () => {
            const chat = await this.client().getChatById(chatId);
            if (!chat) {
                return [];
            }
            return chat.fetchMessages({ limit: safeLimit });
        });
        const results = [];
        let mediaBudget = !includeMedia
            ? Number.POSITIVE_INFINITY
            : mediaMaxBytes === undefined
                ? (0, inbound_media_cap_1.chatHistoryMediaBudgetBytes)()
                : (0, inbound_media_cap_1.ingestMediaBudgetBytes)(Math.min(mediaMaxBytes, (0, inbound_media_cap_1.inboundMediaMaxBytes)()));
        const senderContacts = new Map();
        for (const msg of messages) {
            if (signal?.aborted) {
                break;
            }
            const out = (0, message_mapper_1.buildIncomingMessageBase)(msg);
            out.chatId = chatId;
            out.isGroup = chatId.endsWith('@g.us');
            out.isStatusBroadcast = chatId === 'status@broadcast';
            out.kind = (0, wa_id_1.chatKind)(chatId);
            const senderId = msg.author || msg.from;
            if (!senderContacts.has(senderId)) {
                let resolved;
                try {
                    const contact = await msg.getContact();
                    if (contact)
                        resolved = (0, message_mapper_1.mapContactFields)(contact, process.env.WEBHOOK_CONTACT_DETAILS === 'true');
                }
                catch (error) {
                    this.host.logger.warn(`Failed to resolve contact for history message ${msg.id._serialized}: ${String(error)}`);
                }
                senderContacts.set(senderId, resolved);
            }
            const merged = { ...out.contact, ...senderContacts.get(senderId) };
            if (Object.keys(merged).length > 0) {
                out.contact = merged;
            }
            const call = extractWwebjsCall(msg);
            if (call)
                out.call = call;
            if (msg.type === whatsapp_web_js_1.MessageTypes.LOCATION && msg.location) {
                out.location = {
                    latitude: Number(msg.location.latitude),
                    longitude: Number(msg.location.longitude),
                    description: msg.location.description || undefined,
                    address: msg.location.address || undefined,
                    url: msg.location.url || undefined,
                };
            }
            if (msg.hasQuotedMsg) {
                try {
                    const quoted = await msg.getQuotedMessage();
                    out.quotedMessage = { id: quoted.id._serialized, body: quoted.body };
                }
                catch (error) {
                    this.host.logger.warn(`Failed to resolve quoted message for ${msg.id._serialized}: ${String(error)}`);
                }
            }
            if (includeMedia && msg.hasMedia) {
                if (mediaBudget <= 0) {
                    out.media = declaredOnlyMedia(msg);
                }
                else {
                    try {
                        const capped = await this.host.capInboundMediaFor(msg, mediaMaxBytes);
                        if (capped) {
                            out.media = capped;
                            if (capped.data) {
                                mediaBudget -= capped.data.length;
                            }
                        }
                    }
                    catch (error) {
                        this.host.logger.warn(`Failed to download media for ${msg.id._serialized}: ${String(error)}`);
                    }
                }
            }
            results.push(out);
        }
        return results;
    }
    async deleteMessage(chatId, messageId, forEveryone = true) {
        this.host.ensureReady();
        await this.withPage('deleteMessage', async () => {
            const chat = await this.client().getChatById(chatId);
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            const messages = await chat.fetchMessages({ limit: 100 });
            const message = messages.find(m => m.id._serialized === messageId || m.id.id === messageId);
            if (!message) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            this.host.ensureReady();
            await message.delete(forEveryone);
        });
        this.host.logger.debug('Deleted message', { chatId, messageId, forEveryone });
    }
    async editMessage(chatId, messageId, body, mentions) {
        this.host.ensureReady();
        const edited = await this.withPage('editMessage', async () => {
            const chat = await this.client().getChatById(chatId);
            if (!chat) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            const messages = await chat.fetchMessages({ limit: 100 });
            const message = messages.find(m => m.id._serialized === messageId || m.id.id === messageId);
            if (!message) {
                throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
            }
            this.host.ensureReady();
            return mentions?.length ? message.edit(body, { mentions }) : message.edit(body);
        });
        if (!edited) {
            throw new engine_refused_error_1.EngineRefusedError(`the edit of message ${messageId} was rejected — only the account's own text messages can be edited`);
        }
        this.host.logger.debug('Edited message', { chatId, messageId });
        return toMessageResult(edited);
    }
    async findInFetchWindow(chatId, messageId) {
        const chat = await this.client().getChatById(chatId);
        if (!chat)
            throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
        const messages = await chat.fetchMessages({ limit: 100 });
        const message = messages.find(m => m.id._serialized === messageId || m.id.id === messageId);
        if (!message)
            throw new message_not_found_error_1.MessageNotFoundError(messageId, chatId);
        this.host.ensureReady();
        return message;
    }
    async votePoll(chatId, pollMessageId, options) {
        this.host.ensureReady();
        try {
            await this.withPage('votePoll', async () => {
                const message = await this.findInFetchWindow(chatId, pollMessageId);
                const pollOptions = message.pollOptions;
                if (options.length > 0 && Array.isArray(pollOptions)) {
                    const names = pollOptions.map(o => o?.name).filter((n) => typeof n === 'string');
                    if (!options.some(option => names.includes(option))) {
                        throw new common_1.BadRequestException({
                            statusCode: 400,
                            error: 'Bad Request',
                            message: `None of the options match poll ${pollMessageId}; options must be the exact texts: ${names
                                .map(n => JSON.stringify(n))
                                .join(', ')}`,
                            code: 'POLL_OPTION_NOT_FOUND',
                            validOptions: names,
                        });
                    }
                }
                await message.vote(options);
            });
        }
        catch (error) {
            if (typeof error === 'string') {
                throw new common_1.BadRequestException(`Message ${pollMessageId} is not a poll: ${error}`);
            }
            throw error;
        }
        this.host.logger.debug('Voted on poll', { chatId, pollMessageId, options: options.length });
    }
    async pinMessage(chatId, messageId, durationSeconds) {
        this.host.ensureReady();
        const pinned = await this.withPage('pinMessage', async () => {
            const message = await this.findInFetchWindow(chatId, messageId);
            return message.pin(durationSeconds);
        });
        if (!pinned) {
            throw new engine_refused_error_1.EngineRefusedError(`the pin of message ${messageId} was rejected — in a group only admins may pin, and the duration must be 24h, 7d or 30d`);
        }
        this.host.logger.debug('Pinned message', { chatId, messageId, durationSeconds });
    }
    async starMessage(chatId, messageId, star) {
        this.host.ensureReady();
        await this.withPage('starMessage', async () => {
            const message = await this.findInFetchWindow(chatId, messageId);
            await (star ? message.star() : message.unstar());
        });
        this.host.logger.debug(star ? 'Starred message' : 'Unstarred message', { chatId, messageId });
    }
    async unpinMessage(chatId, messageId) {
        this.host.ensureReady();
        const unpinned = await this.withPage('unpinMessage', async () => {
            const message = await this.findInFetchWindow(chatId, messageId);
            return message.unpin();
        });
        if (!unpinned) {
            throw new engine_refused_error_1.EngineRefusedError(`the unpin of message ${messageId} was rejected — in a group only admins may unpin`);
        }
        this.host.logger.debug('Unpinned message', { chatId, messageId });
    }
}
exports.WwebjsMessaging = WwebjsMessaging;
//# sourceMappingURL=wwebjs-messaging.js.map