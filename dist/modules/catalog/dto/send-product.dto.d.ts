export declare const PRODUCT_ID_MAX_LENGTH = 255;
export declare class SendProductDto {
    chatId: string;
    productId: string;
    body?: string;
}
export declare class ProductQueryDto {
    page?: number;
    limit?: number;
}
