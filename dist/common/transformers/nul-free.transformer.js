"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NulFreeTransformer = void 0;
exports.NulFreeTransformer = {
    to: (value) => (typeof value === 'string' ? value.replaceAll('\u0000', '') : value),
    from: (value) => value,
};
//# sourceMappingURL=nul-free.transformer.js.map