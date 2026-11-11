"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureSessionWrites = captureSessionWrites;
exports.closeSessionWrites = closeSessionWrites;
const common_1 = require("@nestjs/common");
const sources = new WeakMap();
function stateFor(source, sessionId) {
    let sessions = sources.get(source);
    if (!sessions)
        sources.set(source, (sessions = new Map()));
    let state = sessions.get(sessionId);
    if (!state) {
        state = { captures: 0, closing: 0, generation: { retired: false, listeners: new Set() }, writes: new Set() };
        sessions.set(sessionId, state);
    }
    return [sessions, state];
}
function releaseIdle(sessions, sessionId, state) {
    if (!state.captures && !state.closing && !state.writes.size && sessions.get(sessionId) === state) {
        sessions.delete(sessionId);
    }
}
function captureSessionWrites(source, sessionId) {
    const [sessions, state] = stateFor(source, sessionId);
    const generation = state.generation;
    state.captures++;
    let closed = false;
    const subscriptions = new Set();
    const assertCurrent = () => {
        if (closed || generation.retired || state.closing || sessions.get(sessionId) !== state) {
            throw new common_1.NotFoundException(`Session '${sessionId}' is no longer available`);
        }
    };
    return {
        assertCurrent,
        onRetire(listener) {
            if (closed || generation.retired || state.closing || sessions.get(sessionId) !== state) {
                listener();
                return () => undefined;
            }
            const dispose = () => {
                generation.listeners.delete(notify);
                subscriptions.delete(dispose);
            };
            const notify = () => {
                dispose();
                listener();
            };
            generation.listeners.add(notify);
            subscriptions.add(dispose);
            return dispose;
        },
        async write(operation) {
            assertCurrent();
            const pending = Promise.resolve().then(operation);
            state.writes.add(pending);
            try {
                return await pending;
            }
            finally {
                state.writes.delete(pending);
                releaseIdle(sessions, sessionId, state);
            }
        },
        close() {
            if (closed)
                return;
            closed = true;
            for (const dispose of subscriptions)
                dispose();
            state.captures--;
            releaseIdle(sessions, sessionId, state);
        },
    };
}
function closeSessionWrites(source, sessionId) {
    const [sessions, state] = stateFor(source, sessionId);
    state.closing++;
    state.generation.retired = true;
    for (const notify of state.generation.listeners) {
        try {
            notify();
        }
        catch {
        }
    }
    state.generation.listeners.clear();
    let released = false;
    return {
        async drain() {
            await Promise.allSettled([...state.writes]);
        },
        release() {
            if (released)
                return;
            released = true;
            state.closing--;
            if (!state.closing)
                state.generation = { retired: false, listeners: new Set() };
            releaseIdle(sessions, sessionId, state);
        },
    };
}
//# sourceMappingURL=session-write-scope.js.map