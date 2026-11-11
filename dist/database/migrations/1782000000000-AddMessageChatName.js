"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageChatName1782000000000 = void 0;
class AddMessageChatName1782000000000 {
    name = 'AddMessageChatName1782000000000';
    async up(queryRunner) {
        const table = await queryRunner.getTable('messages');
        const col = table?.findColumnByName('chatName');
        if (col)
            return;
        await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN "chatName" varchar NULL`);
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('messages');
        const col = table?.findColumnByName('chatName');
        if (!col)
            return;
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "chatName"`);
    }
}
exports.AddMessageChatName1782000000000 = AddMessageChatName1782000000000;
//# sourceMappingURL=1782000000000-AddMessageChatName.js.map