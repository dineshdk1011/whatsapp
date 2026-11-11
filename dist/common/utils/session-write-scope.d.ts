export interface SessionWriteScope {
    assertCurrent(): void;
    onRetire(listener: () => void): () => void;
    write<T>(operation: () => Promise<T>): Promise<T>;
    close(): void;
}
export declare function captureSessionWrites(source: object, sessionId: string): SessionWriteScope;
export declare function closeSessionWrites(source: object, sessionId: string): {
    drain(): Promise<void>;
    release(): void;
};
