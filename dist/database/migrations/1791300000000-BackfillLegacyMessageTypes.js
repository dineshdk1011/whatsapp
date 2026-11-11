"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackfillLegacyMessageTypes1791300000000 = void 0;
class BackfillLegacyMessageTypes1791300000000 {
    name = 'BackfillLegacyMessageTypes1791300000000';
    static async backfill(queryRunner) {
        if (!(await queryRunner.hasTable('messages')))
            return;
        await queryRunner.query(`UPDATE "messages" SET "type" = CASE "type" ` +
            `WHEN 'chat' THEN 'text' WHEN 'buttons_response' THEN 'text' WHEN 'list_response' THEN 'text' ` +
            `WHEN 'template_button_reply' THEN 'text' WHEN 'ptt' THEN 'voice' ` +
            `WHEN 'vcard' THEN 'contact' WHEN 'multi_vcard' THEN 'contact' END ` +
            `WHERE "type" IN ('chat', 'buttons_response', 'list_response', 'template_button_reply', 'ptt', 'vcard', 'multi_vcard')`);
    }
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        await BackfillLegacyMessageTypes1791300000000.backfill(queryRunner);
    }
    async down() {
    }
}
exports.BackfillLegacyMessageTypes1791300000000 = BackfillLegacyMessageTypes1791300000000;
//# sourceMappingURL=1791300000000-BackfillLegacyMessageTypes.js.map