import { PluginWorkerChannel, HostToWorkerMessage, WorkerToHostMessage } from './protocol';
export interface WorkerThreadChannelOptions {
    workerEntry: string;
    maxOldGenerationSizeMb?: number;
    execArgv?: string[];
    env?: NodeJS.ProcessEnv;
}
export declare class WorkerThreadChannel implements PluginWorkerChannel {
    private readonly worker;
    constructor(options: WorkerThreadChannelOptions);
    postMessage(message: HostToWorkerMessage): void;
    onMessage(handler: (message: WorkerToHostMessage) => void): void;
    onExit(handler: (code: number) => void): void;
    terminate(): Promise<void>;
}
