"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSessionOwnership1785800000000 = void 0;
class AddSessionOwnership1785800000000 {
    name = 'AddSessionOwnership1785800000000';
    async hasColumn(queryRunner, name) {
        if (queryRunner.connection.options.type === 'postgres') {
            const rows = (await queryRunner.query(`SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'sessions' AND column_name = '${name}'`));
            return rows.length > 0;
        }
        const rows = (await queryRunner.query(`PRAGMA table_info("sessions")`));
        return rows.some(r => r.name === name);
    }
    async up(queryRunner) {
        const timestamp = queryRunner.connection.options.type === 'postgres' ? 'TIMESTAMP' : 'datetime';
        if (!(await this.hasColumn(queryRunner, 'nodeId'))) {
            await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "nodeId" varchar(190) NULL`);
        }
        if (!(await this.hasColumn(queryRunner, 'claimedAt'))) {
            await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "claimedAt" ${timestamp} NULL`);
        }
        if (!(await this.hasColumn(queryRunner, 'leaseExpiresAt'))) {
            await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "leaseExpiresAt" ${timestamp} NULL`);
        }
    }
    async down(queryRunner) {
        for (const column of ['leaseExpiresAt', 'claimedAt', 'nodeId']) {
            if (await this.hasColumn(queryRunner, column)) {
                await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "${column}"`);
            }
        }
    }
}
exports.AddSessionOwnership1785800000000 = AddSessionOwnership1785800000000;
//# sourceMappingURL=1785800000000-AddSessionOwnership.js.map