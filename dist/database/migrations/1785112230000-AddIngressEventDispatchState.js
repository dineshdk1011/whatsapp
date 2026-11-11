"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIngressEventDispatchState1785112230000 = void 0;
class AddIngressEventDispatchState1785112230000 {
    name = 'AddIngressEventDispatchState1785112230000';
    async hasColumn(queryRunner, name) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'ingress_events' AND column_name = '${name}'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("ingress_events")`));
        return rows.some(r => r.name === name);
    }
    async up(queryRunner) {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const ts = isPostgres ? 'timestamp' : 'datetime';
        if (!(await this.hasColumn(queryRunner, 'dispatchState'))) {
            await queryRunner.query(`ALTER TABLE "ingress_events" ADD COLUMN "dispatchState" varchar NULL`);
            await queryRunner.query(`UPDATE "ingress_events" SET "dispatchState" = 'dispatched' WHERE "dispatchState" IS NULL`);
        }
        if (!(await this.hasColumn(queryRunner, 'dispatchAttempts'))) {
            await queryRunner.query(`ALTER TABLE "ingress_events" ADD COLUMN "dispatchAttempts" integer NOT NULL DEFAULT 0`);
        }
        if (!(await this.hasColumn(queryRunner, 'lastDispatchAt'))) {
            await queryRunner.query(`ALTER TABLE "ingress_events" ADD COLUMN "lastDispatchAt" ${ts} NULL`);
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ingress_events_dispatchState" ON "ingress_events" ("dispatchState", "createdAt")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ingress_events_dispatchState"`);
        if (await this.hasColumn(queryRunner, 'lastDispatchAt')) {
            await queryRunner.query(`ALTER TABLE "ingress_events" DROP COLUMN "lastDispatchAt"`);
        }
        if (await this.hasColumn(queryRunner, 'dispatchAttempts')) {
            await queryRunner.query(`ALTER TABLE "ingress_events" DROP COLUMN "dispatchAttempts"`);
        }
        if (await this.hasColumn(queryRunner, 'dispatchState')) {
            await queryRunner.query(`ALTER TABLE "ingress_events" DROP COLUMN "dispatchState"`);
        }
    }
}
exports.AddIngressEventDispatchState1785112230000 = AddIngressEventDispatchState1785112230000;
//# sourceMappingURL=1785112230000-AddIngressEventDispatchState.js.map