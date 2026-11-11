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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PACKAGE_LIMITS = exports.INSTALLABLE_TYPES = exports.RESERVED_PLUGIN_IDS = void 0;
exports.parsePluginPackage = parsePluginPackage;
const adm_zip_1 = __importDefault(require("adm-zip"));
const path = __importStar(require("path"));
const zlib = __importStar(require("zlib"));
const common_1 = require("@nestjs/common");
const plugins_1 = require("../../core/plugins");
Object.defineProperty(exports, "RESERVED_PLUGIN_IDS", { enumerable: true, get: function () { return plugins_1.RESERVED_PLUGIN_IDS; } });
Object.defineProperty(exports, "INSTALLABLE_TYPES", { enumerable: true, get: function () { return plugins_1.INSTALLABLE_TYPES; } });
exports.DEFAULT_PACKAGE_LIMITS = { maxEntries: 200, maxTotalBytes: 20 * 1024 * 1024 };
function readEntryData(entry, maxBytes) {
    if (entry.header.size === 0 && entry.header.compressedSize > 0) {
        const compressed = entry.getCompressedData();
        if (compressed.length === 0)
            return Buffer.alloc(0);
        return zlib.inflateRawSync(compressed, { maxOutputLength: maxBytes });
    }
    const data = entry.getData();
    if (data.length > entry.header.size)
        throw new Error('Entry is larger than its declared size');
    return data;
}
function parsePluginPackage(buffer, limits = exports.DEFAULT_PACKAGE_LIMITS) {
    let files;
    try {
        files = new adm_zip_1.default(buffer).getEntries().filter(e => !e.isDirectory);
    }
    catch {
        throw new common_1.BadRequestException('Uploaded file is not a valid .zip archive');
    }
    if (files.length === 0)
        throw new common_1.BadRequestException('The archive is empty');
    if (files.length > limits.maxEntries)
        throw new common_1.BadRequestException('The archive has too many files');
    const absolute = files.find(e => e.entryName.startsWith('/'));
    if (absolute)
        throw new common_1.BadRequestException(`Unsafe path in archive: ${absolute.entryName}`);
    const manifestEntry = files
        .filter(e => path.posix.basename(e.entryName) === 'manifest.json')
        .sort((a, b) => a.entryName.split('/').length - b.entryName.split('/').length)[0];
    if (!manifestEntry)
        throw new common_1.BadRequestException('The archive has no manifest.json');
    const dir = path.posix.dirname(manifestEntry.entryName);
    const prefix = dir === '.' ? '' : dir + '/';
    const packaged = files.filter(e => !prefix || e.entryName.startsWith(prefix));
    const declared = packaged.reduce((sum, e) => sum + e.header.size, 0);
    if (declared > limits.maxTotalBytes)
        throw new common_1.BadRequestException('The archive contents exceed the size limit');
    let manifestRaw;
    try {
        manifestRaw = readEntryData(manifestEntry, limits.maxTotalBytes);
    }
    catch {
        throw new common_1.BadRequestException('Plugin package is corrupt or too large to extract');
    }
    let parsed;
    try {
        parsed = JSON.parse(manifestRaw.toString('utf-8'));
    }
    catch {
        throw new common_1.BadRequestException('manifest.json is not valid JSON');
    }
    try {
        (0, plugins_1.validatePluginManifest)(parsed);
    }
    catch (error) {
        throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
    }
    const manifest = parsed;
    const entries = [];
    const seen = new Set();
    let actualBytes = 0;
    for (const e of packaged) {
        const relPath = e.entryName.slice(prefix.length);
        if (!relPath)
            continue;
        const norm = path.posix.normalize(relPath);
        if (relPath.includes('\\') || norm.startsWith('..') || norm === '..' || path.posix.isAbsolute(norm)) {
            throw new common_1.BadRequestException(`Unsafe path in archive: ${e.entryName}`);
        }
        const key = norm.normalize('NFC').toUpperCase().toLowerCase();
        if (seen.has(key))
            throw new common_1.BadRequestException(`Duplicate path in archive: ${e.entryName}`);
        seen.add(key);
        let data;
        try {
            data = readEntryData(e, limits.maxTotalBytes);
        }
        catch {
            throw new common_1.BadRequestException('Plugin package is corrupt or too large to extract');
        }
        actualBytes += data.length;
        if (actualBytes > limits.maxTotalBytes) {
            throw new common_1.BadRequestException('Plugin package is too large to extract');
        }
        entries.push({ relPath: norm, data });
    }
    const mainRel = path.posix.normalize(manifest.main);
    if (!entries.some(en => en.relPath === mainRel)) {
        throw new common_1.BadRequestException(`The archive is missing its main file: ${manifest.main}`);
    }
    return { manifest, entries };
}
//# sourceMappingURL=plugin-installer.js.map