"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookFilters1781500000000 = void 0;
class AddWebhookFilters1781500000000 {
    name = 'AddWebhookFilters1781500000000';
    async up(queryRunner) {
        if (await queryRunner.hasColumn('webhooks', 'filters'))
            return;
        await queryRunner.query(`ALTER TABLE "webhooks" ADD COLUMN "filters" text`);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasColumn('webhooks', 'filters')))
            return;
        await queryRunner.query(`ALTER TABLE "webhooks" DROP COLUMN "filters"`);
    }
}
exports.AddWebhookFilters1781500000000 = AddWebhookFilters1781500000000;
//# sourceMappingURL=1781500000000-AddWebhookFilters.js.map