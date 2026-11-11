export interface CatalogEntry {
    id: string;
    name: string;
    version: string;
    type?: string;
    status?: string;
    description?: string;
    author?: string;
    license?: string;
    keywords?: string[];
    minOpenWAVersion?: string;
    testedOpenWAVersion?: string;
    releasedAt?: string;
    repoUrl?: string;
    homepage?: string;
    download?: string;
    [key: string]: unknown;
}
export declare function isCatalogEntry(value: unknown): value is CatalogEntry;
export interface CatalogPlugin extends CatalogEntry {
    installed: boolean;
    installedVersion: string | null;
    updateAvailable: boolean;
}
export declare function compareSemver(a: string, b: string): number;
export declare function annotateCatalog(entries: CatalogEntry[], installed: {
    id: string;
    version: string;
}[]): CatalogPlugin[];
