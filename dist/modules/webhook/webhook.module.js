"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const webhook_entity_1 = require("./entities/webhook.entity");
const webhook_delivery_failure_entity_1 = require("./entities/webhook-delivery-failure.entity");
const webhook_outbox_event_entity_1 = require("./entities/webhook-outbox-event.entity");
const webhook_outbox_module_1 = require("./webhook-outbox.module");
const webhook_reconciler_service_1 = require("./webhook-reconciler.service");
const session_entity_1 = require("../session/entities/session.entity");
const webhook_service_1 = require("./webhook.service");
const webhook_delivery_service_1 = require("./webhook-delivery.service");
const webhook_redrive_service_1 = require("./webhook-redrive.service");
const webhook_controller_1 = require("./webhook.controller");
const webhooks_list_controller_1 = require("./webhooks-list.controller");
const engine_module_1 = require("../../engine/engine.module");
const queueModules = [];
if (process.env.QUEUE_ENABLED === 'true') {
    const queueModule = require('../queue/queue.module');
    queueModules.push(queueModule.QueueModule);
}
let WebhookModule = class WebhookModule {
};
exports.WebhookModule = WebhookModule;
exports.WebhookModule = WebhookModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([webhook_entity_1.Webhook, webhook_delivery_failure_entity_1.WebhookDeliveryFailure, webhook_outbox_event_entity_1.WebhookOutboxEvent, session_entity_1.Session], 'data'),
            webhook_outbox_module_1.WebhookOutboxModule,
            engine_module_1.EngineModule,
            ...queueModules,
        ],
        controllers: [webhook_controller_1.WebhookController, webhooks_list_controller_1.WebhooksListController],
        providers: [webhook_service_1.WebhookService, webhook_delivery_service_1.WebhookDeliveryService, webhook_reconciler_service_1.WebhookReconcilerService, webhook_redrive_service_1.WebhookRedriveService],
        exports: [webhook_service_1.WebhookService],
    })
], WebhookModule);
//# sourceMappingURL=webhook.module.js.map