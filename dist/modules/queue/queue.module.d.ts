export declare const WEBHOOK_QUEUE_JOB_OPTIONS: {
    readonly removeOnComplete: {
        readonly age: 3600;
        readonly count: 1000;
    };
    readonly removeOnFail: {
        readonly age: 86400;
        readonly count: 5000;
    };
};
export declare class QueueModule {
}
