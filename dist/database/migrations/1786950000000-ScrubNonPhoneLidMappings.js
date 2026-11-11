"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrubNonPhoneLidMappings1786950000000 = void 0;
class ScrubNonPhoneLidMappings1786950000000 {
    name = 'ScrubNonPhoneLidMappings1786950000000';
    async up(queryRunner) {
        await ScrubNonPhoneLidMappings1786950000000.scrub(queryRunner);
    }
    static async scrub(queryRunner) {
        if (!(await queryRunner.hasTable('lid_mappings')))
            return;
        const notDigits = queryRunner.dataSource.options.type === 'postgres' ? `"phone" !~ '^[0-9]+$'` : `"phone" GLOB '*[^0-9]*'`;
        await queryRunner.query(`DELETE FROM "lid_mappings" WHERE ${notDigits} OR "phone" = ''`);
        if (!(await queryRunner.hasTable('messages')))
            return;
        await queryRunner.query(`DELETE FROM "lid_mappings" WHERE "phone" IN (SELECT DISTINCT substr("chatId", 1, length("chatId") - 10) FROM "messages" WHERE "chatId" LIKE '%@broadcast')`);
    }
    async down() {
    }
}
exports.ScrubNonPhoneLidMappings1786950000000 = ScrubNonPhoneLidMappings1786950000000;
//# sourceMappingURL=1786950000000-ScrubNonPhoneLidMappings.js.map