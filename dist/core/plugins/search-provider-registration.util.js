"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPluginSearchProvider = registerPluginSearchProvider;
exports.unregisterPluginSearchProvider = unregisterPluginSearchProvider;
const plugin_search_provider_1 = require("../../modules/search/providers/plugin-search-provider");
function registerPluginSearchProvider(deps) {
    if (!deps.hasPermission) {
        deps.warn(`Sandboxed plugin ${deps.pluginId} declared a search provider without 'search:provide'; ignoring`, {
            pluginId: deps.pluginId,
            action: 'sandbox_search_provider_denied',
        });
        return;
    }
    if (!deps.registry)
        return;
    if (deps.mode === 'none')
        return;
    const provider = new plugin_search_provider_1.PluginSearchProvider(deps.pluginId, deps.label, deps.transport, deps.timeoutMs);
    deps.registry.register(provider);
    if (deps.mode === 'auto')
        deps.registry.setActive(provider.id);
}
function unregisterPluginSearchProvider(registry, pluginId) {
    registry?.unregister(`plugin:${pluginId}`);
}
//# sourceMappingURL=search-provider-registration.util.js.map