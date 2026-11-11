import { BadRequestException } from '@nestjs/common';
export declare function foldSearchText(text: string): string;
export declare function foldForMatching(text: string): string;
export declare class ContainsTermsRefusedError extends BadRequestException {
}
export declare function containsTerms(q: string): string[];
export declare function searchTermCount(q: string): number;
