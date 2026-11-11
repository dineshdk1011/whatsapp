"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAutomationRules1785900000000 = void 0;
class AddAutomationRules1785900000000 {
    name = 'AddAutomationRules1785900000000';
    async up(queryRunner) {
        if (await queryRunner.hasTable('automation_rules'))
            return;
        const isPostgres = queryRunner.dataSource.options.type === 'postgres';
        if (isPostgres) {
            await queryRunner.query(`CREATE TABLE "automation_rules" ("id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::varchar, ` +
                `"sessionId" varchar NOT NULL, "name" varchar(100) NOT NULL, "enabled" boolean NOT NULL DEFAULT true, ` +
                `"conditions" text, "replyText" text NOT NULL, "cooldownSeconds" integer NOT NULL DEFAULT 60, ` +
                `"createdAt" timestamp NOT NULL DEFAULT NOW(), "updatedAt" timestamp NOT NULL DEFAULT NOW(), ` +
                `CONSTRAINT "FK_automation_rules_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE)`);
        }
        else {
            await queryRunner.query(`CREATE TABLE "automation_rules" ("id" varchar PRIMARY KEY NOT NULL, ` +
                `"sessionId" varchar NOT NULL, "name" varchar(100) NOT NULL, "enabled" boolean NOT NULL DEFAULT (1), ` +
                `"conditions" text, "replyText" text NOT NULL, "cooldownSeconds" integer NOT NULL DEFAULT (60), ` +
                `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
                `CONSTRAINT "FK_automation_rules_sessionId" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        }
        await queryRunner.query(`CREATE INDEX "IDX_automation_rules_sessionId" ON "automation_rules" ("sessionId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_automation_rules_sessionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "automation_rules"`);
    }
}
exports.AddAutomationRules1785900000000 = AddAutomationRules1785900000000;
//# sourceMappingURL=1785900000000-AddAutomationRules.js.map