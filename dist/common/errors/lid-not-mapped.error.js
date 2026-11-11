"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LidNotMappedError = void 0;
class LidNotMappedError extends Error {
    constructor(lid) {
        super(`lid ${lid} is not mapped in this session`);
        this.name = 'LidNotMappedError';
    }
}
exports.LidNotMappedError = LidNotMappedError;
//# sourceMappingURL=lid-not-mapped.error.js.map