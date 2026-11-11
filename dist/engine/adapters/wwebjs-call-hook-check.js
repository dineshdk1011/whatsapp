"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportMissingCallHook = reportMissingCallHook;
function readCallHookState() {
    const w = window;
    if (typeof w.require !== 'function')
        return null;
    let collection;
    try {
        collection = w.require('WAWebCallCollection');
    }
    catch {
        return null;
    }
    if (!collection)
        return null;
    const owned = collection;
    const mapKey = Object.keys(owned).find(key => owned[key] instanceof Map);
    if (!mapKey)
        return null;
    const setter = owned[mapKey].set;
    return !String(setter).includes('[native code]');
}
async function reportMissingCallHook(page, logger, sessionId) {
    if (!page)
        return;
    let installed;
    try {
        installed = await page.evaluate(readCallHookState);
    }
    catch {
        return;
    }
    if (installed !== false)
        return;
    logger.warn('Incoming calls cannot be detected on this session: the page-side call hook is not installed. ' +
        'Messages are unaffected. This is a mismatch between whatsapp-web.js and the WhatsApp Web ' +
        'build it loaded, so a restart only helps if the page was in a transient state; if it repeats, ' +
        'the library needs an update. Switch the session to the Baileys engine to keep call events.', { sessionId, action: 'call_hook_missing' });
}
//# sourceMappingURL=wwebjs-call-hook-check.js.map