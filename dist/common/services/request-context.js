"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithRequestId = runWithRequestId;
exports.outsideRequest = outsideRequest;
exports.getRequestId = getRequestId;
exports.setRequestActor = setRequestActor;
exports.getRequestActor = getRequestActor;
const node_async_hooks_1 = require("node:async_hooks");
const requestContextStorage = new node_async_hooks_1.AsyncLocalStorage();
function runWithRequestId(requestId, fn) {
    return requestContextStorage.run({ requestId }, fn);
}
function outsideRequest(fn) {
    return requestContextStorage.exit(fn);
}
function getRequestId() {
    return requestContextStorage.getStore()?.requestId;
}
function setRequestActor(actor) {
    const store = requestContextStorage.getStore();
    if (!store)
        return;
    if (actor.apiKeyId !== undefined)
        store.apiKeyId = actor.apiKeyId;
    if (actor.apiKeyName !== undefined)
        store.apiKeyName = actor.apiKeyName;
    if (actor.ipAddress !== undefined)
        store.ipAddress = actor.ipAddress;
}
function getRequestActor() {
    const store = requestContextStorage.getStore();
    if (!store)
        return undefined;
    return { apiKeyId: store.apiKeyId, apiKeyName: store.apiKeyName, ipAddress: store.ipAddress };
}
//# sourceMappingURL=request-context.js.map