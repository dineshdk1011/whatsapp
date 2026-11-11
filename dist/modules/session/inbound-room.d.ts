import { ConcurrencyLimiter } from '../../common/utils/concurrency-limiter';
export interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}
export declare function deferred<T>(): Deferred<T>;
export interface RoomState {
    granted: boolean;
    abandoned: boolean;
    grant: Deferred<boolean>;
    done: Deferred<void>;
    holds: Promise<unknown>[];
}
export declare function roomState(): RoomState;
export declare class InboundRoom {
    readonly gate: ConcurrencyLimiter;
    private lastRelease;
    request(s: RoomState): Promise<void>;
    wait(s: RoomState): Promise<boolean>;
    get idle(): boolean;
}
