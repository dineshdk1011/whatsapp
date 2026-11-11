"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareFilterLidResolver = prepareFilterLidResolver;
exports.evaluateFilters = evaluateFilters;
const filter_types_1 = require("./filter-types");
const wa_id_1 = require("../../../engine/identity/wa-id");
const canonicalActor = (jid, resolve) => (0, wa_id_1.toNeutralJid)(jid, resolve).toLowerCase();
const canonicalInput = (value, resolve) => {
    const trimmed = value.trim();
    if (trimmed && !trimmed.includes('@')) {
        return `${trimmed.replace(/\D/g, '') || trimmed}@c.us`.toLowerCase();
    }
    return (0, wa_id_1.toNeutralJid)(trimmed, resolve).toLowerCase();
};
const toStringArray = (value) => Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
function identitiesIntersect(candidates, actual, resolve) {
    const literal = new Set(candidates.map(v => canonicalInput(v)));
    const lidPhones = new Set(candidates.filter(v => (0, wa_id_1.parseWaId)(v).kind === 'lid').map(v => canonicalInput(v, resolve)));
    return actual.some(jid => {
        const key = canonicalActor(jid);
        if (literal.has(key))
            return true;
        const kind = (0, wa_id_1.parseWaId)(jid).kind;
        if (kind === 'lid')
            return literal.has(canonicalActor(jid, resolve));
        return kind === 'user' && lidPhones.has(key);
    });
}
async function prepareFilterLidResolver(filters, event, data, read) {
    if (!read)
        return undefined;
    const lids = new Set();
    const family = (0, filter_types_1.eventFamily)(event);
    for (const filter of filters) {
        if (!Array.isArray(filter?.conditions))
            continue;
        for (const condition of filter.conditions) {
            try {
                const def = (0, filter_types_1.getFieldDefinition)(family, condition.field);
                if (!def || (def.kind !== 'id' && def.kind !== 'idArray'))
                    continue;
                const value = def.resolve(data);
                const actual = typeof value === 'string' ? [value] : toStringArray(value);
                for (const jid of [...actual, ...toStringArray(condition.value)]) {
                    const parsed = (0, wa_id_1.parseWaId)(jid);
                    if (parsed.kind === 'lid')
                        lids.add(parsed.userPart);
                }
            }
            catch {
                continue;
            }
        }
    }
    const phones = lids.size ? await read([...lids]).catch(() => ({})) : {};
    return jid => {
        const lid = (0, wa_id_1.parseWaId)(jid).userPart;
        return Object.hasOwn(phones, lid) ? phones[lid] : null;
    };
}
function evaluateCondition(def, condition, data, resolve) {
    const { operator, value, caseSensitive = false } = condition;
    const resolved = def.resolve(data);
    switch (def.kind) {
        case 'id': {
            const actual = typeof resolved === 'string' ? [resolved] : [];
            const isMatch = identitiesIntersect(toStringArray(value), actual, resolve);
            return operator === 'isNot' ? !isMatch : isMatch;
        }
        case 'enum': {
            const candidates = new Set(toStringArray(value));
            const actual = typeof resolved === 'string' ? resolved : undefined;
            const isMatch = actual != null && candidates.has(actual);
            return operator === 'isNot' ? !isMatch : isMatch;
        }
        case 'idArray': {
            const intersects = identitiesIntersect(toStringArray(value), toStringArray(resolved), resolve);
            return operator === 'isNot' ? !intersects : intersects;
        }
        case 'boolean':
            return resolved === (value === true);
        case 'text': {
            if (typeof value !== 'string')
                return true;
            const haystackRaw = typeof resolved === 'string' ? resolved : '';
            const haystack = caseSensitive ? haystackRaw : haystackRaw.toLowerCase();
            const needle = caseSensitive ? value : value.toLowerCase();
            if (operator === 'equals')
                return haystack === needle;
            return haystack.includes(needle);
        }
        default:
            return true;
    }
}
function evaluateFilters(filters, event, data, resolve) {
    if (!filters || !Array.isArray(filters.conditions) || filters.conditions.length === 0) {
        return true;
    }
    const family = (0, filter_types_1.eventFamily)(event);
    for (const condition of filters.conditions) {
        const def = (0, filter_types_1.getFieldDefinition)(family, condition.field);
        if (!def)
            continue;
        if (!evaluateCondition(def, condition, data, resolve))
            return false;
    }
    return true;
}
//# sourceMappingURL=filter-evaluator.js.map