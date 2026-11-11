"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LIST_LIMIT = void 0;
exports.resolveListWindow = resolveListWindow;
exports.paginate = paginate;
exports.DEFAULT_LIST_LIMIT = 1000;
function resolveListWindow(limit, offset) {
    const normalizedOffset = typeof offset === 'number' && Number.isFinite(offset)
        ? Math.min(Math.max(Math.trunc(offset), 0), Number.MAX_SAFE_INTEGER)
        : 0;
    const normalizedLimit = typeof limit === 'number' && Number.isFinite(limit)
        ? Math.min(Math.max(Math.trunc(limit), 1), exports.DEFAULT_LIST_LIMIT)
        : exports.DEFAULT_LIST_LIMIT;
    return { limit: normalizedLimit, offset: normalizedOffset };
}
function paginate(items, limit, offset) {
    const { limit: lim, offset: off } = resolveListWindow(limit, offset);
    return items.slice(off, off + lim);
}
//# sourceMappingURL=paginate.js.map