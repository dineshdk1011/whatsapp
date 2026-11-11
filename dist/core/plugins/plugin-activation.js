"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllSessionsScope = exports.sessionScopeKey = void 0;
exports.isPluginActiveForSession = isPluginActiveForSession;
exports.restorableConfig = restorableConfig;
exports.resolveInstanceConfig = resolveInstanceConfig;
exports.resolvePluginConfig = resolvePluginConfig;
const sessionScopeKey = (scope) => (!scope || scope === '*' ? '*' : scope);
exports.sessionScopeKey = sessionScopeKey;
const isAllSessionsScope = (scope) => (0, exports.sessionScopeKey)(scope) === '*';
exports.isAllSessionsScope = isAllSessionsScope;
function isPluginActiveForSession(sessionScoped, activeSessions, sessionId) {
    if (!sessionScoped)
        return true;
    if (sessionId === undefined)
        return true;
    if (activeSessions.includes('*'))
        return true;
    return activeSessions.includes(sessionId);
}
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
function deepMerge(base, override) {
    const out = { ...base };
    for (const [key, value] of Object.entries(override)) {
        const baseValue = out[key];
        out[key] = isPlainObject(baseValue) && isPlainObject(value) ? deepMerge(baseValue, value) : value;
    }
    return out;
}
function hostOf(value) {
    if (typeof value !== 'string' || value.trim() === '')
        return null;
    try {
        const { origin } = new URL(value);
        return origin === 'null' ? value.trim() : origin;
    }
    catch {
        return value.trim();
    }
}
const redirectsHost = (beneath, layer, hostKeys) => hostKeys.some(key => {
    const value = layer[key];
    if (typeof value !== 'string')
        return value !== undefined && value !== null;
    const next = hostOf(value);
    return next !== null && next !== hostOf(beneath[key]);
});
const holdsSecret = (field) => !!field.secret ||
    Object.values(field.properties ?? {}).some(holdsSecret) ||
    (!!field.items && holdsSecret(field.items));
function withoutSecrets(config, properties) {
    const out = { ...config };
    for (const [key, field] of Object.entries(properties)) {
        const value = out[key];
        if (value === undefined)
            continue;
        if (field.secret || (field.type === 'array' && holdsSecret(field)))
            delete out[key];
        else if (field.type === 'object' && field.properties && isPlainObject(value)) {
            out[key] = withoutSecrets(value, field.properties);
        }
    }
    return out;
}
function mergeLayer(beneath, layer, manifest) {
    const hostKeys = manifest.net?.allowConfigHosts;
    if (!hostKeys?.length || !redirectsHost(beneath, layer, hostKeys))
        return deepMerge(beneath, layer);
    const properties = manifest.configSchema?.properties;
    return deepMerge(properties ? withoutSecrets(beneath, properties) : {}, layer);
}
const namesHost = (layer, hostKeys) => hostKeys.some(key => {
    const value = layer[key];
    return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;
});
function restorableConfig(stored, incoming, manifest, beneath = {}) {
    const hostKeys = manifest.net?.allowConfigHosts;
    if (!stored || !hostKeys?.length || !isPlainObject(incoming))
        return stored;
    const bound = Object.fromEntries(hostKeys.map(key => [key, stored[key] === undefined || stored[key] === null ? beneath[key] : stored[key]]));
    if (!redirectsHost(bound, incoming, hostKeys))
        return stored;
    const properties = manifest.configSchema?.properties;
    return properties ? withoutSecrets(stored, properties) : {};
}
function resolveInstanceConfig(resolved, instanceConfig, manifest, base) {
    if (!instanceConfig)
        return resolved;
    const hostKeys = manifest.net?.allowConfigHosts;
    const properties = manifest.configSchema?.properties;
    const unset = hostKeys?.filter(key => !namesHost(instanceConfig, [key])) ?? [];
    const moved = !!base && unset.length > 0 && redirectsHost(base, resolved, unset);
    const row = moved ? (properties ? withoutSecrets(instanceConfig, properties) : {}) : instanceConfig;
    return mergeLayer(resolved, row, manifest);
}
function resolvePluginConfig(base, sessionConfig, sessionId, sessionScoped, manifest) {
    if (!sessionScoped || sessionId === undefined || !sessionConfig)
        return base;
    const override = sessionConfig[sessionId];
    return override ? mergeLayer(base, override, manifest) : base;
}
//# sourceMappingURL=plugin-activation.js.map