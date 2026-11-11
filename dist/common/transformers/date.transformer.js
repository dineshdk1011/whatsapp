"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTransformer = void 0;
exports.DateTransformer = {
    from: (value) => {
        if (!value)
            return null;
        if (value instanceof Date)
            return value;
        return new Date(value);
    },
    to: (value) => {
        if (!value)
            return null;
        if (value instanceof Date) {
            return process.env.DATABASE_TYPE === 'postgres' ? value : value.toISOString();
        }
        return value;
    },
};
//# sourceMappingURL=date.transformer.js.map