"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReKeyChatStatesBySessionId1786500000000 = void 0;
class ReKeyChatStatesBySessionId1786500000000 {
    name = 'ReKeyChatStatesBySessionId1786500000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('chat_states')))
            return;
        await queryRunner.query(ReKeyChatStatesBySessionId1786500000000.rekey('name', 'id', { skipAlreadyKeyed: true }));
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasTable('chat_states')))
            return;
        await queryRunner.query(ReKeyChatStatesBySessionId1786500000000.rekey('id', 'name'));
    }
    static rekey(from, to, opts = {}) {
        const col = (alias, name) => opts.skipAlreadyKeyed ? `CAST(${alias}."${name}" AS varchar)` : `${alias}."${name}"`;
        const target = `(SELECT ${col('s', to)} FROM sessions s WHERE ${col('s', from)} = chat_states."sessionId")`;
        const alreadyKeyed = opts.skipAlreadyKeyed
            ? `
        AND NOT EXISTS (SELECT 1 FROM sessions s2 WHERE ${col('s2', to)} = chat_states."sessionId")`
            : '';
        return `UPDATE chat_states SET "sessionId" = ${target}
      WHERE EXISTS (SELECT 1 FROM sessions s WHERE ${col('s', from)} = chat_states."sessionId")
        AND NOT EXISTS (
          SELECT 1 FROM chat_states c WHERE c."chatId" = chat_states."chatId" AND c."sessionId" = ${target}
        )${alreadyKeyed}`;
    }
}
exports.ReKeyChatStatesBySessionId1786500000000 = ReKeyChatStatesBySessionId1786500000000;
//# sourceMappingURL=1786500000000-ReKeyChatStatesBySessionId.js.map