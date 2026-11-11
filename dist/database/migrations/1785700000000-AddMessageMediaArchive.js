"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageMediaArchive1785700000000 = void 0;
class AddMessageMediaArchive1785700000000 {
    name = 'AddMessageMediaArchive1785700000000';
    async hasColumn(queryRunner, name) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'messages' AND column_name = '${name}'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("messages")`));
        return rows.some(r => r.name === name);
    }
    async up(queryRunner) {
        if (!(await this.hasColumn(queryRunner, 'mediaPath'))) {
            await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN "mediaPath" varchar NULL`);
        }
        if (!(await this.hasColumn(queryRunner, 'mediaMimetype'))) {
            await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN "mediaMimetype" varchar NULL`);
        }
    }
    async down(queryRunner) {
        if (await this.hasColumn(queryRunner, 'mediaMimetype')) {
            await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "mediaMimetype"`);
        }
        if (await this.hasColumn(queryRunner, 'mediaPath')) {
            await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "mediaPath"`);
        }
    }
}
exports.AddMessageMediaArchive1785700000000 = AddMessageMediaArchive1785700000000;
//# sourceMappingURL=1785700000000-AddMessageMediaArchive.js.map