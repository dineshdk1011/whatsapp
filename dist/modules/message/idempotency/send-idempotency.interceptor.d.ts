import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SendIdempotencyService } from './send-idempotency.service';
export declare const IDEMPOTENCY_KEY_HEADER = "idempotency-key";
export declare const IDEMPOTENT_REPLAYED_HEADER = "idempotent-replayed";
export declare function sendFailureProvesNothingSent(error: unknown): boolean;
export declare class SendIdempotencyInterceptor implements NestInterceptor {
    private readonly store;
    private readonly logger;
    constructor(store: SendIdempotencyService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
    private runClaimed;
    private settle;
}
