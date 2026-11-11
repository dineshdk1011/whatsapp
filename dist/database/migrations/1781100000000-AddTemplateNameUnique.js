"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTemplateNameUnique1781100000000 = void 0;
class AddTemplateNameUnique1781100000000 {
    name = 'AddTemplateNameUnique1781100000000';
    async up(queryRunner) {
        if (queryRunner.dataSource.options.type === 'postgres') {
            await queryRunner.query('SET LOCAL statement_timeout = 0');
        }
        if (!(await queryRunner.hasTable('templates')))
            return;
        await queryRunner.query(`UPDATE "templates" SET "name" = substr("name", 1, 59) || '-dup-' || "id" ` +
            `WHERE "id" <> (` +
            `SELECT t2."id" FROM "templates" t2 ` +
            `WHERE t2."sessionId" = "templates"."sessionId" AND t2."name" = "templates"."name" ` +
            `ORDER BY t2."createdAt" ASC, t2."id" ASC LIMIT 1)`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_templates_session_name" ON "templates" ("sessionId", "name")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_templates_session_name"`);
    }
}
exports.AddTemplateNameUnique1781100000000 = AddTemplateNameUnique1781100000000;
//# sourceMappingURL=1781100000000-AddTemplateNameUnique.js.map