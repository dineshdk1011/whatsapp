import { EngineTransportError } from './engine-transport.error';
export declare class EngineNotSentError extends EngineTransportError {
}
export declare function markNothingSent<T>(error: T): T;
export declare function provesNothingSent(error: unknown): boolean;
