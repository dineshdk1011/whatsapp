"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatStateDeletedAt1791700000000 = void 0;
class AddChatStateDeletedAt1791700000000 {
    name = 'AddChatStateDeletedAt1791700000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('chat_states')) || (await queryRunner.hasColumn('chat_states', 'deletedAt'))) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "chat_states" ADD COLUMN "deletedAt" bigint`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('chat_states', 'deletedAt')))
            return;
        await queryRunner.query(`DELETE FROM "chat_states" WHERE "deletedAt" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_states" DROP COLUMN "deletedAt"`);
    }
}
exports.AddChatStateDeletedAt1791700000000 = AddChatStateDeletedAt1791700000000;
//# sourceMappingURL=1791700000000-AddChatStateDeletedAt.js.map