"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldDispatchToPlugin = shouldDispatchToPlugin;
function shouldDispatchToPlugin(handover, callerPluginId) {
    if (!handover)
        return true;
    if (handover.handoverState === 'bot')
        return true;
    return handover.pluginId === callerPluginId;
}
//# sourceMappingURL=handover-gate.js.map