export declare const DEFAULT_STORAGE_ROOT = "./data/media";
export interface StorageRootLogger {
    warn: (message: string) => void;
}
export interface StorageRootOptions {
    configured?: string;
    isWritable?: (root: string) => boolean;
    logger?: StorageRootLogger;
}
export declare function isStorageRootWritable(root: string): boolean;
export declare function resolveStorageRoot(options: StorageRootOptions): string;
