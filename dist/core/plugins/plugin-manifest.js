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
exports.INSTALLABLE_TYPES = exports.RESERVED_PLUGIN_IDS = void 0;
exports.validatePluginManifest = validatePluginManifest;
exports.dropMalformedConfigFields = dropMalformedConfigFields;
const path = __importStar(require("path"));
const plugin_interfaces_1 = require("./plugin.interfaces");
const catalog_1 = require("../../modules/plugins/catalog");
const { version: HOST_VERSION } = require('../../../package.json');
exports.RESERVED_PLUGIN_IDS = new Set(['whatsapp-web.js', 'baileys', 'auto-reply', 'translation']);
exports.INSTALLABLE_TYPES = new Set([plugin_interfaces_1.PluginType.EXTENSION]);
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/i;
const REQUIRED_FIELDS = ['id', 'name', 'version', 'type', 'main'];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
function validatePluginManifest(manifest, hostVersion = HOST_VERSION) {
    if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
        throw new Error('manifest.json must be a JSON object');
    }
    const m = manifest;
    for (const field of REQUIRED_FIELDS) {
        if (typeof m[field] !== 'string' || m[field].length === 0) {
            throw new Error(`manifest.json is missing or has an invalid required field: ${field}`);
        }
    }
    if (!SAFE_ID.test(m.id) || m.id.includes('..')) {
        throw new Error(`Invalid plugin id: "${m.id}"`);
    }
    if (exports.RESERVED_PLUGIN_IDS.has(m.id.toLowerCase())) {
        throw new Error(`Plugin id "${m.id}" is reserved by a built-in plugin`);
    }
    if (!exports.INSTALLABLE_TYPES.has(m.type)) {
        throw new Error(`Plugin type "${m.type}" is not installable — only extension plugins can be installed (engines and other tiers are built-in).`);
    }
    assertMainContained(m.main);
    assertStringArray(m.permissions, 'permissions');
    assertStringArray(m.sessions, 'sessions');
    assertStringArray(m.hooks, 'hooks');
    const net = m.net;
    if (net !== undefined && net !== null) {
        if (typeof net !== 'object' || Array.isArray(net)) {
            throw new Error('manifest.json net must be an object');
        }
        assertStringArray(m.net?.allow, 'net.allow');
        assertStringArray(m.net?.allowConfigHosts, 'net.allowConfigHosts');
    }
    const min = m.minOpenWAVersion;
    if (min !== undefined && min !== null) {
        if (typeof min !== 'string' || !SEMVER.test(min)) {
            throw new Error('manifest.json minOpenWAVersion must be a MAJOR.MINOR.PATCH version');
        }
        if ((0, catalog_1.compareSemver)(hostVersion, min) < 0) {
            throw new Error(`Plugin ${m.id} requires OpenWA >= ${min} (running ${hostVersion})`);
        }
    }
}
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
function dropMalformedConfigFields(schema) {
    if (!isPlainObject(schema))
        return;
    if ('properties' in schema) {
        const properties = schema.properties;
        if (!isPlainObject(properties)) {
            delete schema.properties;
        }
        else {
            for (const [key, field] of Object.entries(properties)) {
                if (isPlainObject(field))
                    dropMalformedConfigFields(field);
                else
                    delete properties[key];
            }
        }
    }
    if ('items' in schema) {
        if (isPlainObject(schema.items))
            dropMalformedConfigFields(schema.items);
        else
            delete schema.items;
    }
}
function assertStringArray(value, field) {
    if (value !== undefined && value !== null && !(Array.isArray(value) && value.every(v => typeof v === 'string'))) {
        throw new Error(`manifest.json ${field} must be an array of strings`);
    }
}
function assertMainContained(main) {
    const normalized = path.posix.normalize(main);
    if (path.posix.isAbsolute(main) || normalized === '..' || normalized.startsWith('../') || main.includes('\\')) {
        throw new Error(`manifest.json main escapes the plugin directory: "${main}"`);
    }
}
//# sourceMappingURL=plugin-manifest.js.map