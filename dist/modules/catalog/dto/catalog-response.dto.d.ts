export declare class CatalogDto {
    id: string;
    name: string;
    description?: string;
    productCount: number;
    url: string;
}
export declare class ProductDto {
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    priceFormatted?: string;
    imageUrl?: string;
    url: string;
    isAvailable: boolean;
    retailerId?: string;
}
export declare class ProductPaginationDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class PaginatedProductsDto {
    products: ProductDto[];
    pagination: ProductPaginationDto;
}
export declare class ProductMessageResponseDto {
    id: string;
    timestamp: number;
}
