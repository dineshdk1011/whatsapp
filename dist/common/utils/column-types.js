"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateColumnType = exports.jsonColumnType = void 0;
const isPostgres = () => process.env.DATABASE_TYPE === 'postgres';
const jsonColumnType = () => 'simple-json';
exports.jsonColumnType = jsonColumnType;
const dateColumnType = () => (isPostgres() ? 'timestamp' : 'text');
exports.dateColumnType = dateColumnType;
//# sourceMappingURL=column-types.js.map