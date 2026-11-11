import type { ChatKind } from '../identity/wa-id';
export declare enum EngineStatus {
    DISCONNECTED = "disconnected",
    INITIALIZING = "initializing",
    QR_READY = "qr_ready",
    AUTHENTICATING = "authenticating",
    READY = "ready",
    ACTION_REQUIRED = "action_required",
    FAILED = "failed"
}
export interface MessageResult {
    id: string;
    timestamp: number;
    body?: string;
}
export interface Quotable {
    quotedMessageId?: string;
}
export interface MediaInput extends Quotable {
    mimetype: string;
    data: Buffer | string;
    filename?: string;
    caption?: string;
    mentions?: string[];
    ptt?: boolean;
}
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker' | 'location' | 'contact' | 'poll' | 'call' | 'revoked' | 'order' | 'product' | 'masked' | 'unknown';
export interface IncomingMessage {
    id: string;
    from: string;
    to: string;
    chatId: string;
    body: string;
    type: MessageType;
    timestamp: number;
    fromMe: boolean;
    isGroup: boolean;
    originalBody?: string;
    kind: ChatKind;
    isStatusBroadcast?: boolean;
    ephemeralDuration?: number;
    author?: string;
    mentionedIds?: string[];
    call?: {
        video: boolean;
        missed: boolean;
    };
    order?: {
        orderId: string;
        token?: string;
    };
    product?: {
        productId: string;
        title?: string;
        description?: string;
        businessOwnerJid?: string;
    };
    button?: {
        id: string;
        text?: string;
    };
    buttons?: Array<{
        id: string;
        text: string;
    }>;
    isLidSender?: boolean;
    senderPhone?: string | null;
    contact?: MessageContact;
    backgroundColor?: string;
    font?: number;
    poll?: PollDetails;
    media?: {
        mimetype: string;
        filename?: string;
        data?: string;
        omitted?: boolean;
        sizeBytes?: number;
    };
    quotedMessage?: {
        id: string;
        body: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        description?: string;
        address?: string;
        url?: string;
    };
}
export interface MessageContact {
    id?: string;
    number?: string;
    name?: string;
    pushName?: string;
    shortName?: string;
    type?: string;
    isMyContact?: boolean;
    isWAContact?: boolean;
    isBusiness?: boolean;
    isEnterprise?: boolean;
    verifiedName?: string;
    verifiedLevel?: number;
    isBlocked?: boolean;
    labels?: string[];
}
export interface Contact {
    id: string;
    name?: string;
    pushName?: string;
    number: string;
    isMyContact: boolean;
    isBlocked: boolean;
    profilePicUrl?: string;
}
export interface Group {
    id: string;
    name: string;
    participantsCount?: number;
    isAdmin?: boolean;
    linkedParentJID?: string | null;
}
export interface GroupParticipant {
    id: string;
    number: string;
    name?: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}
export interface ParticipantOperationResult {
    id: string;
    success: boolean;
    status?: number;
    message?: string;
}
export type GroupMemberAddMode = 'all' | 'admins';
export interface GroupInfo {
    id: string;
    name: string;
    description?: string;
    owner?: string;
    createdAt?: number;
    participants: GroupParticipant[];
    isReadOnly?: boolean;
    isAnnounce?: boolean;
    announce?: boolean;
    locked?: boolean;
    ephemeralSeconds?: number;
    memberAddMode?: GroupMemberAddMode;
    linkedParentJID?: string | null;
}
export interface GroupJoinInfo {
    id: string;
    name: string;
    description?: string;
    owner?: string;
    createdAt?: number;
    participantCount?: number;
}
export type GroupMembershipRequestMethod = 'invite_link' | 'non_admin_add' | 'linked_group_join';
export interface GroupMembershipRequest {
    participantId: string;
    addedById?: string;
    method?: GroupMembershipRequestMethod;
    requestedAt?: number;
}
export interface CustomLinkPreview {
    url: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnailBase64?: string;
}
export interface ContactCard extends Quotable {
    name: string;
    number: string;
}
export interface LocationInput extends Quotable {
    latitude: number;
    longitude: number;
    description?: string;
    address?: string;
}
export interface PollDetails {
    name: string;
    options: string[];
    allowMultipleAnswers: boolean;
}
export interface PollInput extends Quotable {
    name: string;
    options: string[];
    allowMultipleAnswers?: boolean;
}
export interface ReactionSender {
    senderId: string;
    emoji: string;
    timestamp: number;
}
export interface MessageReaction {
    emoji: string;
    senders: ReactionSender[];
}
export interface Label {
    id: string;
    name: string;
    hexColor: string;
}
export interface LabelInput {
    id: string;
    name?: string;
    color?: number;
}
export interface Status {
    id: string;
    contact: {
        id: string;
        name?: string;
        pushName?: string;
    };
    type: 'text' | 'image' | 'video' | 'voice';
    caption?: string;
    mediaUrl?: string;
    media?: IncomingMessage['media'];
    backgroundColor?: string;
    font?: number;
    timestamp: Date;
    expiresAt: Date;
}
export interface StatusPostOptions {
    recipients?: string[];
    backgroundColor?: string;
    font?: number;
    caption?: string;
}
export interface StatusResult {
    statusId: string;
    timestamp: Date;
    expiresAt: Date;
}
export interface Channel {
    id: string;
    name: string;
    description?: string;
    inviteCode?: string;
    subscriberCount?: number;
    picture?: string;
    verified?: boolean;
    createdAt?: number;
}
export interface ChannelMessage {
    id: string;
    body: string;
    timestamp: number;
    hasMedia: boolean;
    mediaUrl?: string;
}
export interface Catalog {
    id: string;
    name: string;
    description?: string;
    productCount: number;
    url: string;
}
export interface Product {
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    priceFormatted?: string;
    imageUrl?: string;
    url: string;
    isAvailable: boolean;
    retailerId?: string;
}
export interface ProductQueryOptions {
    page?: number;
    limit?: number;
}
export interface PaginatedProducts {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ChatSummary {
    id: string;
    name: string;
    isGroup: boolean;
    kind: ChatKind;
    unreadCount: number;
    timestamp: number;
    lastMessage?: string;
    lastMessageType?: MessageType;
    archived: boolean;
    pinned: boolean;
    muted: boolean;
    muteExpiration?: number;
}
export type ChatState = 'typing' | 'recording' | 'paused';
export type CallLinkType = 'audio' | 'video';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export interface RevokedMessage {
    id: string;
    revokedId?: string;
    chatId: string;
    from: string;
    to: string;
    type: 'revoked';
    body: '';
    timestamp: number;
}
export interface EditedMessage {
    messageId: string;
    chatId: string;
    body: string;
    senderId: string;
    from: string;
    to: string;
    fromMe: boolean;
    isGroup: boolean;
    type: MessageType;
    hasMedia: boolean;
    author?: string;
    mentionedIds?: string[];
    timestamp: number;
}
export type EventResponseKind = 'going' | 'not_going' | 'maybe' | 'unknown';
export interface EventResponseEvent {
    eventMessageId: string;
    chatId: string;
    responderId: string;
    contact?: {
        name?: string;
        pushName?: string;
    };
    fromMe: boolean;
    response: EventResponseKind;
    extraGuestCount?: number;
    eventName?: string;
    responseMessageId: string;
    timestamp: number;
}
export interface ReactionEvent {
    messageId: string;
    chatId: string;
    reaction: string;
    senderId: string;
}
export interface PollVoteEvent {
    pollMessageId: string;
    chatId: string;
    voterId: string;
    selectedOptions: string[];
    pollName?: string;
    timestamp: number;
    timestampMs: number;
}
export interface GroupEvent {
    kind: 'join' | 'leave' | 'update' | 'join_request';
    groupId: string;
    actorId?: string;
    participantIds: string[];
    changes?: {
        subject?: string;
        description?: string;
        announce?: boolean;
        locked?: boolean;
    };
    timestamp: number;
}
export interface IncomingCallEvent {
    callId: string;
    from: string;
    isVideo: boolean;
    isGroup: boolean;
    timestamp: number;
}
export interface AccountRestriction {
    kind: 'reachout_timelock' | 'tos_block' | 'proxy_block';
    code: string;
    expiresAt?: number;
}
export type PresenceState = 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
export interface ParticipantPresence {
    id: string;
    state: PresenceState;
    lastSeen?: number;
}
export interface PresenceUpdateEvent {
    chatId: string;
    participants: ParticipantPresence[];
    groupOnlineCount?: number;
}
export type CallOutcome = 'accepted' | 'rejected' | 'missed';
export interface CallOutcomeEvent {
    callId: string;
    from: string;
    outcome: CallOutcome;
    isVideo: boolean;
    isGroup: boolean;
    timestamp: number;
}
export type MessageReceiptStatus = 'delivered' | 'read' | 'played';
export interface MessageReceiptEvent {
    messageId: string;
    chatId: string;
    participant: string;
    status: MessageReceiptStatus;
    timestamp: number;
}
export interface InboundTicket {
    reserve: () => boolean | Promise<boolean>;
    holdUntil: (p: Promise<unknown>) => void;
    drop: () => void;
    readonly revoked: boolean;
}
export interface InboundOutcome {
    conflict?: boolean;
}
export interface InboundReceipt {
    settled: Promise<InboundOutcome | undefined>;
}
export interface EngineEventCallbacks {
    onQRCode?: (qr: string) => void;
    onReady?: (phone: string, pushName: string) => void;
    onPushNameChanged?: (pushName: string) => void;
    admitInbound?: (arrival: {
        id: string;
        chatId: string;
        needsRoom: boolean;
        status: boolean;
        fromMe?: boolean;
        author?: string;
    }) => InboundTicket | undefined;
    onMessage?: (message: IncomingMessage, ticket?: InboundTicket) => void | InboundReceipt;
    onMessageCreate?: (message: IncomingMessage, ticket?: InboundTicket) => void;
    onMessageAck?: (messageId: string, status: DeliveryStatus, chatId?: string) => void;
    onMessageReceipt?: (event: MessageReceiptEvent) => void;
    onMessageRevoked?: (message: RevokedMessage, actor?: {
        fromMe: boolean;
    }) => void;
    onMessageReaction?: (event: ReactionEvent) => void;
    onMessageEdited?: (message: EditedMessage) => void;
    onEventResponse?: (event: EventResponseEvent) => void;
    onPollVote?: (event: PollVoteEvent) => void;
    onGroupEvent?: (event: GroupEvent) => void;
    onCall?: (event: IncomingCallEvent) => void;
    onHistoryMessages?: (messages: IncomingMessage[]) => void | Promise<IncomingMessage[] | void>;
    onDisconnected?: (reason: string) => void;
    onReconnecting?: (attempt: number, nextDelayMs: number) => void;
    onStateChanged?: (state: EngineStatus) => void;
    onActionRequired?: (reason: string) => void;
    onAccountRestriction?: (restriction: AccountRestriction | null) => void;
    onPresenceUpdate?: (event: PresenceUpdateEvent) => void;
    onCallOutcome?: (event: CallOutcomeEvent) => void;
    onError?: (reason: string) => void;
    onCredentialTeardownStarted?: (operation: Promise<void>) => void;
    claimStuckAuthRecovery?: () => boolean;
}
export interface SessionLifecycleCapability {
    initialize(callbacks: EngineEventCallbacks): Promise<void>;
    disconnect(): Promise<void>;
    logout(): Promise<void>;
    destroy(): Promise<void>;
    forceDestroy(): Promise<void>;
    getStatus(): EngineStatus;
    probeLiveness?(): Promise<boolean>;
    getQRCode(): string | null;
    requestPairingCode(phoneNumber: string): Promise<string>;
    getPhoneNumber(): string | null;
    getPushName(): string | null;
}
export interface MessagingCapability {
    sendTextMessage(chatId: string, text: string, mentions?: string[], options?: {
        linkPreview?: boolean;
        customPreview?: CustomLinkPreview;
    } & Quotable): Promise<MessageResult>;
    sendImageMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendVideoMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendAudioMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendDocumentMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendLocationMessage(chatId: string, location: LocationInput): Promise<MessageResult>;
    sendContactMessage(chatId: string, contact: ContactCard): Promise<MessageResult>;
    sendStickerMessage(chatId: string, media: MediaInput): Promise<MessageResult>;
    sendPollMessage(chatId: string, poll: PollInput): Promise<MessageResult>;
    replyToMessage(chatId: string, quotedMsgId: string, text: string, mentions?: string[]): Promise<MessageResult>;
    forwardMessage(fromChatId: string, toChatId: string, messageId: string): Promise<MessageResult>;
}
export interface MessageOperationsCapability {
    reactToMessage(chatId: string, messageId: string, emoji: string): Promise<void>;
    getMessageReactions(chatId: string, messageId: string): Promise<MessageReaction[]>;
    deleteMessage(chatId: string, messageId: string, forEveryone?: boolean): Promise<void>;
    editMessage(chatId: string, messageId: string, body: string, mentions?: string[]): Promise<MessageResult>;
    starMessage(chatId: string, messageId: string, star: boolean): Promise<void>;
    votePoll(chatId: string, pollMessageId: string, options: string[]): Promise<void>;
    clickButton(chatId: string, messageId: string, buttonId: string, text?: string): Promise<MessageResult>;
    pinMessage(chatId: string, messageId: string, durationSeconds: number): Promise<void>;
    unpinMessage(chatId: string, messageId: string): Promise<void>;
}
export interface ChatHistoryCapability {
    getChatHistory(chatId: string, limit?: number, includeMedia?: boolean, mediaMaxBytes?: number, signal?: AbortSignal): Promise<IncomingMessage[]>;
}
export interface ContactCapability {
    readonly contactPhoneLookupPersistence?: 'seed';
    getContacts(): Promise<Contact[]>;
    getContactById(contactId: string): Promise<Contact | null>;
    checkNumberExists(number: string): Promise<boolean>;
    getNumberId(number: string): Promise<string | null>;
    resolveContactPhone(contactId: string): Promise<string | null>;
    getProfilePicture(contactId: string): Promise<string | null>;
    blockContact(contactId: string): Promise<void>;
    unblockContact(contactId: string): Promise<void>;
    getBlockedContacts(): Promise<string[]>;
    upsertContact(contactId: string, firstName: string, lastName?: string): Promise<void>;
    deleteContact(contactId: string): Promise<void>;
}
export interface GroupCapability {
    getGroups(): Promise<Group[]>;
    getGroupInfo(groupId: string): Promise<GroupInfo | null>;
    createGroup(name: string, participants: string[]): Promise<Group>;
    addParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    removeParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    promoteParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    demoteParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    leaveGroup(groupId: string): Promise<void>;
    setGroupSubject(groupId: string, subject: string): Promise<void>;
    setGroupDescription(groupId: string, description: string): Promise<void>;
    getGroupInviteCode(groupId: string): Promise<string>;
    revokeGroupInviteCode(groupId: string): Promise<string>;
    joinGroupViaInviteCode(inviteCode: string): Promise<string>;
    getGroupJoinInfo(inviteCode: string): Promise<GroupJoinInfo>;
    setGroupMessagesAdminsOnly(groupId: string, adminsOnly: boolean): Promise<void>;
    setGroupInfoAdminsOnly(groupId: string, adminsOnly: boolean): Promise<void>;
    setGroupPicture(groupId: string, media: MediaInput): Promise<void>;
    deleteGroupPicture(groupId: string): Promise<void>;
    setGroupMemberAddMode(groupId: string, mode: GroupMemberAddMode): Promise<void>;
    setGroupEphemeral(groupId: string, durationSec: number): Promise<void>;
    setGroupMemberLabel(groupId: string, label: string): Promise<void>;
    getGroupMembershipRequests(groupId: string): Promise<GroupMembershipRequest[]>;
    approveGroupMembershipRequests(groupId: string, participants?: string[]): Promise<ParticipantOperationResult[]>;
    rejectGroupMembershipRequests(groupId: string, participants?: string[]): Promise<ParticipantOperationResult[]>;
}
export interface CallCapability {
    rejectCall(callId: string): Promise<void>;
    createCallLink(type: CallLinkType, startTime: number): Promise<string>;
}
export interface ProfileCapability {
    setProfileName(name: string): Promise<void>;
    setProfileStatus(status: string): Promise<void>;
    setProfilePicture(media: MediaInput): Promise<void>;
    deleteProfilePicture(): Promise<void>;
}
export interface LabelCapability {
    getLabels(): Promise<Label[]>;
    getLabelById(labelId: string): Promise<Label | null>;
    getChatLabels(chatId: string): Promise<Label[]>;
    addLabelToChat(chatId: string, labelId: string): Promise<void>;
    upsertLabel(label: LabelInput): Promise<void>;
    deleteLabel(labelId: string): Promise<void>;
    getChatsByLabel(labelId: string): Promise<ChatSummary[]>;
    removeLabelFromChat(chatId: string, labelId: string): Promise<void>;
}
export interface ChannelCapability {
    getSubscribedChannels(): Promise<Channel[]>;
    getChannelById(channelId: string): Promise<Channel | null>;
    subscribeToChannel(inviteCode: string): Promise<Channel>;
    unsubscribeFromChannel(channelId: string): Promise<void>;
    getChannelMessages(channelId: string, limit?: number): Promise<ChannelMessage[]>;
    createChannel(name: string, description?: string): Promise<Channel>;
    deleteChannel(channelId: string): Promise<void>;
    muteChannel(channelId: string, mute: boolean): Promise<void>;
    demoteChannelAdmin(channelId: string, userId: string): Promise<void>;
    transferChannelOwnership(channelId: string, newOwnerId: string): Promise<void>;
}
export interface StatusCapability {
    getContactStatuses(): Promise<Status[]>;
    getContactStatus(contactId: string): Promise<Status[]>;
    postTextStatus(text: string, options: StatusPostOptions): Promise<StatusResult>;
    postImageStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVideoStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    postVoiceStatus(media: MediaInput, options: StatusPostOptions): Promise<StatusResult>;
    deleteStatus(statusId: string): Promise<void>;
}
export interface CatalogCapability {
    getCatalog(): Promise<Catalog | null>;
    getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts>;
    getProduct(productId: string): Promise<Product | null>;
    sendProduct(chatId: string, productId: string, body?: string): Promise<MessageResult>;
    sendCatalog(chatId: string, body?: string): Promise<MessageResult>;
}
export interface StoredChatMessage {
    id: string;
    fromMe: boolean;
    author?: string;
    timestamp: number;
    lid?: string;
    authorLid?: string;
}
export type StoredChatMessageLookup = () => Promise<StoredChatMessage | null>;
export interface ChatCapability {
    getChats(): Promise<ChatSummary[]>;
    sendSeen(chatId: string, messageIds?: string[], authors?: ReadonlyMap<string, string>, stored?: StoredChatMessageLookup): Promise<boolean>;
    markUnread(chatId: string, stored?: StoredChatMessageLookup): Promise<boolean>;
    deleteChat(chatId: string, stored?: StoredChatMessageLookup): Promise<boolean>;
    archiveChat(chatId: string, archive: boolean, stored?: StoredChatMessageLookup): Promise<boolean>;
    pinChat(chatId: string, pin: boolean): Promise<boolean>;
    muteChat(chatId: string, muteUntil: number | null): Promise<void>;
    clearChatMessages(chatId: string, stored?: StoredChatMessageLookup): Promise<boolean>;
}
export interface PresenceCapability {
    sendChatState(chatId: string, state: ChatState): Promise<void>;
    setOnlinePresence(available: boolean): Promise<void>;
    subscribeToPresence(chatId: string): Promise<void>;
}
export interface IWhatsAppEngine extends SessionLifecycleCapability, MessagingCapability, MessageOperationsCapability, ChatHistoryCapability, ContactCapability, GroupCapability, CallCapability, ProfileCapability, LabelCapability, ChannelCapability, StatusCapability, CatalogCapability, ChatCapability, PresenceCapability {
}
