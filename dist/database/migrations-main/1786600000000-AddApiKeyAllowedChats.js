"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApiKeyAllowedChats1786600000000 = void 0;
class AddApiKeyAllowedChats1786600000000 {
    name = 'AddApiKeyAllowedChats1786600000000';
    async hasColumn(queryRunner, name) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'api_keys' AND column_name = '${name}'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("api_keys")`));
        return rows.some(r => r.name === name);
    }
    async up(queryRunner) {
        if (!(await this.hasColumn(queryRunner, 'allowedChats'))) {
            await queryRunner.query(`ALTER TABLE "api_keys" ADD COLUMN "allowedChats" text NULL`);
        }
    }
    async down(queryRunner) {
        if (await this.hasColumn(queryRunner, 'allowedChats')) {
            await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN "allowedChats"`);
        }
    }
}
exports.AddApiKeyAllowedChats1786600000000 = AddApiKeyAllowedChats1786600000000;
//# sourceMappingURL=1786600000000-AddApiKeyAllowedChats.js.map