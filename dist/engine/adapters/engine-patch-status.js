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
exports.unappliedPatches = unappliedPatches;
exports.unappliedPatchesMessage = unappliedPatchesMessage;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PACKAGE_FOR = {
    wwebjs: 'whatsapp-web.js',
    baileys: '@whiskeysockets/baileys',
};
function defaultScriptsDir() {
    return path.join(__dirname, '..', '..', '..', 'scripts');
}
function unappliedPatches(family, scriptsDir, depDir) {
    const dir = scriptsDir ?? defaultScriptsDir();
    let resolvedDep;
    try {
        resolvedDep = depDir ?? path.dirname(require.resolve(`${PACKAGE_FOR[family]}/package.json`));
    }
    catch {
        return [];
    }
    let entries;
    try {
        entries = fs.readdirSync(dir);
    }
    catch {
        return [];
    }
    const prefix = `patch-${family}-`;
    const missing = [];
    for (const entry of entries.sort()) {
        if (!entry.startsWith(prefix) || !entry.endsWith('.js') || entry.endsWith('.spec.js'))
            continue;
        let patcher;
        try {
            patcher = require(path.join(dir, entry));
        }
        catch {
            continue;
        }
        if (typeof patcher.isApplied !== 'function')
            continue;
        if (patcher.isApplied(resolvedDep) === false)
            missing.push(entry.replace(/\.js$/, ''));
    }
    return missing;
}
function unappliedPatchesMessage(family, names) {
    return (`The installed ${PACKAGE_FOR[family]} is missing ${names.length} of OpenWA's install-time ` +
        `patches: ${names.join(', ')}. The capabilities each one repairs will fail with errors that ` +
        'name no cause. The install skipped them, usually because it ran with --ignore-scripts or ' +
        'because a patcher refused a source shape it did not recognise. Apply them with ' +
        `\`node scripts/${names[0]}.js\` (or reinstall with \`npm install\`) and restart. ` +
        'See docs/12-troubleshooting-faq.md.');
}
//# sourceMappingURL=engine-patch-status.js.map