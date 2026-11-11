"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropRedundantMessagesSessionIdIndex1781600000000 = void 0;
class DropRedundantMessagesSessionIdIndex1781600000000 {
    name = 'DropRedundantMessagesSessionIdIndex1781600000000';
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_066163c46cda7e8187f96bc87a"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_066163c46cda7e8187f96bc87a" ON "messages" ("sessionId")`);
    }
}
exports.DropRedundantMessagesSessionIdIndex1781600000000 = DropRedundantMessagesSessionIdIndex1781600000000;
//# sourceMappingURL=1781600000000-DropRedundantMessagesSessionIdIndex.js.map