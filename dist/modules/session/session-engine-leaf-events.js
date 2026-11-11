"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionEngineLeafEvents = void 0;
const status_store_service_1 = require("../status-store/status-store.service");
const incoming_status_1 = require("../status-store/incoming-status");
const STATUS_SEED_LIMIT = 50;
class SessionEngineLeafEvents {
    sessionRepository;
    eventsGateway;
    webhookService;
    configService;
    statusStore;
    logger;
    constructor(deps) {
        this.sessionRepository = deps.sessionRepository;
        this.eventsGateway = deps.eventsGateway;
        this.webhookService = deps.webhookService;
        this.configService = deps.configService;
        this.statusStore = deps.statusStore;
        this.logger = deps.logger;
    }
    async seedStatuses(sessionId, engine) {
        const lifetime = this.statusStore.captureWrites(sessionId);
        try {
            const mediaMaxBytes = this.configService?.get('status.mediaMaxBytes', status_store_service_1.DEFAULT_MEDIA_MAX_BYTES) ?? status_store_service_1.DEFAULT_MEDIA_MAX_BYTES;
            const messages = await engine.getChatHistory('status@broadcast', STATUS_SEED_LIMIT, true, mediaMaxBytes);
            const contactNames = new Map();
            const resolvePoster = async (jid) => {
                const cached = contactNames.get(jid);
                if (cached)
                    return cached;
                let resolved = {};
                try {
                    const contact = await engine.getContactById(jid);
                    if (contact)
                        resolved = { name: contact.name, pushName: contact.pushName };
                }
                catch {
                }
                contactNames.set(jid, resolved);
                return resolved;
            };
            for (const msg of messages) {
                lifetime.assertCurrent();
                try {
                    if (msg.fromMe)
                        continue;
                    if (msg.timestamp * 1000 + status_store_service_1.STATUS_TTL_MS <= Date.now())
                        continue;
                    const status = (0, incoming_status_1.buildIncomingStatus)(msg);
                    if (!status)
                        continue;
                    if (!status.contactName && !status.contactPushName) {
                        const poster = await resolvePoster(status.contactJid);
                        status.contactName = poster.name;
                        status.contactPushName = poster.pushName;
                    }
                    await this.statusStore.ingest(sessionId, status, lifetime);
                }
                catch (itemErr) {
                    this.logger.warn('Status seed item skipped', {
                        sessionId,
                        error: itemErr instanceof Error ? itemErr.message : String(itemErr),
                    });
                }
            }
        }
        catch (err) {
            this.logger.debug('Status seed skipped', {
                sessionId,
                error: err instanceof Error ? err.message : String(err),
            });
        }
        finally {
            lifetime.close();
        }
    }
    dispatchGroupEvent(id, event) {
        const payload = {
            groupId: event.groupId,
            participantIds: event.participantIds,
            timestamp: event.timestamp,
        };
        if (event.actorId !== undefined) {
            payload.actorId = event.actorId;
        }
        if (event.changes !== undefined) {
            payload.changes = event.changes;
        }
        switch (event.kind) {
            case 'join':
                this.eventsGateway.emitGroupJoin(id, payload);
                void this.webhookService.dispatch(id, 'group.join', payload);
                break;
            case 'leave':
                this.eventsGateway.emitGroupLeave(id, payload);
                void this.webhookService.dispatch(id, 'group.leave', payload);
                break;
            case 'update':
                this.eventsGateway.emitGroupUpdate(id, payload);
                void this.webhookService.dispatch(id, 'group.update', payload);
                break;
            case 'join_request':
                this.eventsGateway.emitGroupJoinRequest(id, payload);
                void this.webhookService.dispatch(id, 'group.join_request', payload);
                break;
        }
    }
    async maybeAutoRejectCall(id, engine, callId) {
        let session;
        try {
            session = await this.sessionRepository.findOne({ where: { id } });
        }
        catch (err) {
            this.logger.error('Failed to reload the session for call auto-reject', String(err), {
                sessionId: id,
                action: 'call_auto_reject_error',
            });
            return;
        }
        if (session?.config?.autoRejectCalls !== true) {
            return;
        }
        try {
            await engine.rejectCall(callId);
            this.logger.log('Auto-rejected incoming call', {
                sessionId: id,
                callId,
                action: 'call_auto_rejected',
            });
        }
        catch (err) {
            this.logger.warn('Failed to auto-reject incoming call', {
                sessionId: id,
                callId,
                error: err instanceof Error ? err.message : String(err),
                action: 'call_auto_reject_failed',
            });
        }
    }
}
exports.SessionEngineLeafEvents = SessionEngineLeafEvents;
//# sourceMappingURL=session-engine-leaf-events.js.map