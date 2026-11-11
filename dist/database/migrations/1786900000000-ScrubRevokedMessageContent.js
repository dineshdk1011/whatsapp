"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrubRevokedMessageContent1786900000000 = void 0;
class ScrubRevokedMessageContent1786900000000 {
    name = 'ScrubRevokedMessageContent1786900000000';
    static async scrub(queryRunner) {
        if (!(await queryRunner.hasTable('messages')))
            return;
        await queryRunner.query(`UPDATE "messages" SET "body" = '', "metadata" = NULL, "mediaPath" = NULL, "mediaMimetype" = NULL WHERE "type" = 'revoked'`);
    }
    async up(queryRunner) {
        await ScrubRevokedMessageContent1786900000000.scrub(queryRunner);
    }
    async down() {
    }
}
exports.ScrubRevokedMessageContent1786900000000 = ScrubRevokedMessageContent1786900000000;
//# sourceMappingURL=1786900000000-ScrubRevokedMessageContent.js.map