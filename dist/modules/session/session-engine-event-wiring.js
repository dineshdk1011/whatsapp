"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionEngineEventWiring = exports.RECONNECT_LOOP_REASON = void 0;
const session_entity_1 = require("./entities/session.entity");
const reconnect_policy_1 = require("./reconnect-policy");
const session_reconnect_metrics_1 = require("../../common/metrics/session-reconnect-metrics");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const whatsapp_engine_interface_1 = require("../../engine/interfaces/whatsapp-engine.interface");
const wa_id_1 = require("../../engine/identity/wa-id");
exports.RECONNECT_LOOP_REASON = 'Reconnecting after a dropped connection';
class SessionEngineEventWiring {
    logger;
    constructor(deps) {
        this.logger = deps.logger;
    }
    buildCallbacks(id, engine, sessionName, host, previousPhone = null) {
        const previouslyLinked = Boolean(previousPhone);
        let relinkWarned = false;
        let reconnectingSince = 0;
        const persistStatus = (status) => {
            if (!host.ownsSession(id)) {
                this.logger.warn('Skipped an engine status write for a session this node no longer owns', {
                    sessionId: id,
                    status,
                    action: 'status_write_skipped_not_owned',
                });
                return;
            }
            void host.updateStatus(id, status).catch(err => this.logger.warn('Failed to persist an engine status', {
                sessionId: id,
                status,
                error: err instanceof Error ? err.message : String(err),
            }));
        };
        return {
            onQRCode: (qr) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.log('QR code generated', {
                    sessionId: id,
                    action: 'qr_generated',
                });
                if (previouslyLinked && !relinkWarned) {
                    relinkWarned = true;
                    this.logger.warn('Previously linked session is asking for a QR again: its stored credentials are missing or no ' +
                        'longer accepted. Unless an earlier warning for this session (LOGOUT, auth_cleared) or a changed ' +
                        'ENGINE_TYPE explains it, WhatsApp dropped the link while the engine was down (unlinked from the ' +
                        "phone, expired while offline, or the engine's stored auth state was lost). Check Linked devices " +
                        'on the phone before re-pairing.', { sessionId: id, action: 'relink_required' });
                }
                if (host.sessionErrors.get(id)?.startsWith(exports.RECONNECT_LOOP_REASON))
                    host.sessionErrors.clear(id);
                void host.webhookService.dispatch(id, 'session.qr', { sessionId: id, qr });
                host.eventsGateway.emitQRCode(id, qr);
                void host.hookManager.execute('session:qr', { sessionId: id }, {
                    sessionId: id,
                    source: 'Engine',
                });
                persistStatus(session_entity_1.SessionStatus.QR_READY);
            },
            onReady: (phone, pushName) => {
                reconnectingSince = 0;
                if (previousPhone && phone && (0, wa_id_1.userPart)(phone) !== (0, wa_id_1.userPart)(previousPhone)) {
                    void host.rejectRebind(id, engine, sessionName, previousPhone, phone);
                    return;
                }
                host.handleEngineReady(id, engine, phone, pushName);
            },
            onPushNameChanged: (pushName) => host.handleEnginePushName(id, engine, pushName),
            ...(host.messages.holdsInbound
                ? { admitInbound: arrival => host.messages.admitInbound(id, engine, arrival) }
                : {}),
            onMessage: (message, ticket) => host.messages.handleInboundMessage(id, engine, message, ticket),
            onHistoryMessages: messages => {
                if (!host.isLiveEngine(id, engine))
                    return;
                return host.messages
                    .persistHistoryMessages(id, engine, messages)
                    .catch(err => this.logger.error(`Failed to persist history messages for ${id}`, String(err)));
            },
            onMessageCreate: (message, ticket) => host.messages.handleOwnSendEcho(id, engine, message, ticket),
            onMessageAck: (messageId, status, chatId) => host.messages.handleMessageAck(id, engine, messageId, status, chatId),
            onMessageReceipt: (event) => host.messages.handleMessageReceipt(id, engine, event),
            onMessageRevoked: (message, actor) => host.messages.handleMessageRevoked(id, engine, message, actor),
            onMessageReaction: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (!event.messageId) {
                    this.logger.warn('Ignoring message reaction without a target message id', {
                        sessionId: id,
                        action: 'message_reaction_ignored',
                    });
                    return;
                }
                this.logger.debug(`Message reaction received: ${event.messageId} -> ${event.reaction}`, {
                    sessionId: id,
                    messageId: event.messageId,
                    action: 'message_reaction_received',
                });
                host.messages.applyReactionQueued(id, event);
            },
            onMessageEdited: (message) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (!message.messageId) {
                    this.logger.warn('Ignoring message edit without a target message id', {
                        sessionId: id,
                        action: 'message_edit_ignored',
                    });
                    return;
                }
                this.logger.debug(`Message edited: ${message.messageId}`, {
                    sessionId: id,
                    messageId: message.messageId,
                    action: 'message_edited',
                });
                host.messages.applyMessageEditQueued(id, message);
            },
            onEventResponse: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.debug(`Event response: ${event.response} to ${event.eventMessageId}`, {
                    sessionId: id,
                    chatId: event.chatId,
                    eventMessageId: event.eventMessageId,
                    action: 'event_response',
                });
                const payload = { sessionId: id, ...event };
                host.eventsGateway.emitEventResponse(id, payload);
                void host.webhookService.dispatch(id, 'event.response', payload);
            },
            onPollVote: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (!event.pollMessageId) {
                    this.logger.warn('Ignoring poll vote without a poll message id', {
                        sessionId: id,
                        action: 'poll_vote_ignored',
                    });
                    return;
                }
                this.logger.debug(`Poll vote: ${event.selectedOptions.length} option(s) on ${event.pollMessageId}`, {
                    sessionId: id,
                    chatId: event.chatId,
                    pollMessageId: event.pollMessageId,
                    action: 'poll_vote',
                });
                const payload = { sessionId: id, ...event };
                host.eventsGateway.emitPollVote(id, payload);
                void host.webhookService.dispatch(id, 'poll.vote', payload);
            },
            onGroupEvent: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.debug(`Group event: ${event.kind} in ${event.groupId}`, {
                    sessionId: id,
                    groupId: event.groupId,
                    kind: event.kind,
                    action: 'group_event',
                });
                host.leafEvents.dispatchGroupEvent(id, event);
            },
            onCall: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.log('Incoming call', {
                    sessionId: id,
                    callId: event.callId,
                    isVideo: event.isVideo,
                    isGroup: event.isGroup,
                    action: 'call_received',
                });
                const payload = { ...event };
                host.eventsGateway.emitCallReceived(id, payload);
                void host.webhookService.dispatch(id, 'call.received', payload);
                void host.leafEvents.maybeAutoRejectCall(id, engine, event.callId);
            },
            onReconnecting: (attempt, nextDelayMs) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                (0, session_reconnect_metrics_1.incrementSessionReconnectAttempts)();
                if (attempt === 1 || reconnectingSince === 0)
                    reconnectingSince = Date.now();
                if (attempt < reconnect_policy_1.RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS)
                    return;
                const downForSeconds = Math.round((Date.now() - reconnectingSince) / 1000);
                const downFor = downForSeconds >= 120 ? `${Math.round(downForSeconds / 60)}m` : `${downForSeconds}s`;
                host.sessionErrors.set(id, `${exports.RECONNECT_LOOP_REASON} (attempt ${attempt}, down for ${downFor}).`);
                if (attempt % reconnect_policy_1.RECONNECT_LOOP_ALERT_INTERVAL_ATTEMPTS !== 0)
                    return;
                this.logger.warn(`Session is reconnect-looping: attempt ${attempt} scheduled`, {
                    sessionId: id,
                    attempts: attempt,
                    nextDelayMs,
                    downForSeconds,
                    action: 'reconnect_loop',
                });
                (0, session_reconnect_metrics_1.incrementSessionReconnectLoopAlerts)();
                void host.webhookService.dispatch(id, 'session.reconnect_loop', {
                    sessionId: id,
                    attempts: attempt,
                    nextDelayMs,
                });
            },
            onDisconnected: (reason) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                void host.handleEngineDisconnected(id, engine, reason);
            },
            onStateChanged: (engineState) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (engineState !== whatsapp_engine_interface_1.EngineStatus.READY)
                    host.endReadyStretch(id);
                const statusMap = {
                    [whatsapp_engine_interface_1.EngineStatus.DISCONNECTED]: session_entity_1.SessionStatus.DISCONNECTED,
                    [whatsapp_engine_interface_1.EngineStatus.INITIALIZING]: session_entity_1.SessionStatus.INITIALIZING,
                    [whatsapp_engine_interface_1.EngineStatus.QR_READY]: session_entity_1.SessionStatus.QR_READY,
                    [whatsapp_engine_interface_1.EngineStatus.AUTHENTICATING]: session_entity_1.SessionStatus.AUTHENTICATING,
                    [whatsapp_engine_interface_1.EngineStatus.READY]: session_entity_1.SessionStatus.READY,
                    [whatsapp_engine_interface_1.EngineStatus.ACTION_REQUIRED]: session_entity_1.SessionStatus.ACTION_REQUIRED,
                    [whatsapp_engine_interface_1.EngineStatus.FAILED]: session_entity_1.SessionStatus.FAILED,
                };
                const newStatus = statusMap[engineState];
                if (!newStatus)
                    return;
                if (newStatus === session_entity_1.SessionStatus.DISCONNECTED && host.isOperatorTeardown(id, engine))
                    return;
                const persist = () => persistStatus(newStatus);
                if (newStatus === session_entity_1.SessionStatus.FAILED && host.parkReconnectInitFailure(id, persist))
                    return;
                persist();
            },
            onActionRequired: (reason) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.warn(`Session requires operator action: ${reason}`, {
                    sessionId: id,
                    reason,
                    action: 'action_required',
                });
                host.sessionErrors.set(id, reason);
                void host.hookManager.execute('session:error', { reason }, { sessionId: id, source: 'Engine' });
            },
            onCallOutcome: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.log(`Call ${event.outcome}: ${event.callId}`, {
                    sessionId: id,
                    callId: event.callId,
                    outcome: event.outcome,
                    action: 'call_outcome',
                });
                const payload = { sessionId: id, ...event };
                if (event.outcome === 'accepted') {
                    host.eventsGateway.emitCallAccepted(id, payload);
                    void host.webhookService.dispatch(id, 'call.accepted', payload);
                }
                else if (event.outcome === 'rejected') {
                    host.eventsGateway.emitCallRejected(id, payload);
                    void host.webhookService.dispatch(id, 'call.rejected', payload);
                }
                else {
                    host.eventsGateway.emitCallMissed(id, payload);
                    void host.webhookService.dispatch(id, 'call.missed', payload);
                }
            },
            onPresenceUpdate: (event) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (!host.presence.record(id, event))
                    return;
                const payload = { sessionId: id, ...event };
                host.eventsGateway.emitPresenceUpdate(id, payload);
                void host.webhookService.dispatch(id, 'presence.update', payload);
            },
            onAccountRestriction: (restriction) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                if (!restriction) {
                    const lifted = host.sessionRestrictions.clear(id);
                    if (lifted)
                        host.reportRestrictionLifted(id, lifted);
                    return;
                }
                if (!host.sessionRestrictions.set(id, restriction))
                    return;
                this.logger.warn(`WhatsApp restricted this session's account: ${restriction.kind}`, {
                    sessionId: id,
                    kind: restriction.kind,
                    code: restriction.code,
                    expiresAt: restriction.expiresAt,
                    action: 'account_restricted',
                });
                const payload = {
                    active: true,
                    kind: restriction.kind,
                    code: restriction.code,
                    expiresAt: restriction.expiresAt ? new Date(restriction.expiresAt).toISOString() : null,
                };
                void host.webhookService.dispatch(id, 'session.restriction', { sessionId: id, ...payload });
                host.eventsGateway.emitSessionRestriction(id, payload);
                void host.auditService?.logWarn(audit_log_entity_1.AuditAction.SESSION_RESTRICTED, {
                    sessionId: id,
                    metadata: {
                        kind: restriction.kind,
                        code: restriction.code,
                        expiresAt: restriction.expiresAt ? new Date(restriction.expiresAt).toISOString() : null,
                    },
                    errorMessage: `WhatsApp restricted this account: ${restriction.kind} (${restriction.code})`,
                });
            },
            onError: (reason) => {
                if (!host.isLiveEngine(id, engine))
                    return;
                this.logger.error(`Session engine failed: ${reason}`, undefined, {
                    sessionId: id,
                    reason,
                    action: 'engine_error',
                });
                host.sessionErrors.set(id, reason);
                const fail = () => {
                    host.cancelReconnect(id);
                    void host.hookManager.execute('session:error', { reason }, {
                        sessionId: id,
                        source: 'Engine',
                    });
                    persistStatus(session_entity_1.SessionStatus.FAILED);
                    host.evictAndForceDestroy(id, engine);
                };
                if (!host.parkReconnectInitFailure(id, fail, reason))
                    fail();
            },
            onCredentialTeardownStarted: (operation) => {
                host.trackPendingCredentialTeardown(sessionName, operation);
            },
            claimStuckAuthRecovery: () => host.claimStuckAuthRecovery(id, engine),
        };
    }
}
exports.SessionEngineEventWiring = SessionEngineEventWiring;
//# sourceMappingURL=session-engine-event-wiring.js.map