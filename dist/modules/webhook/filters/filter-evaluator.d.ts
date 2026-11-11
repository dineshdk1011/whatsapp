import { WebhookFilters } from './filter-types';
export type LidResolver = (jid: string) => string | null;
export declare function prepareFilterLidResolver(filters: readonly (WebhookFilters | null | undefined)[], event: string, data: Record<string, unknown>, read?: (lids: string[]) => Promise<Record<string, string | null>>): Promise<LidResolver | undefined>;
export declare function evaluateFilters(filters: WebhookFilters | null | undefined, event: string, data: Record<string, unknown>, resolve?: LidResolver): boolean;
