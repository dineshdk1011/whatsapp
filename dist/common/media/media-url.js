"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsMediaUrl = exports.isMediaUrl = exports.MEDIA_URL_MESSAGE = void 0;
const class_validator_1 = require("class-validator");
const HTTP_URL_PREFIX = /^https?:\/\//i;
exports.MEDIA_URL_MESSAGE = 'url must be an absolute http(s) URL';
const isMediaUrl = (value) => {
    if (typeof value !== 'string' || !HTTP_URL_PREFIX.test(value))
        return false;
    try {
        return new URL(value).hostname !== '';
    }
    catch {
        return false;
    }
};
exports.isMediaUrl = isMediaUrl;
const IsMediaUrl = (options = {}) => (0, class_validator_1.ValidateBy)({
    name: 'isMediaUrl',
    validator: {
        validate: (value, args) => (args !== undefined && options.ignoreWhen?.(args.object) === true) || (0, exports.isMediaUrl)(value),
        defaultMessage: () => exports.MEDIA_URL_MESSAGE,
    },
});
exports.IsMediaUrl = IsMediaUrl;
//# sourceMappingURL=media-url.js.map