import { IngressJobData } from '../queue/processors/ingress.processor';
export declare class KeyedAsyncLock {
    private readonly tails;
    run<T>(key: string, fn: () => Promise<T>): Promise<T>;
}
export declare function orderingKeyFor(job: IngressJobData): string;
