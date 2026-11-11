"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSessionDesiredState1786600000000 = void 0;
class AddSessionDesiredState1786600000000 {
    name = 'AddSessionDesiredState1786600000000';
    async up(queryRunner) {
        if (await queryRunner.hasColumn('sessions', 'desiredState'))
            return;
        await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN "desiredState" varchar(20)`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('sessions', 'desiredState')))
            return;
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "desiredState"`);
    }
}
exports.AddSessionDesiredState1786600000000 = AddSessionDesiredState1786600000000;
//# sourceMappingURL=1786600000000-AddSessionDesiredState.js.map