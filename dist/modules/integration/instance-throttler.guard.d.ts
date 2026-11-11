import { ProxyAwareThrottlerGuard } from '../../common/security/proxy-aware-throttler.guard';
export declare class InstanceThrottlerGuard extends ProxyAwareThrottlerGuard {
    onModuleInit(): Promise<void>;
    protected shouldSkip(): Promise<boolean>;
}
