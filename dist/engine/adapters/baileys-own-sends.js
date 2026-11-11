"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnSendRegistry = void 0;
class OwnSendRegistry {
    cap;
    ids = new Set();
    constructor(cap = 1000) {
        this.cap = cap;
    }
    get size() {
        return this.ids.size;
    }
    remember(id) {
        if (!id)
            return;
        this.ids.delete(id);
        this.ids.add(id);
        while (this.ids.size > this.cap) {
            const oldest = this.ids.values().next().value;
            if (oldest === undefined)
                break;
            this.ids.delete(oldest);
        }
    }
    consume(id) {
        if (!id)
            return false;
        return this.ids.delete(id);
    }
}
exports.OwnSendRegistry = OwnSendRegistry;
//# sourceMappingURL=baileys-own-sends.js.map