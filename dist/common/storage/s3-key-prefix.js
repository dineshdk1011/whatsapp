"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_S3_KEY_PREFIX = void 0;
exports.normalizeS3KeyPrefix = normalizeS3KeyPrefix;
const path_safety_1 = require("../utils/path-safety");
exports.DEFAULT_S3_KEY_PREFIX = 'media/';
function normalizeS3KeyPrefix(raw) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed)
        return exports.DEFAULT_S3_KEY_PREFIX;
    const body = trimmed.replace(/\/+$/, '');
    if (!body || !(0, path_safety_1.isSafeStorageKey)(body) || body.split('/').some(s => s === '' || s === '.'))
        return null;
    return `${body}/`;
}
//# sourceMappingURL=s3-key-prefix.js.map