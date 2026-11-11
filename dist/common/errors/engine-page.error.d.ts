import { InternalServerErrorException } from '@nestjs/common';
export interface PageErrorSummary {
    name: string;
    message: string;
    build?: string;
}
export declare class EnginePageError extends InternalServerErrorException {
    constructor(summary: PageErrorSummary, raw: Error);
}
export declare class RecipientLookupUnansweredError extends EnginePageError {
}
