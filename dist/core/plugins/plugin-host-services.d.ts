import type { ModuleRef } from '@nestjs/core';
import { type PluginConversationMappingPort, type PluginInstancePort, type PluginMessagePort, type PluginSearchRegistryPort, type PluginSessionPort } from './plugin-host-ports';
export declare class PluginHostServices {
    private readonly moduleRef;
    constructor(moduleRef: ModuleRef);
    getMessagePort(): PluginMessagePort;
    getSessionPort(): PluginSessionPort;
    getConversationMappingPort(): PluginConversationMappingPort;
    getPluginInstancePort(): PluginInstancePort;
    getSearchRegistryPort(): PluginSearchRegistryPort | undefined;
}
