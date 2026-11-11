import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SendIdempotencyKey } from '../entities/send-idempotency-key.entity';
export declare const SEND_IDEMPOTENCY_TTL_MS: number;
export declare const SEND_IDEMPOTENCY_STALE_PENDING_MS: number;
export declare function isValidIdempotencyKey(key: string): boolean;
export declare function hashSendRequest(route: string, body: unknown): string;
export type SendIdempotencyClaim = {
    kind: 'claimed';
    id: string;
} | {
    kind: 'replay';
    body: unknown;
} | {
    kind: 'mismatch';
} | {
    kind: 'in_progress';
} | {
    kind: 'outcome_unknown';
};
export declare class SendIdempotencyService implements OnModuleInit, OnModuleDestroy {
    private readonly keys;
    private readonly logger;
    private pruneTimer;
    constructor(keys: Repository<SendIdempotencyKey>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    claim(input: {
        sessionId: string;
        key: string;
        route: string;
        requestHash: string;
    }): Promise<SendIdempotencyClaim>;
    private classify;
    complete(id: string, responseBody: unknown): Promise<void>;
    release(id: string): Promise<void>;
    markFailed(id: string): Promise<void>;
    pruneExpired(now?: Date): Promise<number>;
}
