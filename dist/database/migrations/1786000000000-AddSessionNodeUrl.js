"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSessionNodeUrl1786000000000 = void 0;
class AddSessionNodeUrl1786000000000 {
    name = 'AddSessionNodeUrl1786000000000';
    async up(queryRunner) {
        if (await queryRunner.hasColumn('sessions', 'nodeUrl'))
            return;
        await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "nodeUrl" varchar(2048)`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('sessions', 'nodeUrl')))
            return;
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "nodeUrl"`);
    }
}
exports.AddSessionNodeUrl1786000000000 = AddSessionNodeUrl1786000000000;
//# sourceMappingURL=1786000000000-AddSessionNodeUrl.js.map