"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKPORT_MISSING_MESSAGE = void 0;
exports.partialBackportMessage = partialBackportMessage;
exports.isBackportMissing = isBackportMissing;
exports.partialBackportSites = partialBackportSites;
exports.backportProblem = backportProblem;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NORMALIZED_ID_MARKER = /_normalizeId\(|\.\$1/;
exports.BACKPORT_MISSING_MESSAGE = 'The installed whatsapp-web.js is missing the message-id backport this build requires. On current ' +
    'WhatsApp Web builds every send will fail with "the engine returned no message" — even when the ' +
    'message is delivered — and chat and media reads will fail with "r: r". The install skipped the ' +
    'patch, usually because neither the `patch` binary nor git was available. Apply it with ' +
    '`node scripts/patch-wwebjs-201832.js` (or reinstall with `npm install`) and restart. ' +
    'See docs/12-troubleshooting-faq.md.';
function partialBackportMessage(sites) {
    return ('The installed whatsapp-web.js carries only part of the message-id backport this build requires: ' +
        `${sites.join(', ')} did not land, usually because an install was interrupted while the patch was ` +
        'being written. On current WhatsApp Web builds inbound messages and chat reads will fail with empty ids ' +
        'or "r: r". The patcher cannot repair that tree: reinstall the dependency ' +
        '(`rm -rf node_modules/whatsapp-web.js && npm ci`) and restart. See docs/12-troubleshooting-faq.md.');
}
function isBackportMissing(wwjsDir) {
    try {
        const dir = wwjsDir ?? path.dirname(require.resolve('whatsapp-web.js/package.json'));
        return !NORMALIZED_ID_MARKER.test(fs.readFileSync(path.join(dir, 'src', 'structures', 'Message.js'), 'utf8'));
    }
    catch {
        return false;
    }
}
function partialBackportSites(wwjsDir) {
    try {
        const dir = wwjsDir ?? path.dirname(require.resolve('whatsapp-web.js/package.json'));
        const patcher = require(path.join(__dirname, '..', '..', '..', 'scripts', 'patch-wwebjs-201832.js'));
        return patcher.missingSites?.(dir) ?? [];
    }
    catch {
        return [];
    }
}
function backportProblem(wwjsDir) {
    const sites = partialBackportSites(wwjsDir);
    if (sites.length)
        return partialBackportMessage(sites);
    return isBackportMissing(wwjsDir) ? exports.BACKPORT_MISSING_MESSAGE : undefined;
}
//# sourceMappingURL=wwebjs-backport-check.js.map