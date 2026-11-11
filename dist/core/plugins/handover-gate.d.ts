export declare function shouldDispatchToPlugin(handover: {
    pluginId: string;
    handoverState: 'bot' | 'human' | 'closed';
} | null, callerPluginId: string): boolean;
