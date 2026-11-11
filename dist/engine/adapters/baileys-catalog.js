"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysCatalog = exports.CATALOG_QUERY_BUDGET_MS = void 0;
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
const baileys_groups_1 = require("./baileys-groups");
const CATALOG_PAGE_SIZE = 50;
exports.CATALOG_QUERY_BUDGET_MS = 30_000;
class BaileysCatalog {
    host;
    budgetMs;
    constructor(host, budgetMs = exports.CATALOG_QUERY_BUDGET_MS) {
        this.host = host;
        this.budgetMs = budgetMs;
    }
    async bounded(work, deadline, empty) {
        try {
            return await (0, baileys_query_deadline_1.withQueryDeadline)((0, baileys_groups_1.mapServerRefusal)('Reading the catalog', () => work().catch((error) => {
                if (empty !== undefined && (0, baileys_groups_1.refusedStatusCode)(error) === 404)
                    return empty;
                throw error;
            })), deadline - Date.now(), 'WhatsApp did not answer the catalog query in time');
        }
        catch (error) {
            if (error instanceof engine_transport_error_1.EngineTransportError) {
                this.host.logger.warn('Catalog query got no usable answer', { budgetMs: this.budgetMs, error: error.message });
            }
            throw error;
        }
    }
    sock() {
        return this.host.getSocket();
    }
    async getCatalog() {
        this.host.ensureReady();
        const jid = this.host.normalizedSelfJid();
        const { collections } = await this.bounded(() => this.sock().getCollections(jid), Date.now() + this.budgetMs, {
            collections: [],
        });
        const first = collections[0];
        if (!first) {
            return null;
        }
        const phone = jid.split('@')[0];
        return {
            id: first.id,
            name: first.name,
            productCount: first.products.length,
            url: `https://wa.me/c/${phone}`,
        };
    }
    async getProducts(options = {}) {
        const all = (await this.fetchAllProducts()).map(mapProduct);
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        return {
            products: all.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total: all.length,
                totalPages: Math.ceil(all.length / limit),
            },
        };
    }
    async getProduct(productId) {
        const found = (await this.fetchAllProducts()).find(p => p.id === productId);
        return found ? mapProduct(found) : null;
    }
    async fetchAllProducts() {
        this.host.ensureReady();
        const jid = this.host.normalizedSelfJid();
        const deadline = Date.now() + this.budgetMs;
        const products = [];
        let cursor;
        do {
            const page = await this.bounded(() => this.sock().getCatalog({ jid, limit: CATALOG_PAGE_SIZE, cursor }), deadline, cursor === undefined ? { products: [], nextPageCursor: undefined } : undefined);
            products.push(...page.products);
            if (page.nextPageCursor === cursor) {
                break;
            }
            cursor = page.nextPageCursor;
        } while (cursor);
        return products;
    }
}
exports.BaileysCatalog = BaileysCatalog;
function mapProduct(p) {
    return {
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        ...(Number.isFinite(p.price) && { price: p.price, priceFormatted: formatPrice(p.price, p.currency) }),
        ...(p.currency && { currency: p.currency }),
        imageUrl: Object.values(p.imageUrls ?? {})[0],
        url: p.url ?? '',
        isAvailable: p.availability === 'in stock',
        retailerId: p.retailerId,
    };
}
function formatPrice(price, currency) {
    if (!currency)
        return new Intl.NumberFormat('en').format(price);
    try {
        return new Intl.NumberFormat('en', { style: 'currency', currency }).format(price);
    }
    catch {
        return `${currency} ${price}`;
    }
}
//# sourceMappingURL=baileys-catalog.js.map