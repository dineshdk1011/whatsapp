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
exports.DEFAULT_STORAGE_ROOT = void 0;
exports.isStorageRootWritable = isStorageRootWritable;
exports.resolveStorageRoot = resolveStorageRoot;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.DEFAULT_STORAGE_ROOT = './data/media';
const FOSSIL_STORAGE_ROOTS = new Set(['./uploads', 'uploads']);
function isStorageRootWritable(root) {
    try {
        fs.mkdirSync(root, { recursive: true });
        fs.accessSync(root, fs.constants.W_OK);
        return true;
    }
    catch {
        return false;
    }
}
function resolveStorageRoot(options) {
    const isWritable = options.isWritable ?? isStorageRootWritable;
    const configured = options.configured?.trim() || exports.DEFAULT_STORAGE_ROOT;
    if (isWritable(configured))
        return configured;
    if (FOSSIL_STORAGE_ROOTS.has(configured) && isWritable(exports.DEFAULT_STORAGE_ROOT)) {
        options.logger?.warn(`STORAGE_LOCAL_PATH='${configured}' is not writable and is a known-bad value written by a bug in ` +
            `OpenWA v0.2.0–v0.7.3 (#472); falling back to '${exports.DEFAULT_STORAGE_ROOT}'. Remove the STORAGE_LOCAL_PATH ` +
            `line from data/.env.generated to silence this warning. Any media previously written to ` +
            `'${configured}' was outside the data volume and is not recoverable.`);
        return exports.DEFAULT_STORAGE_ROOT;
    }
    throw new Error(`Refusing to start: the media storage root is not writable.\n` +
        `  STORAGE_LOCAL_PATH = ${configured}\n` +
        `  resolved to        = ${path.resolve(configured)}\n` +
        `  running as uid     = ${typeof process.getuid === 'function' ? process.getuid() : 'n/a'}\n` +
        `Point STORAGE_LOCAL_PATH at a directory the app can write to (in Docker, keep it inside the ` +
        `mounted data volume — e.g. ${exports.DEFAULT_STORAGE_ROOT}).`);
}
//# sourceMappingURL=storage-root.js.map