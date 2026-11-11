"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countMetaValues = countMetaValues;
exports.metaText = metaText;
const node_util_1 = require("node:util");
const logger_service_1 = require("../../common/services/logger.service");
function countMetaValues(meta, limit) {
    let count = 0;
    const open = new Set();
    const frames = [];
    const visit = (value) => {
        count++;
        if (typeof value === 'string')
            count += value.length;
        if (typeof value !== 'object' || value === null)
            return;
        if (open.has(value))
            return;
        if (ArrayBuffer.isView(value)) {
            count += value.length ?? 0;
            return;
        }
        let list = Array.isArray(value) ? value : null;
        if (node_util_1.types.isMap(value) || node_util_1.types.isSet(value)) {
            count += value.size;
            if (count > limit)
                return;
            list = Array.from(value);
        }
        if (Object.prototype.toString.call(value) === '[object String]') {
            count += value.length;
            return;
        }
        open.add(value);
        const keys = list
            ? null
            : node_util_1.types.isNativeError(value)
                ? [...new Set(['name', 'message', 'stack', ...Object.keys(value)])]
                : Object.keys(value);
        frames.push({ node: value, keys, list, length: (keys ?? list ?? []).length, next: 0 });
    };
    visit(meta);
    while (frames.length > 0 && count <= limit) {
        const frame = frames[frames.length - 1];
        if (frame.next < frame.length) {
            const index = frame.next++;
            if (frame.keys) {
                count += frame.keys[index].length;
                visit(frame.node[frame.keys[index]]);
            }
            else {
                visit(frame.list[index]);
            }
        }
        else {
            open.delete(frame.node);
            frames.pop();
        }
    }
    return count;
}
function metaText(meta) {
    const rendered = new Map();
    return JSON.stringify(meta, function (key, value) {
        const raw = this[key];
        if (!Array.isArray(this) && (0, logger_service_1.isSecretName)(key))
            return logger_service_1.REDACTED;
        if (typeof raw !== 'object' || raw === null)
            return value;
        if (!rendered.has(raw))
            rendered.set(raw, (0, logger_service_1.writtenForm)(raw));
        return rendered.get(raw);
    });
}
//# sourceMappingURL=sandbox-log-meta.js.map