"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginHostServices = void 0;
const plugin_host_ports_1 = require("./plugin-host-ports");
class PluginHostServices {
    moduleRef;
    constructor(moduleRef) {
        this.moduleRef = moduleRef;
    }
    getMessagePort() {
        return this.moduleRef.get(plugin_host_ports_1.PLUGIN_MESSAGE_PORT, { strict: false });
    }
    getSessionPort() {
        return this.moduleRef.get(plugin_host_ports_1.PLUGIN_SESSION_PORT, { strict: false });
    }
    getConversationMappingPort() {
        return this.moduleRef.get(plugin_host_ports_1.PLUGIN_CONVERSATION_MAPPING_PORT, { strict: false });
    }
    getPluginInstancePort() {
        return this.moduleRef.get(plugin_host_ports_1.PLUGIN_INSTANCE_PORT, {
            strict: false,
        });
    }
    getSearchRegistryPort() {
        try {
            return this.moduleRef.get(plugin_host_ports_1.PLUGIN_SEARCH_REGISTRY_PORT, { strict: false });
        }
        catch {
            return undefined;
        }
    }
}
exports.PluginHostServices = PluginHostServices;
//# sourceMappingURL=plugin-host-services.js.map