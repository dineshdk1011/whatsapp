"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStatusBroadcaster = void 0;
class SessionStatusBroadcaster {
    lastDispatchedStatus = new Map();
    sessionRepository;
    eventsGateway;
    webhookService;
    logger;
    constructor(deps) {
        this.sessionRepository = deps.sessionRepository;
        this.eventsGateway = deps.eventsGateway;
        this.webhookService = deps.webhookService;
        this.logger = deps.logger;
    }
    async updateStatus(id, status, canAnnounce) {
        await this.sessionRepository.update(id, { status });
        this.logger.debug(`Session status updated to ${status}`, {
            sessionId: id,
            status,
            action: 'status_update',
        });
        if (canAnnounce?.() === false)
            return;
        this.announce(id, status);
    }
    announce(id, status) {
        if (this.lastDispatchedStatus.get(id) !== status) {
            this.lastDispatchedStatus.set(id, status);
            this.eventsGateway.emitSessionStatus(id, status);
            void this.webhookService.dispatch(id, 'session.status', { sessionId: id, status });
        }
    }
    clear(id) {
        this.lastDispatchedStatus.delete(id);
    }
}
exports.SessionStatusBroadcaster = SessionStatusBroadcaster;
//# sourceMappingURL=session-status-broadcaster.js.map