"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeBatchIdUniqueToSession1781800000000 = void 0;
const typeorm_1 = require("typeorm");
class ScopeBatchIdUniqueToSession1781800000000 {
    name = 'ScopeBatchIdUniqueToSession1781800000000';
    static TABLE = 'message_batches';
    static COMPOSITE = 'UQ_message_batches_session_id_batch_id';
    static GLOBAL = 'UQ_ff274470c0dbaff6c7d1f9795f5';
    isGlobal(u) {
        return u.columnNames.length === 1 && u.columnNames[0] === 'batch_id';
    }
    isComposite(u) {
        return u.columnNames.length === 2 && u.columnNames.includes('session_id') && u.columnNames.includes('batch_id');
    }
    async up(queryRunner) {
        const table = await queryRunner.getTable(ScopeBatchIdUniqueToSession1781800000000.TABLE);
        if (!table)
            return;
        const global = table.uniques.find(u => this.isGlobal(u));
        if (global) {
            await queryRunner.dropUniqueConstraint(ScopeBatchIdUniqueToSession1781800000000.TABLE, global);
        }
        if (!table.uniques.some(u => this.isComposite(u))) {
            await queryRunner.createUniqueConstraint(ScopeBatchIdUniqueToSession1781800000000.TABLE, new typeorm_1.TableUnique({
                name: ScopeBatchIdUniqueToSession1781800000000.COMPOSITE,
                columnNames: ['session_id', 'batch_id'],
            }));
        }
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable(ScopeBatchIdUniqueToSession1781800000000.TABLE);
        if (!table)
            return;
        const composite = table.uniques.find(u => this.isComposite(u));
        if (composite) {
            await queryRunner.dropUniqueConstraint(ScopeBatchIdUniqueToSession1781800000000.TABLE, composite);
        }
        if (!table.uniques.some(u => this.isGlobal(u))) {
            await queryRunner.createUniqueConstraint(ScopeBatchIdUniqueToSession1781800000000.TABLE, new typeorm_1.TableUnique({ name: ScopeBatchIdUniqueToSession1781800000000.GLOBAL, columnNames: ['batch_id'] }));
        }
    }
}
exports.ScopeBatchIdUniqueToSession1781800000000 = ScopeBatchIdUniqueToSession1781800000000;
//# sourceMappingURL=1781800000000-ScopeBatchIdUniqueToSession.js.map