import { CatalogService } from './catalog.service';
import { SendProductDto, ProductQueryDto } from './dto/send-product.dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getCatalog(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Catalog | null>;
    getProducts(sessionId: string, query: ProductQueryDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").PaginatedProducts>;
    getProduct(sessionId: string, productId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Product | null>;
    sendProduct(sessionId: string, dto: SendProductDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").MessageResult>;
}
