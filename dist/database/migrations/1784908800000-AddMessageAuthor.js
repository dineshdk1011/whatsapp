"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageAuthor1784908800000 = void 0;
class AddMessageAuthor1784908800000 {
    name = 'AddMessageAuthor1784908800000';
    async hasAuthorColumn(queryRunner) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'messages' AND column_name = 'author'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("messages")`));
        return rows.some(r => r.name === 'author');
    }
    async up(queryRunner) {
        if (await this.hasAuthorColumn(queryRunner))
            return;
        await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN "author" varchar NULL`);
    }
    async down(queryRunner) {
        if (!(await this.hasAuthorColumn(queryRunner)))
            return;
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "author"`);
    }
}
exports.AddMessageAuthor1784908800000 = AddMessageAuthor1784908800000;
//# sourceMappingURL=1784908800000-AddMessageAuthor.js.map