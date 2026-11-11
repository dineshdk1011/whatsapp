"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToStrictArray = exports.ToStrictString = exports.ToStrictNumber = exports.ToStrictBoolean = void 0;
exports.coerceStrictBoolean = coerceStrictBoolean;
exports.coerceStrictNumber = coerceStrictNumber;
exports.coerceStrictString = coerceStrictString;
exports.coerceStrictArray = coerceStrictArray;
const class_transformer_1 = require("class-transformer");
function coerceStrictBoolean({ obj, key }) {
    const raw = obj?.[key];
    if (typeof raw === 'boolean')
        return raw;
    if (raw === 'true')
        return true;
    if (raw === 'false')
        return false;
    return raw;
}
const ToStrictBoolean = () => (0, class_transformer_1.Transform)(coerceStrictBoolean);
exports.ToStrictBoolean = ToStrictBoolean;
function coerceStrictNumber({ obj, key }) {
    const raw = obj?.[key];
    if (typeof raw === 'number')
        return raw;
    if (typeof raw !== 'string' || raw.trim() === '')
        return raw;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
}
const ToStrictNumber = () => (0, class_transformer_1.Transform)(coerceStrictNumber);
exports.ToStrictNumber = ToStrictNumber;
function coerceStrictString({ obj, key }) {
    const raw = obj?.[key];
    return typeof raw === 'number' ? String(raw) : raw;
}
const ToStrictString = () => (0, class_transformer_1.Transform)(coerceStrictString);
exports.ToStrictString = ToStrictString;
function coerceStrictArray({ value, obj, key }) {
    const raw = obj?.[key];
    return Array.isArray(raw) ? value : raw;
}
const ToStrictArray = () => (0, class_transformer_1.Transform)(coerceStrictArray);
exports.ToStrictArray = ToStrictArray;
//# sourceMappingURL=strict-boolean.js.map