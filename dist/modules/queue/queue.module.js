"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = exports.WEBHOOK_QUEUE_JOB_OPTIONS = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_1 = require("@bull-board/nestjs");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_1 = require("@bull-board/express");
const typeorm_1 = require("@nestjs/typeorm");
const webhook_processor_1 = require("./processors/webhook.processor");
const ingress_processor_1 = require("./processors/ingress.processor");
const queue_names_1 = require("./queue-names");
const redis_connection_1 = require("./redis-connection");
const shutdown_safe_queue_1 = require("./shutdown-safe-queue");
const webhook_entity_1 = require("../webhook/entities/webhook.entity");
const webhook_outbox_module_1 = require("../webhook/webhook-outbox.module");
const webhook_delivery_failure_entity_1 = require("../webhook/entities/webhook-delivery-failure.entity");
const integration_delivery_failure_entity_1 = require("../integration/entities/integration-delivery-failure.entity");
const ingress_event_entity_1 = require("../integration/entities/ingress-event.entity");
const hooks_module_1 = require("../../core/hooks/hooks.module");
const plugins_module_1 = require("../../core/plugins/plugins.module");
exports.WEBHOOK_QUEUE_JOB_OPTIONS = {
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400, count: 5000 },
};
bullmq_1.BullModule.queueClass = shutdown_safe_queue_1.ShutdownSafeQueue;
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([webhook_entity_1.Webhook, webhook_delivery_failure_entity_1.WebhookDeliveryFailure, integration_delivery_failure_entity_1.IntegrationDeliveryFailure, ingress_event_entity_1.IngressEvent], 'data'),
            webhook_outbox_module_1.WebhookOutboxModule,
            hooks_module_1.HooksModule,
            plugins_module_1.PluginsModule,
            bullmq_1.BullModule.forRootAsync({
                useFactory: redis_connection_1.queueRootOptions,
            }),
            bullmq_1.BullModule.registerQueue({
                name: queue_names_1.QUEUE_NAMES.WEBHOOK,
                defaultJobOptions: exports.WEBHOOK_QUEUE_JOB_OPTIONS,
            }),
            bullmq_1.BullModule.registerQueue({
                name: queue_names_1.QUEUE_NAMES.INGRESS,
                defaultJobOptions: {
                    removeOnComplete: { age: 3600, count: 1000 },
                    removeOnFail: { age: 86400, count: 5000 },
                },
            }),
            nestjs_1.BullBoardModule.forRoot({
                route: '/admin/queues',
                adapter: express_1.ExpressAdapter,
            }),
            nestjs_1.BullBoardModule.forFeature({
                name: queue_names_1.QUEUE_NAMES.WEBHOOK,
                adapter: bullMQAdapter_1.BullMQAdapter,
            }),
            nestjs_1.BullBoardModule.forFeature({
                name: queue_names_1.QUEUE_NAMES.INGRESS,
                adapter: bullMQAdapter_1.BullMQAdapter,
            }),
        ],
        providers: [webhook_processor_1.WebhookProcessor, ingress_processor_1.IngressProcessor],
        exports: [bullmq_1.BullModule],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map