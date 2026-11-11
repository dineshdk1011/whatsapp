"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTemplates1779840000000 = void 0;
class AddTemplates1779840000000 {
    name = 'AddTemplates1779840000000';
    async up(queryRunner) {
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        const exists = await queryRunner.hasTable('templates');
        if (exists)
            return;
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "templates" ("id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar, "sessionId" varchar NOT NULL, "name" varchar(100) NOT NULL, "body" text NOT NULL, "header" text, "footer" text, "createdAt" timestamp NOT NULL DEFAULT NOW(), "updatedAt" timestamp NOT NULL DEFAULT NOW(), CONSTRAINT "FK_templates_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "templates" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "name" varchar(100) NOT NULL, "body" text NOT NULL, "header" text, "footer" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_templates_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_templates_sessionId" ON "templates" ("sessionId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_templates_sessionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
    }
}
exports.AddTemplates1779840000000 = AddTemplates1779840000000;
//# sourceMappingURL=1779840000000-AddTemplates.js.map