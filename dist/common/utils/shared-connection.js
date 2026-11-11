"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOREIGN_TRANSACTION_WAIT_MS = exports.SHARED_CONNECTION_DIALECTS = void 0;
exports.awaitNoOpenTransaction = awaitNoOpenTransaction;
const promises_1 = require("timers/promises");
exports.SHARED_CONNECTION_DIALECTS = new Set(['better-sqlite3', 'sqlite']);
exports.FOREIGN_TRANSACTION_WAIT_MS = 10_000;
async function awaitNoOpenTransaction(dataSource, boundMs = exports.FOREIGN_TRANSACTION_WAIT_MS) {
    if (!exports.SHARED_CONNECTION_DIALECTS.has(dataSource.options.type))
        return true;
    const connection = dataSource.driver
        ?.databaseConnection;
    if (typeof connection?.inTransaction !== 'boolean')
        return true;
    const settleBy = Date.now() + boundMs;
    await (0, promises_1.setImmediate)();
    while (connection.inTransaction) {
        if (Date.now() >= settleBy)
            return false;
        await (0, promises_1.setTimeout)(5);
    }
    return true;
}
//# sourceMappingURL=shared-connection.js.map