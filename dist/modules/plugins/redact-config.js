"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRET_SENTINEL = void 0;
exports.redactSecretConfig = redactSecretConfig;
exports.restoreSecretConfig = restoreSecretConfig;
const common_1 = require("@nestjs/common");
exports.SECRET_SENTINEL = '***';
const isMeaningful = (v) => v !== undefined && v !== null && v !== '';
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
function redactValue(value, field) {
    if (field.secret && isMeaningful(value))
        return exports.SECRET_SENTINEL;
    if (field.type === 'object' && field.properties && isPlainObject(value)) {
        return redactObject(value, field.properties);
    }
    if (field.type === 'array' && field.items && Array.isArray(value)) {
        return value.map(item => redactValue(item, field.items));
    }
    return value;
}
function redactObject(config, properties) {
    const out = { ...config };
    for (const [key, field] of Object.entries(properties)) {
        if (key in out)
            out[key] = redactValue(out[key], field);
    }
    return out;
}
function redactSecretConfig(config, schema) {
    const out = { ...(config ?? {}) };
    if (!schema?.properties) {
        for (const key of Object.keys(out)) {
            if (isMeaningful(out[key]))
                out[key] = exports.SECRET_SENTINEL;
        }
        return out;
    }
    return redactObject(out, schema.properties);
}
function stableStringify(v) {
    if (Array.isArray(v))
        return '[' + v.map(stableStringify).join(',') + ']';
    if (isPlainObject(v)) {
        return ('{' +
            Object.keys(v)
                .sort()
                .map(k => JSON.stringify(k) + ':' + stableStringify(v[k]))
                .join(',') +
            '}');
    }
    return JSON.stringify(v) ?? 'null';
}
function elementSignature(value, field) {
    return stableStringify(redactValue(value, field));
}
function restoreValue(incoming, existing, field) {
    if (field.secret) {
        if (incoming === null)
            return { keep: false };
        if (incoming === exports.SECRET_SENTINEL || !isMeaningful(incoming)) {
            return isMeaningful(existing) ? { keep: true, value: existing } : { keep: false };
        }
        return { keep: true, value: incoming };
    }
    if (field.type === 'object' && field.properties && isPlainObject(incoming)) {
        return {
            keep: true,
            value: restoreObject(incoming, isPlainObject(existing) ? existing : undefined, field.properties),
        };
    }
    if (field.type === 'array' && field.items && Array.isArray(incoming)) {
        const itemField = field.items;
        const existingArr = Array.isArray(existing) ? existing : [];
        const bySig = new Map();
        for (const ex of existingArr) {
            const s = elementSignature(ex, itemField);
            const group = bySig.get(s);
            if (group)
                group.push(ex);
            else
                bySig.set(s, [ex]);
        }
        const sameLength = incoming.length === existingArr.length;
        const sigs = incoming.map(item => elementSignature(item, itemField));
        const masked = incoming.map((item) => stableStringify(restoreValue(item, undefined, itemField)) !== stableStringify({ keep: true, value: item }));
        const inCount = new Map();
        sigs.forEach((s, i) => {
            if (masked[i])
                inCount.set(s, (inCount.get(s) ?? 0) + 1);
        });
        const seen = new Map();
        return {
            keep: true,
            value: incoming
                .map((item, i) => {
                const s = sigs[i];
                const group = bySig.get(s) ?? [];
                const storedCount = group.length;
                const k = seen.get(s) ?? 0;
                if (masked[i])
                    seen.set(s, k + 1);
                if (!sameLength && storedCount > 1 && (inCount.get(s) ?? 0) < storedCount) {
                    const unbound = restoreValue(item, undefined, itemField);
                    if (stableStringify(unbound) !== stableStringify(restoreValue(item, group[0], itemField))) {
                        throw new common_1.BadRequestException('This change to a list of masked secrets cannot be matched to the stored values; re-enter the remaining secret values');
                    }
                    return unbound;
                }
                const twin = existingArr[i];
                const match = storedCount === 1
                    ? group[0]
                    : sameLength
                        ? twin
                        : inCount.get(s) === storedCount
                            ? group[k]
                            : twin !== undefined && elementSignature(twin, itemField) === s
                                ? twin
                                : undefined;
                return restoreValue(item, match, itemField);
            })
                .filter(r => r.keep)
                .map(r => r.value),
        };
    }
    return { keep: true, value: incoming };
}
function restoreObject(incoming, existing, properties, mergedOverStored = false) {
    const out = { ...incoming };
    for (const [key, field] of Object.entries(properties)) {
        if (!(key in out))
            continue;
        if (field.secret && out[key] === null) {
            if (!mergedOverStored || !isMeaningful(existing?.[key]))
                delete out[key];
            continue;
        }
        const r = restoreValue(out[key], existing?.[key], field);
        if (r.keep)
            out[key] = r.value;
        else
            delete out[key];
    }
    return out;
}
function restoreSecretConfig(incoming, existing, schema, options = {}) {
    if (!schema?.properties) {
        const out = { ...incoming };
        const ex = existing ?? {};
        for (const key of Object.keys(out)) {
            if (out[key] !== exports.SECRET_SENTINEL)
                continue;
            if (isMeaningful(ex[key]))
                out[key] = ex[key];
            else
                delete out[key];
        }
        return out;
    }
    return restoreObject(incoming, existing, schema.properties, options.mergedOverStored);
}
//# sourceMappingURL=redact-config.js.map