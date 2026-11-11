"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceStore = void 0;
const common_1 = require("@nestjs/common");
const MAX_CHATS_PER_SESSION = 500;
let PresenceStore = class PresenceStore {
    bySession = new Map();
    ownIntent = new Map();
    setOwnIntent(sessionId, available) {
        this.ownIntent.set(sessionId, available);
    }
    getOwnIntent(sessionId) {
        return this.ownIntent.get(sessionId);
    }
    record(sessionId, event, at = Date.now()) {
        const chats = this.bySession.get(sessionId) ?? new Map();
        this.bySession.set(sessionId, chats);
        const previous = chats.get(event.chatId);
        const next = {
            chatId: event.chatId,
            participants: event.participants,
            ...(event.groupOnlineCount === undefined ? {} : { groupOnlineCount: event.groupOnlineCount }),
            observedAt: at,
        };
        chats.delete(event.chatId);
        chats.set(event.chatId, next);
        while (chats.size > MAX_CHATS_PER_SESSION) {
            const oldest = chats.keys().next().value;
            if (oldest === undefined)
                break;
            chats.delete(oldest);
        }
        return !samePresence(previous?.participants, event.participants);
    }
    get(sessionId, chatId) {
        return this.bySession.get(sessionId)?.get(chatId) ?? null;
    }
    clear(sessionId) {
        this.bySession.delete(sessionId);
        this.ownIntent.delete(sessionId);
    }
};
exports.PresenceStore = PresenceStore;
exports.PresenceStore = PresenceStore = __decorate([
    (0, common_1.Injectable)()
], PresenceStore);
function samePresence(before, after) {
    if (!before || before.length !== after.length)
        return false;
    const previous = new Map(before.map(participant => [participant.id, participant.state]));
    return after.every(participant => previous.get(participant.id) === participant.state);
}
//# sourceMappingURL=presence-store.service.js.map