"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const plugin_instance_entity_1 = require("./entities/plugin-instance.entity");
const ingress_event_entity_1 = require("./entities/ingress-event.entity");
const integration_delivery_failure_entity_1 = require("./entities/integration-delivery-failure.entity");
const plugin_instance_service_1 = require("./plugin-instance.service");
const ingress_event_service_1 = require("./ingress-event.service");
const ingress_service_1 = require("./ingress.service");
const ingress_controller_1 = require("./ingress.controller");
const ingress_instance_limit_1 = require("./ingress-instance-limit");
const ingress_enqueue_service_1 = require("./ingress-enqueue.service");
const ingress_reconciler_service_1 = require("./ingress-reconciler.service");
const redrive_service_1 = require("./redrive.service");
const redrive_controller_1 = require("./redrive.controller");
const integration_retention_service_1 = require("./integration-retention.service");
const integration_instance_controller_1 = require("./integration-instance.controller");
const scope_binding_service_1 = require("./scope-binding.service");
const plugin_loader_service_1 = require("../../core/plugins/plugin-loader.service");
const plugin_host_ports_1 = require("../../core/plugins/plugin-host-ports");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const session_entity_1 = require("../session/entities/session.entity");
const logger_service_1 = require("../../common/services/logger.service");
const queueModules = [];
if (process.env.QUEUE_ENABLED === 'true') {
    const queueModule = require('../queue/queue.module');
    queueModules.push(queueModule.QueueModule);
}
let IntegrationModule = class IntegrationModule {
};
exports.IntegrationModule = IntegrationModule;
exports.IntegrationModule = IntegrationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([plugin_instance_entity_1.PluginInstance, ingress_event_entity_1.IngressEvent, integration_delivery_failure_entity_1.IntegrationDeliveryFailure, session_entity_1.Session], 'data'),
            ...queueModules,
        ],
        controllers: [ingress_controller_1.IngressController, redrive_controller_1.RedriveController, integration_instance_controller_1.IntegrationInstanceController],
        providers: [
            plugin_instance_service_1.PluginInstanceService,
            ingress_event_service_1.IngressEventService,
            ingress_enqueue_service_1.IngressEnqueueService,
            ingress_reconciler_service_1.IngressReconcilerService,
            redrive_service_1.RedriveService,
            scope_binding_service_1.ScopeBindingService,
            integration_retention_service_1.IntegrationRetentionService,
            { provide: plugin_host_ports_1.PLUGIN_INSTANCE_PORT, useExisting: plugin_instance_service_1.PluginInstanceService },
            {
                provide: ingress_service_1.IngressService,
                inject: [
                    plugin_instance_service_1.PluginInstanceService,
                    ingress_event_service_1.IngressEventService,
                    plugin_loader_service_1.PluginLoaderService,
                    ingress_enqueue_service_1.IngressEnqueueService,
                    (0, typeorm_1.getRepositoryToken)(integration_delivery_failure_entity_1.IntegrationDeliveryFailure, 'data'),
                    engine_registry_service_1.EngineRegistry,
                    throttler_1.ThrottlerStorage,
                ],
                useFactory: (instances, events, loader, ingressEnqueue, failures, registry, throttlerStorage) => {
                    const dlqLogger = (0, logger_service_1.createLogger)('IngressEnqueue');
                    const ingressLogger = (0, logger_service_1.createLogger)('Ingress');
                    return new ingress_service_1.IngressService({
                        instances: { resolve: (pluginId, instanceId) => instances.resolve(pluginId, instanceId) },
                        manifestRoute: (pluginId, route) => loader.getPlugin(pluginId)?.manifest.ingress?.find(r => r.route === route),
                        events: { recordOrSkip: input => events.recordOrSkip(input) },
                        sessionStatus: (scope) => registry.get(scope)?.getStatus(),
                        restorePending: (pluginId) => loader.isRestorePending(pluginId),
                        deferDispatch: (pluginId) => ingressEnqueue.defersInlineDispatch(pluginId) && (0, ingress_reconciler_service_1.resolveIngressReconcilerOptions)().intervalMs > 0,
                        log: (event, meta) => ingressLogger.warn(event, meta),
                        admitInstance: (pluginId, instanceId) => (0, ingress_instance_limit_1.admitIngressInstance)(throttlerStorage, pluginId, instanceId),
                        enqueue: async (data, jobId) => {
                            const result = await ingressEnqueue.enqueue(data, jobId);
                            try {
                                await events.markDispatchOutcome({ pluginId: data.pluginId, instanceId: data.instanceId, providerDeliveryId: data.deliveryId }, result.outcome);
                            }
                            catch (err) {
                                dlqLogger.error('Failed to mark ingress dispatch outcome', err instanceof Error ? err.message : String(err), { pluginId: data.pluginId, instanceId: data.instanceId, deliveryId: data.deliveryId });
                            }
                            if (result.outcome === 'failed') {
                                try {
                                    await failures.save((0, ingress_enqueue_service_1.buildIngressDeadLetterRow)(data, result.error));
                                }
                                catch (err) {
                                    dlqLogger.error('Failed to persist ingress dead-letter row after inline dispatch failure', err instanceof Error ? err.message : String(err), { pluginId: data.pluginId, instanceId: data.instanceId, deliveryId: data.deliveryId });
                                }
                            }
                            return result;
                        },
                        now: () => Date.now(),
                    });
                },
            },
        ],
        exports: [plugin_instance_service_1.PluginInstanceService, ingress_event_service_1.IngressEventService],
    })
], IntegrationModule);
//# sourceMappingURL=integration.module.js.map