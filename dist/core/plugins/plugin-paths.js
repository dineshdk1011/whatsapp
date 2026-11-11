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
exports.resolvePluginMainPath = resolvePluginMainPath;
exports.resolvePluginEntryPath = resolvePluginEntryPath;
exports.pluginUpdateStagingDirName = pluginUpdateStagingDirName;
exports.pluginUpdateBackupDirName = pluginUpdateBackupDirName;
const path = __importStar(require("path"));
function resolvePluginMainPath(pluginsDir, pluginId, main) {
    const base = path.resolve(pluginsDir, pluginId);
    const mainPath = path.resolve(base, main);
    if (mainPath !== base && !mainPath.startsWith(base + path.sep)) {
        throw new Error(`Plugin ${pluginId} main path escapes the plugin directory`);
    }
    return mainPath;
}
function resolvePluginEntryPath(packageDir, entry) {
    return resolvePluginMainPath(path.dirname(packageDir), path.basename(packageDir), entry);
}
function pluginUpdateStagingDirName(pluginId) {
    return `.${pluginId}.new`;
}
function pluginUpdateBackupDirName(pluginId) {
    return `.${pluginId}.bak`;
}
//# sourceMappingURL=plugin-paths.js.map