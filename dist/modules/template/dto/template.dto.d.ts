export declare class CreateTemplateDto {
    name: string;
    body: string;
    header?: string;
    footer?: string;
}
export declare class UpdateTemplateDto {
    name?: string;
    body?: string;
    header?: string;
    footer?: string;
}
export declare class TemplateResponseDto {
    id: string;
    sessionId: string;
    name: string;
    body: string;
    header?: string | null;
    footer?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
