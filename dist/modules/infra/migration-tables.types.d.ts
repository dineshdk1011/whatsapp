export interface SessionRow {
    id: string;
    name: string;
    status: string;
    phone: string | null;
    pushName: string | null;
    config: string | Record<string, unknown>;
    proxyUrl: string | null;
    proxyType: string | null;
    connectedAt: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    updatedAt: string;
    desiredState?: string | null;
}
export interface WebhookRow {
    id: string;
    sessionId: string;
    url: string;
    events: string | string[];
    secret?: string | null;
    headers?: string | Record<string, string>;
    filters: string | Record<string, unknown> | null;
    active: boolean | number;
    retryCount: number;
    lastTriggeredAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface MessageRow {
    id: string;
    sessionId: string;
    waMessageId: string | null;
    chatId: string;
    chatName: string | null;
    author: string | null;
    from: string;
    to: string;
    body: string | null;
    type: string;
    direction: string;
    timestamp: number | string | null;
    metadata: string | Record<string, unknown> | null;
    status: string;
    createdAt: string;
    mediaPath: string | null;
    mediaMimetype: string | null;
    body_ts?: unknown;
}
export interface MessageBatchRow {
    id: string;
    batch_id: string;
    session_id: string;
    status: string;
    messages: string | unknown[];
    options: string | Record<string, unknown> | null;
    progress: string | Record<string, unknown> | null;
    results: string | unknown[] | null;
    current_index: number;
    created_at: string;
    updated_at: string;
    started_at: string | null;
    completed_at: string | null;
}
export interface TemplateRow {
    id: string;
    sessionId: string;
    name: string;
    body: string;
    header: string | null;
    footer: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface BaileysStoredMessageRow {
    id: string;
    sessionId: string;
    waMessageId: string;
    serializedMessage: string;
    createdAt: string;
}
export interface LidMappingRow {
    isReported?: boolean | number;
    lid: string;
    phone: string | null;
    sessionId: string | null;
    updatedAt: string;
}
export interface ChatStateRow {
    sessionId: string;
    chatId: string;
    muteEndTime: number | null;
    archived: boolean | number;
    pinned: boolean | number;
    observed?: string | null;
    deletedAt?: number | null;
    updatedAt: string;
}
export interface PluginInstanceRow {
    id: string;
    pluginId: string;
    instanceId: string;
    sessionScope: string | null;
    secret: string;
    verifyToken: string | null;
    config: string | Record<string, unknown> | null;
    enabled: boolean | number;
    createdAt: string;
    updatedAt: string;
}
export interface ConversationMappingRow {
    id: string;
    sessionId: string;
    chatId: string;
    pluginId: string;
    instanceId: string;
    providerConversationId: string;
    handoverState: string;
    metadata: string | Record<string, unknown> | null;
    updatedAt: string;
}
export interface IngressEventRow {
    id: string;
    instanceId: string;
    pluginId: string;
    providerDeliveryId: string;
    route: string;
    payload: string | Record<string, unknown> | null;
    payloadHash?: string | null;
    dispatchState?: 'pending' | 'dispatched' | 'failed' | null;
    dispatchAttempts?: number;
    lastDispatchAt?: string | null;
    sessionId: string | null;
    createdAt: string;
}
export interface WebhookDeliveryFailureRow {
    id: string;
    webhookId: string;
    sessionId: string;
    event: string;
    url: string;
    idempotencyKey: string | null;
    deliveryId: string | null;
    attempts: number;
    lastStatusCode: number | null;
    lastError: string;
    payload?: string | null;
    createdAt: string;
}
export interface WebhookOutboxEventRow {
    id: string;
    webhookId: string;
    sessionId: string;
    event: string;
    idempotencyKey: string;
    deliveryId: string;
    payload: string | null;
    state: string | null;
    attempts: number;
    lastAttemptAt: string | null;
    createdAt: string;
}
export interface IntegrationDeliveryFailureRow {
    id: string;
    direction: string;
    pluginId: string;
    instanceId: string;
    sessionId: string | null;
    deliveryId: string | null;
    attempts: number;
    lastError: string;
    payload: string | Record<string, unknown> | null;
    redriven: boolean | number;
    createdAt: string;
}
export interface StatusUpdateRow {
    id: string;
    sessionId: string;
    contactJid: string;
    contactName: string | null;
    contactPushName: string | null;
    waStatusId: string;
    type: string;
    caption: string | null;
    mediaPath: string | null;
    mediaMimetype: string | null;
    mediaOmitted: boolean | number;
    omitReason: string | null;
    backgroundColor: string | null;
    font: number | null;
    postedAt: number | string;
    expiresAt: number | string;
}
export interface AutomationRuleRow {
    id: string;
    sessionId: string;
    name: string;
    enabled: boolean | number;
    conditions: string | null;
    replyText: string;
    cooldownSeconds: number;
    createdAt: string | Date;
    updatedAt: string | Date;
}
export interface MigrationTables {
    sessions: SessionRow[];
    webhooks: WebhookRow[];
    messages: MessageRow[];
    messageBatches: MessageBatchRow[];
    templates: TemplateRow[];
    baileysStoredMessages: BaileysStoredMessageRow[];
    lidMappings: LidMappingRow[];
    chatStates: ChatStateRow[];
    pluginInstances: PluginInstanceRow[];
    conversationMappings: ConversationMappingRow[];
    ingressEvents: IngressEventRow[];
    webhookDeliveryFailures: WebhookDeliveryFailureRow[];
    webhookOutboxEvents: WebhookOutboxEventRow[];
    integrationDeliveryFailures: IntegrationDeliveryFailureRow[];
    statusUpdates: StatusUpdateRow[];
    automationRules: AutomationRuleRow[];
}
export type TableCounts = {
    [K in keyof MigrationTables]: number;
};
