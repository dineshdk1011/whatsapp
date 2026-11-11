import { PluginManifest, RESERVED_PLUGIN_IDS, INSTALLABLE_TYPES } from '../../core/plugins';
export { RESERVED_PLUGIN_IDS, INSTALLABLE_TYPES };
export interface PackageLimits {
    maxEntries: number;
    maxTotalBytes: number;
}
export declare const DEFAULT_PACKAGE_LIMITS: PackageLimits;
export interface ParsedPackage {
    manifest: PluginManifest;
    entries: {
        relPath: string;
        data: Buffer;
    }[];
}
export declare function parsePluginPackage(buffer: Buffer, limits?: PackageLimits): ParsedPackage;
