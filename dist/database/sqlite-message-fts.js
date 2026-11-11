"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairSqliteMessageFts = repairSqliteMessageFts;
async function repairSqliteMessageFts(database) {
    const tables = (await database.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='messages_fts'`));
    if (tables.length === 0)
        return;
    const integrityCheck = `INSERT INTO "messages_fts"("messages_fts", "rank") VALUES ('integrity-check', 1)`;
    try {
        await database.query(integrityCheck);
    }
    catch (error) {
        const failure = error;
        if ((failure?.driverError?.code ?? failure?.code) !== 'SQLITE_CORRUPT_VTAB')
            throw error;
        await database.query(`INSERT INTO "messages_fts"("messages_fts") VALUES ('rebuild')`);
        await database.query(integrityCheck);
    }
}
//# sourceMappingURL=sqlite-message-fts.js.map