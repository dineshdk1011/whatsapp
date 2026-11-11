"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairSqliteMessageFts1791600000000 = void 0;
const sqlite_message_fts_1 = require("../sqlite-message-fts");
class RepairSqliteMessageFts1791600000000 {
    name = 'RepairSqliteMessageFts1791600000000';
    async up(runner) {
        if (runner.dataSource.options.type !== 'better-sqlite3')
            return;
        await (0, sqlite_message_fts_1.repairSqliteMessageFts)(runner);
    }
    async down() {
    }
}
exports.RepairSqliteMessageFts1791600000000 = RepairSqliteMessageFts1791600000000;
//# sourceMappingURL=1791600000000-RepairSqliteMessageFts.js.map