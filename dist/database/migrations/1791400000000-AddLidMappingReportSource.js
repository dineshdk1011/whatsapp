"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLidMappingReportSource1791400000000 = void 0;
class AddLidMappingReportSource1791400000000 {
    name = 'AddLidMappingReportSource1791400000000';
    async up(runner) {
        if (!(await runner.hasTable('lid_mappings')) || (await runner.hasColumn('lid_mappings', 'isReported')))
            return;
        const initial = runner.dataSource.options.type === 'postgres' ? 'false' : '0';
        await runner.query(`ALTER TABLE "lid_mappings" ADD COLUMN "isReported" boolean NOT NULL DEFAULT ${initial}`);
    }
    async down(runner) {
        if (!(await runner.hasTable('lid_mappings')) || !(await runner.hasColumn('lid_mappings', 'isReported')))
            return;
        await runner.query(`UPDATE "lid_mappings" SET "phone" = NULL, "sessionId" = NULL WHERE "isReported" = false AND "phone" IS NOT NULL`);
        await runner.dropColumn('lid_mappings', 'isReported');
    }
}
exports.AddLidMappingReportSource1791400000000 = AddLidMappingReportSource1791400000000;
//# sourceMappingURL=1791400000000-AddLidMappingReportSource.js.map