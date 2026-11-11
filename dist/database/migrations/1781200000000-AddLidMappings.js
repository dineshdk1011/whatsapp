"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLidMappings1781200000000 = void 0;
class AddLidMappings1781200000000 {
    name = 'AddLidMappings1781200000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('lid_mappings'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "lid_mappings" ("lid" varchar PRIMARY KEY NOT NULL, "phone" varchar, "sessionId" varchar, "updatedAt" timestamp NOT NULL DEFAULT NOW())`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "lid_mappings" ("lid" varchar PRIMARY KEY NOT NULL, "phone" varchar, "sessionId" varchar, "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_lid_mappings_phone" ON "lid_mappings" ("phone")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lid_mappings_phone"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "lid_mappings"`);
    }
}
exports.AddLidMappings1781200000000 = AddLidMappings1781200000000;
//# sourceMappingURL=1781200000000-AddLidMappings.js.map