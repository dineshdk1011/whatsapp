"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebJsAdapter = void 0;
const whatsapp_engine_interface_1 = require("../interfaces/whatsapp-engine.interface");
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
const wa_id_1 = require("../identity/wa-id");
const logger_service_1 = require("../../common/services/logger.service");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const channel_media_not_supported_error_1 = require("../../common/errors/channel-media-not-supported.error");
const wwebjs_groups_1 = require("./wwebjs-groups");
const wwebjs_message_events_1 = require("./wwebjs-message-events");
const wwebjs_messaging_1 = require("./wwebjs-messaging");
const wwebjs_contacts_1 = require("./wwebjs-contacts");
const wwebjs_profile_1 = require("./wwebjs-profile");
const wwebjs_labels_1 = require("./wwebjs-labels");
const wwebjs_channels_1 = require("./wwebjs-channels");
const wwebjs_status_1 = require("./wwebjs-status");
const wwebjs_chats_1 = require("./wwebjs-chats");
const wwebjs_catalog_1 = require("./wwebjs-catalog");
const wwebjs_group_events_1 = require("./wwebjs-group-events");
const wwebjs_onboarding_1 = require("./wwebjs-onboarding");
const wwebjs_lifecycle_1 = require("./wwebjs-lifecycle");
const wwebjs_reconcile_1 = require("./wwebjs-reconcile");
const wwebjs_stuck_auth_1 = require("./wwebjs-stuck-auth");
const wwebjs_calls_1 = require("./wwebjs-calls");
const inbound_media_cap_1 = require("./inbound-media-cap");
const concurrency_limiter_1 = require("../../common/utils/concurrency-limiter");
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
class WhatsAppWebJsAdapter {
    config;
    contactPhoneLookupPersistence = 'seed';
    logger = (0, logger_service_1.createLogger)('WhatsAppWebJsAdapter');
    inboundLimiter = new concurrency_limiter_1.ConcurrencyLimiter((0, inbound_media_cap_1.inboundMediaConcurrency)());
    callbacks = {};
    host;
    groups;
    messaging;
    contacts;
    profile;
    labels;
    channels;
    statuses;
    chats;
    catalog;
    lifecycle;
    reconcile;
    stuckAuth;
    calls;
    onboardingWatcher;
    get client() {
        return this.lifecycle.client;
    }
    set client(value) {
        this.lifecycle.client = value;
    }
    get status() {
        return this.lifecycle.status;
    }
    set status(value) {
        this.lifecycle.status = value;
    }
    get qrCode() {
        return this.lifecycle.qrCode;
    }
    get tearingDown() {
        return this.lifecycle.tearingDown;
    }
    set tearingDown(value) {
        this.lifecycle.tearingDown = value;
    }
    get logoutInitiated() {
        return this.lifecycle.logoutInitiated;
    }
    set logoutInitiated(value) {
        this.lifecycle.logoutInitiated = value;
    }
    get disconnectReported() {
        return this.lifecycle.disconnectReported;
    }
    set disconnectReported(value) {
        this.lifecycle.disconnectReported = value;
    }
    constructor(config) {
        this.config = config;
        this.host = {
            ensureReady: () => this.ensureReady(),
            getClient: () => {
                this.ensureReady();
                return this.client;
            },
            logger: this.logger,
            isPageTransportError: error => this.isPageTransportError(error),
            reportIfPageTransportError: (error, context) => this.reportIfPageTransportError(error, context),
            reportOnceGone: (error, context) => this.lifecycle.reportOnceGone(error, context),
            ensureNotChannelRecipient: chatId => this.ensureNotChannelRecipient(chatId),
            getNumberId: number => this.contacts.lookupNumberId(number),
            capInboundMediaFor: (msg, maxBytesOverride, ticket) => this.capInboundMediaFor(msg, maxBytesOverride, ticket),
            config: this.config,
            getCallbacks: () => this.callbacks,
        };
        this.groups = new wwebjs_groups_1.WwebjsGroups(this.host);
        this.messaging = new wwebjs_messaging_1.WwebjsMessaging(this.host);
        this.contacts = new wwebjs_contacts_1.WwebjsContacts(this.host);
        this.profile = new wwebjs_profile_1.WwebjsProfile(this.host);
        this.labels = new wwebjs_labels_1.WwebjsLabels(this.host);
        this.channels = new wwebjs_channels_1.WwebjsChannels(this.host);
        this.statuses = new wwebjs_status_1.WwebjsStatus(this.host);
        this.chats = new wwebjs_chats_1.WwebjsChats(this.host, this.messaging);
        this.catalog = new wwebjs_catalog_1.WwebjsCatalog(this.host);
        this.reconcile = new wwebjs_reconcile_1.WwebjsReadyReconcile({
            logger: this.logger,
            config: this.config,
            getClient: () => this.client,
            getStatus: () => this.status,
            setStatus: status => this.lifecycle.setStatus(status),
            getCallbacks: () => this.callbacks,
            markReadyFromClientInfo: () => this.lifecycle.markReadyFromClientInfo(),
            wasFreshPairing: () => this.lifecycle.qrShown,
            recoverFromStuckAuth: () => this.recoverFromStuckAuth(),
        });
        this.stuckAuth = new wwebjs_stuck_auth_1.WwebjsStuckAuth({
            logger: this.logger,
            config: this.config,
            getClient: () => this.client,
            setClient: client => (this.lifecycle.client = client),
            setStatus: status => this.lifecycle.setStatus(status),
            getCallbacks: () => this.callbacks,
        });
        this.calls = new wwebjs_calls_1.WwebjsCalls({
            logger: this.logger,
            isTearingDown: () => this.tearingDown,
            getCallbacks: () => this.callbacks,
        });
        this.onboardingWatcher = new wwebjs_onboarding_1.WwebjsOnboardingWatcher({
            logger: this.logger,
            config: this.config,
            getClient: () => this.client,
            getStatus: () => this.status,
            setStatus: status => this.lifecycle.setStatus(status),
            isTearingDown: () => this.tearingDown,
            isDisconnectReported: () => this.disconnectReported,
            getCallbacks: () => this.callbacks,
        });
        this.lifecycle = new wwebjs_lifecycle_1.WwebjsLifecycle({
            logger: this.logger,
            config: this.config,
            getCallbacks: () => this.callbacks,
            scheduleReadyReconcile: () => this.reconcile.scheduleReadyReconcile(),
            clearReadyReconcile: () => this.reconcile.clearReadyReconcile(),
            startOnboardingWatcher: () => this.onboardingWatcher.startOnboardingWatcher(),
            clearOnboardingWatcher: () => this.onboardingWatcher.clearOnboardingWatcher(),
            clearLiveCalls: () => this.calls.clearLiveCalls(),
            clearLocalAuth: () => this.clearLocalAuth(),
            attachDomainEvents: client => this.attachDomainEvents(client),
        });
    }
    async capInboundMediaFor(msg, maxBytesOverride, ticket) {
        if (!(0, inbound_media_cap_1.isMediaDownloadEnabled)()) {
            return (0, wwebjs_messaging_1.declaredOnlyMedia)(msg);
        }
        const msgId = (0, whatsapp_web_js_types_1.readWid)(msg.id);
        const maxBytes = Math.min(maxBytesOverride ?? Number.POSITIVE_INFINITY, (0, inbound_media_cap_1.inboundMediaMaxBytes)());
        const declared = (0, wwebjs_messaging_1.declaredMediaSize)(msg);
        if (declared > maxBytes) {
            this.logger.warn('Inbound media declared size exceeds the cap; skipped download', {
                msgId,
                sizeBytes: declared,
                maxBytes,
            });
            return (0, wwebjs_messaging_1.declaredOnlyMedia)(msg);
        }
        if (ticket) {
            const granted = ticket.reserve();
            if (!(granted === true || (granted !== false && (await granted)))) {
                this.logger.warn('No room for inbound media within the wait; emitting the omitted marker', { msgId });
                return (0, wwebjs_messaging_1.declaredOnlyMedia)(msg);
            }
        }
        let resolveBounded = () => undefined;
        const boundedReady = new Promise(resolve => {
            resolveBounded = resolve;
        });
        let abandoned = false;
        const downloadInSlot = () => {
            if (abandoned) {
                resolveBounded(null);
                return Promise.resolve();
            }
            const download = (0, wwebjs_messaging_1.downloadCappedMedia)(msg, maxBytes)
                .then(result => {
                if (!result) {
                    this.logger.warn('Inbound media download returned nothing; emitting the omitted marker', {
                        msgId,
                        answer: String(result),
                    });
                }
                return result;
            })
                .catch((error) => {
                this.logger.warn('Inbound media download failed; emitting the omitted marker', {
                    msgId,
                    error: String(error),
                });
                return null;
            });
            resolveBounded((0, inbound_media_cap_1.withInboundDownloadTimeout)(download, (0, inbound_media_cap_1.inboundMediaTimeoutMs)(), () => this.logger.warn('Inbound media download timed out (MEDIA_DOWNLOAD_TIMEOUT_MS); emitting message without media', {
                msgId,
            })));
            return download.then(() => undefined, () => undefined);
        };
        const slotHeld = this.inboundLimiter.run(() => (0, inbound_media_cap_1.runUnderGlobalMediaGate)(downloadInSlot));
        ticket?.holdUntil(slotHeld);
        void slotHeld.catch((error) => {
            this.logger.warn('Inbound media slot holder rejected unexpectedly; emitting message without media', {
                msgId,
                error: String(error),
            });
            resolveBounded(null);
        });
        const media = await (0, inbound_media_cap_1.withInboundDownloadTimeout)(boundedReady, (0, inbound_media_cap_1.inboundMediaTimeoutMs)(), () => {
            abandoned = true;
            this.logger.warn('Inbound media did not arrive within MEDIA_DOWNLOAD_TIMEOUT_MS; emitting message without media', {
                msgId,
            });
        });
        if (!media) {
            return (0, wwebjs_messaging_1.declaredOnlyMedia)(msg);
        }
        const capped = (0, inbound_media_cap_1.capInboundMedia)({
            mimetype: media.mimetype,
            filename: media.filename || undefined,
            sizeBytes: media.data ? Buffer.byteLength(media.data, 'base64') : media.sizeBytes,
            toBase64: () => media.data,
            maxBytes,
        });
        if (capped.omitted) {
            this.logger.warn('Inbound media exceeds MEDIA_DOWNLOAD_MAX_BYTES; dropped payload, kept envelope', {
                msgId,
                sizeBytes: capped.sizeBytes,
            });
        }
        return capped;
    }
    async initialize(callbacks) {
        this.callbacks = callbacks;
        return this.lifecycle.initialize();
    }
    isPageTransportError(error) {
        return this.lifecycle.isPageTransportError(error);
    }
    reportIfPageTransportError(error, context) {
        this.lifecycle.reportIfPageTransportError(error, context);
    }
    async disconnect() {
        return this.lifecycle.disconnect();
    }
    async logout() {
        return this.lifecycle.logout();
    }
    async destroy() {
        return this.lifecycle.destroy();
    }
    async forceDestroy() {
        return this.lifecycle.forceDestroy();
    }
    getStatus() {
        return this.lifecycle.getStatus();
    }
    async probeLiveness() {
        return this.lifecycle.probeLiveness();
    }
    getQRCode() {
        return this.lifecycle.getQRCode();
    }
    async requestPairingCode(phoneNumber) {
        return this.lifecycle.requestPairingCode(phoneNumber);
    }
    getPhoneNumber() {
        return this.lifecycle.getPhoneNumber();
    }
    getPushName() {
        return this.lifecycle.getPushName();
    }
    recoverFromStuckAuth() {
        return this.stuckAuth.recoverFromStuckAuth();
    }
    clearLocalAuth() {
        return this.stuckAuth.clearLocalAuth();
    }
    attachDomainEvents(client) {
        (0, wwebjs_message_events_1.registerWwebjsMessageEvents)(client, this.host);
        (0, wwebjs_group_events_1.registerWwebjsGroupEvents)(client, this.host);
        client.on('call', call => this.calls.handleIncomingCall(call));
    }
    createChannel(name, description) {
        return this.channels.createChannel(name, description);
    }
    deleteChannel(channelId) {
        return this.channels.deleteChannel(channelId);
    }
    muteChannel(channelId, mute) {
        return this.channels.muteChannel(channelId, mute);
    }
    demoteChannelAdmin(channelId, userId) {
        return this.channels.demoteChannelAdmin(channelId, userId);
    }
    transferChannelOwnership(channelId, newOwnerId) {
        return this.channels.transferChannelOwnership(channelId, newOwnerId);
    }
    getChatsByLabel(labelId) {
        return this.labels.getChatsByLabel(labelId);
    }
    async upsertLabel(_label) {
        throw new engine_not_supported_error_1.EngineNotSupportedError('upsertLabel');
    }
    async deleteLabel(_labelId) {
        throw new engine_not_supported_error_1.EngineNotSupportedError('deleteLabel');
    }
    async subscribeToPresence(_chatId) {
        throw new engine_not_supported_error_1.EngineNotSupportedError('subscribeToPresence');
    }
    createCallLink(type, startTime) {
        return this.profile.createCallLink(type, startTime);
    }
    async rejectCall(callId) {
        return this.calls.rejectCall(callId);
    }
    sendTextMessage(chatId, text, mentions, options) {
        return this.messaging.sendTextMessage(chatId, text, mentions, options);
    }
    sendImageMessage(chatId, media) {
        return this.messaging.sendImageMessage(chatId, media);
    }
    sendVideoMessage(chatId, media) {
        return this.messaging.sendVideoMessage(chatId, media);
    }
    sendAudioMessage(chatId, media) {
        return this.messaging.sendAudioMessage(chatId, media);
    }
    sendDocumentMessage(chatId, media) {
        return this.messaging.sendDocumentMessage(chatId, media);
    }
    getContacts() {
        return this.contacts.getContacts();
    }
    getContactById(contactId) {
        return this.contacts.getContactById(contactId);
    }
    getNumberId(number) {
        return this.contacts.getNumberId(number);
    }
    checkNumberExists(number) {
        return this.contacts.checkNumberExists(number);
    }
    resolveContactPhone(contactId) {
        return this.contacts.resolveContactPhone(contactId);
    }
    getGroups() {
        return this.groups.getGroups();
    }
    sendLocationMessage(chatId, location) {
        return this.messaging.sendLocationMessage(chatId, location);
    }
    sendContactMessage(chatId, contact) {
        return this.messaging.sendContactMessage(chatId, contact);
    }
    sendStickerMessage(chatId, media) {
        return this.messaging.sendStickerMessage(chatId, media);
    }
    sendPollMessage(chatId, poll) {
        return this.messaging.sendPollMessage(chatId, poll);
    }
    replyToMessage(chatId, quotedMsgId, text, mentions) {
        return this.messaging.replyToMessage(chatId, quotedMsgId, text, mentions);
    }
    forwardMessage(fromChatId, toChatId, messageId) {
        return this.messaging.forwardMessage(fromChatId, toChatId, messageId);
    }
    getGroupInfo(groupId) {
        return this.groups.getGroupInfo(groupId);
    }
    createGroup(name, participants) {
        return this.groups.createGroup(name, participants);
    }
    addParticipants(groupId, participants) {
        return this.groups.addParticipants(groupId, participants);
    }
    removeParticipants(groupId, participants) {
        return this.groups.removeParticipants(groupId, participants);
    }
    promoteParticipants(groupId, participants) {
        return this.groups.promoteParticipants(groupId, participants);
    }
    demoteParticipants(groupId, participants) {
        return this.groups.demoteParticipants(groupId, participants);
    }
    leaveGroup(groupId) {
        return this.groups.leaveGroup(groupId);
    }
    setGroupSubject(groupId, subject) {
        return this.groups.setGroupSubject(groupId, subject);
    }
    setGroupDescription(groupId, description) {
        return this.groups.setGroupDescription(groupId, description);
    }
    reactToMessage(chatId, messageId, emoji) {
        return this.messaging.reactToMessage(chatId, messageId, emoji);
    }
    getMessageReactions(chatId, messageId) {
        return this.messaging.getMessageReactions(chatId, messageId);
    }
    getLabels() {
        return this.labels.getLabels();
    }
    getLabelById(labelId) {
        return this.labels.getLabelById(labelId);
    }
    getChatLabels(chatId) {
        return this.labels.getChatLabels(chatId);
    }
    addLabelToChat(chatId, labelId) {
        return this.labels.addLabelToChat(chatId, labelId);
    }
    removeLabelFromChat(chatId, labelId) {
        return this.labels.removeLabelFromChat(chatId, labelId);
    }
    getSubscribedChannels() {
        return this.channels.getSubscribedChannels();
    }
    getChannelById(channelId) {
        return this.channels.getChannelById(channelId);
    }
    subscribeToChannel(_inviteCode) {
        return this.channels.subscribeToChannel(_inviteCode);
    }
    unsubscribeFromChannel(channelId) {
        return this.channels.unsubscribeFromChannel(channelId);
    }
    getChannelMessages(channelId, limit = 50) {
        return this.channels.getChannelMessages(channelId, limit);
    }
    getChatHistory(chatId, limit = 50, includeMedia = false, mediaMaxBytes, signal) {
        return this.messaging.getChatHistory(chatId, limit, includeMedia, mediaMaxBytes, signal);
    }
    starMessage(chatId, messageId, star) {
        return this.messaging.starMessage(chatId, messageId, star);
    }
    pinMessage(chatId, messageId, durationSeconds) {
        return this.messaging.pinMessage(chatId, messageId, durationSeconds);
    }
    votePoll(chatId, pollMessageId, options) {
        return this.messaging.votePoll(chatId, pollMessageId, options);
    }
    async clickButton() {
        throw new engine_not_supported_error_1.EngineNotSupportedError('clickButton');
    }
    unpinMessage(chatId, messageId) {
        return this.messaging.unpinMessage(chatId, messageId);
    }
    deleteMessage(chatId, messageId, forEveryone = true) {
        return this.messaging.deleteMessage(chatId, messageId, forEveryone);
    }
    editMessage(chatId, messageId, body, mentions) {
        return this.messaging.editMessage(chatId, messageId, body, mentions);
    }
    getProfilePicture(contactId) {
        return this.contacts.getProfilePicture(contactId);
    }
    blockContact(contactId) {
        return this.contacts.blockContact(contactId);
    }
    upsertContact(contactId, firstName, lastName) {
        return this.contacts.upsertContact(contactId, firstName, lastName);
    }
    deleteContact(contactId) {
        return this.contacts.deleteContact(contactId);
    }
    unblockContact(contactId) {
        return this.contacts.unblockContact(contactId);
    }
    getBlockedContacts() {
        return this.contacts.getBlockedContacts();
    }
    setProfileName(name) {
        return this.profile.setProfileName(name);
    }
    setProfileStatus(status) {
        return this.profile.setProfileStatus(status);
    }
    deleteProfilePicture() {
        return this.profile.deleteProfilePicture();
    }
    setProfilePicture(media) {
        return this.profile.setProfilePicture(media);
    }
    getGroupInviteCode(groupId) {
        return this.groups.getGroupInviteCode(groupId);
    }
    revokeGroupInviteCode(groupId) {
        return this.groups.revokeGroupInviteCode(groupId);
    }
    getGroupJoinInfo(inviteCode) {
        return this.groups.getGroupJoinInfo(inviteCode);
    }
    joinGroupViaInviteCode(inviteCode) {
        return this.groups.joinGroupViaInviteCode(inviteCode);
    }
    setGroupMessagesAdminsOnly(groupId, adminsOnly) {
        return this.groups.setGroupMessagesAdminsOnly(groupId, adminsOnly);
    }
    setGroupInfoAdminsOnly(groupId, adminsOnly) {
        return this.groups.setGroupInfoAdminsOnly(groupId, adminsOnly);
    }
    setGroupMemberAddMode(groupId, mode) {
        return this.groups.setGroupMemberAddMode(groupId, mode);
    }
    setGroupPicture(groupId, media) {
        return this.groups.setGroupPicture(groupId, media);
    }
    deleteGroupPicture(groupId) {
        return this.groups.deleteGroupPicture(groupId);
    }
    setGroupEphemeral(groupId, durationSec) {
        return this.groups.setGroupEphemeral(groupId, durationSec);
    }
    setGroupMemberLabel(groupId, label) {
        return this.groups.setGroupMemberLabel(groupId, label);
    }
    getGroupMembershipRequests(groupId) {
        return this.groups.getGroupMembershipRequests(groupId);
    }
    approveGroupMembershipRequests(groupId, participants) {
        return this.groups.approveGroupMembershipRequests(groupId, participants);
    }
    rejectGroupMembershipRequests(groupId, participants) {
        return this.groups.rejectGroupMembershipRequests(groupId, participants);
    }
    getContactStatuses() {
        return this.statuses.getContactStatuses();
    }
    getContactStatus(contactId) {
        return this.statuses.getContactStatus(contactId);
    }
    postTextStatus(text, options) {
        return this.statuses.postTextStatus(text, options);
    }
    postImageStatus(media, options) {
        return this.statuses.postImageStatus(media, options);
    }
    postVideoStatus(media, options) {
        return this.statuses.postVideoStatus(media, options);
    }
    postVoiceStatus(media, options) {
        return this.statuses.postVoiceStatus(media, options);
    }
    deleteStatus(statusId) {
        return this.statuses.deleteStatus(statusId);
    }
    getCatalog() {
        return this.catalog.getCatalog();
    }
    getProducts(_options) {
        return this.catalog.getProducts(_options);
    }
    getProduct(_productId) {
        return this.catalog.getProduct(_productId);
    }
    sendProduct(_chatId, _productId, _body) {
        return this.catalog.sendProduct(_chatId, _productId, _body);
    }
    sendCatalog(_chatId, _body) {
        return this.catalog.sendCatalog(_chatId, _body);
    }
    getChats() {
        return this.chats.getChats();
    }
    sendSeen(chatId) {
        return this.chats.sendSeen(chatId);
    }
    muteChat(chatId, muteUntil) {
        return this.chats.muteChat(chatId, muteUntil);
    }
    pinChat(chatId, pin) {
        return this.chats.pinChat(chatId, pin);
    }
    archiveChat(chatId, archive) {
        return this.chats.archiveChat(chatId, archive);
    }
    clearChatMessages(chatId) {
        return this.chats.clearChatMessages(chatId);
    }
    markUnread(chatId) {
        return this.chats.markUnread(chatId);
    }
    deleteChat(chatId) {
        return this.chats.deleteChat(chatId);
    }
    sendChatState(chatId, state) {
        return this.chats.sendChatState(chatId, state);
    }
    setOnlinePresence(available) {
        return this.chats.setOnlinePresence(available);
    }
    ensureReady() {
        if (this.status !== whatsapp_engine_interface_1.EngineStatus.READY || !this.client) {
            throw new engine_not_ready_error_1.EngineNotReadyError();
        }
        if (this.lifecycle.isInNavigationReinjectWindow() || this.lifecycle.isPageWithoutHelpers()) {
            throw new engine_not_ready_error_1.EngineNotReadyError(wwebjs_lifecycle_1.PAGE_RELOADING_MESSAGE);
        }
    }
    ensureNotChannelRecipient(chatId) {
        if ((0, wa_id_1.isChannelJid)(chatId)) {
            throw new channel_media_not_supported_error_1.ChannelMediaNotSupportedError();
        }
    }
}
exports.WhatsAppWebJsAdapter = WhatsAppWebJsAdapter;
//# sourceMappingURL=whatsapp-web-js.adapter.js.map