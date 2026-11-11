"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedConfigDefaults = seedConfigDefaults;
function seedConfigDefaults(schema, config) {
    const properties = schema?.properties;
    if (!properties)
        return config;
    let seeded;
    for (const [key, field] of Object.entries(properties)) {
        if (config[key] !== undefined || field === null || typeof field !== 'object')
            continue;
        const value = field.default;
        if (value === undefined)
            continue;
        if (!seeded)
            seeded = { ...config };
        seeded[key] = value !== null && typeof value === 'object' ? structuredClone(value) : value;
    }
    return seeded ?? config;
}
//# sourceMappingURL=config-defaults.util.js.map