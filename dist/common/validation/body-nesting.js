"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceedsBodyNesting = exports.isUtf8Charset = exports.BODY_NESTING_MESSAGE = exports.MAX_BODY_NESTING = void 0;
exports.exceedsJsonNesting = exceedsJsonNesting;
exports.MAX_BODY_NESTING = 100;
exports.BODY_NESTING_MESSAGE = `Request body must not nest objects or arrays more than ${exports.MAX_BODY_NESTING} levels deep`;
const isUtf8Charset = (charset) => charset.toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, '') === 'utf8';
exports.isUtf8Charset = isUtf8Charset;
const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const OPEN_BRACKET = 0x5b;
const CLOSE_BRACKET = 0x5d;
const OPEN_BRACE = 0x7b;
const CLOSE_BRACE = 0x7d;
function exceedsJsonNesting(text) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const byte = text[i];
        if (byte === QUOTE) {
            for (i++; i < text.length && text[i] !== QUOTE; i++) {
                if (text[i] === BACKSLASH)
                    i++;
            }
        }
        else if (byte === OPEN_BRACKET || byte === OPEN_BRACE) {
            if (++depth > exports.MAX_BODY_NESTING)
                return true;
        }
        else if (byte === CLOSE_BRACKET || byte === CLOSE_BRACE) {
            depth--;
        }
    }
    return false;
}
const exceedsBodyNesting = (value, depth = 1) => typeof value === 'object' &&
    value !== null &&
    (depth > exports.MAX_BODY_NESTING || Object.values(value).some(child => (0, exports.exceedsBodyNesting)(child, depth + 1)));
exports.exceedsBodyNesting = exceedsBodyNesting;
//# sourceMappingURL=body-nesting.js.map