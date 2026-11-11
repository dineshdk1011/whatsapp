"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsHeaderMap = IsHeaderMap;
const class_validator_1 = require("class-validator");
const HEADER_NAME = /^[A-Za-z0-9-]+$/;
const MAX_HEADERS = 50;
const MAX_VALUE_LENGTH = 1024;
function hasInvalidValueChar(s) {
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c < 0x20 || c === 0x7f || c > 0xff)
            return true;
    }
    return false;
}
function IsHeaderMap(options) {
    return function (target, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isHeaderMap',
            target: target.constructor,
            propertyName,
            options,
            validator: {
                validate(value) {
                    if (value === undefined)
                        return true;
                    if (value === null || typeof value !== 'object' || Array.isArray(value))
                        return false;
                    const entries = Object.entries(value);
                    if (entries.length > MAX_HEADERS)
                        return false;
                    if (new Set(entries.map(([k]) => k.toLowerCase())).size !== entries.length)
                        return false;
                    return entries.every(([k, v]) => HEADER_NAME.test(k) && typeof v === 'string' && v.length <= MAX_VALUE_LENGTH && !hasInvalidValueChar(v));
                },
                defaultMessage() {
                    return 'headers must be a flat map of valid header names to string values (names unique ignoring case, no control characters or characters outside Latin-1, max 50 entries, value max 1024 chars)';
                },
            },
        });
    };
}
//# sourceMappingURL=is-header-map.validator.js.map