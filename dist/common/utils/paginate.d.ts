export declare const DEFAULT_LIST_LIMIT = 1000;
export interface ListOptions {
    limit?: number;
    offset?: number;
}
export declare function resolveListWindow(limit?: number, offset?: number): {
    limit: number;
    offset: number;
};
export declare function paginate<T>(items: T[], limit?: number, offset?: number): T[];
