"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatStateObserved1786650000000 = void 0;
class AddChatStateObserved1786650000000 {
    name = 'AddChatStateObserved1786650000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('chat_states')) || (await queryRunner.hasColumn('chat_states', 'observed'))) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "chat_states" ADD COLUMN "observed" varchar`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('chat_states', 'observed')))
            return;
        await queryRunner.query(`ALTER TABLE "chat_states" DROP COLUMN "observed"`);
    }
}
exports.AddChatStateObserved1786650000000 = AddChatStateObserved1786650000000;
//# sourceMappingURL=1786650000000-AddChatStateObserved.js.map