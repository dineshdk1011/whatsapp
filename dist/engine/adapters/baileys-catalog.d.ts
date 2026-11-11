import type { WASocket } from '@whiskeysockets/baileys';
import { Catalog, PaginatedProducts, Product, ProductQueryOptions } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export interface BaileysCatalogHost {
    ensureReady(): void;
    getSocket(): WASocket;
    readonly logger: ReturnType<typeof createLogger>;
    normalizedSelfJid(): string;
}
export declare const CATALOG_QUERY_BUDGET_MS = 30000;
export declare class BaileysCatalog {
    private readonly host;
    private readonly budgetMs;
    constructor(host: BaileysCatalogHost, budgetMs?: number);
    private bounded;
    private sock;
    getCatalog(): Promise<Catalog | null>;
    getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts>;
    getProduct(productId: string): Promise<Product | null>;
    private fetchAllProducts;
}
