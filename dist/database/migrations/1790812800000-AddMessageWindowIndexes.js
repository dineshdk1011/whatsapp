"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageWindowIndexes1790812800000 = void 0;
const indexes = [
    ['IDX_messages_session_timestamp_id', '"sessionId", "timestamp", "id"'],
    ['IDX_messages_session_chat_timestamp_id', '"sessionId", "chatId", "timestamp", "id"'],
    ['IDX_messages_session_direction_timestamp_id', '"sessionId", "direction", "timestamp", "id"'],
];
class AddMessageWindowIndexes1790812800000 {
    name = 'AddMessageWindowIndexes1790812800000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres')
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        for (const [name, columns] of indexes) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${name}" ON "messages" (${columns})`);
        }
    }
    async down(queryRunner) {
        for (const [name] of indexes)
            await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
}
exports.AddMessageWindowIndexes1790812800000 = AddMessageWindowIndexes1790812800000;
//# sourceMappingURL=1790812800000-AddMessageWindowIndexes.js.map