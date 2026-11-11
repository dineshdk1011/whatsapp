"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionErrorStore = void 0;
const common_1 = require("@nestjs/common");
const session_entity_1 = require("./entities/session.entity");
let SessionErrorStore = class SessionErrorStore {
    errors = new Map();
    set(sessionId, reason) {
        this.errors.set(sessionId, reason);
    }
    get(sessionId) {
        return this.errors.get(sessionId);
    }
    clear(sessionId) {
        this.errors.delete(sessionId);
    }
    attachTo(session) {
        session.lastError =
            session.status === session_entity_1.SessionStatus.FAILED ||
                session.status === session_entity_1.SessionStatus.ACTION_REQUIRED ||
                session.status === session_entity_1.SessionStatus.INITIALIZING
                ? this.errors.get(session.id)
                : undefined;
        return session;
    }
};
exports.SessionErrorStore = SessionErrorStore;
exports.SessionErrorStore = SessionErrorStore = __decorate([
    (0, common_1.Injectable)()
], SessionErrorStore);
//# sourceMappingURL=session-error-store.service.js.map