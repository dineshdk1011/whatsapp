"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const metrics_controller_1 = require("./metrics.controller");
const metrics_service_1 = require("./metrics.service");
const stats_module_1 = require("../stats/stats.module");
const request_metrics_interceptor_1 = require("../../common/interceptors/request-metrics.interceptor");
const request_metrics_middleware_1 = require("../../common/middleware/request-metrics.middleware");
const queueModules = [];
if (process.env.QUEUE_ENABLED === 'true') {
    const queueModule = require('../queue/queue.module');
    queueModules.push(queueModule.QueueModule);
}
let MetricsModule = class MetricsModule {
    configure(consumer) {
        consumer.apply(request_metrics_middleware_1.requestMetricsBoundaryMiddleware).forRoutes('{*splat}');
    }
};
exports.MetricsModule = MetricsModule;
exports.MetricsModule = MetricsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, stats_module_1.StatsModule, ...queueModules],
        controllers: [metrics_controller_1.MetricsController],
        providers: [
            metrics_service_1.MetricsService,
            { provide: core_1.APP_INTERCEPTOR, useClass: request_metrics_interceptor_1.RequestMetricsInterceptor },
        ],
    })
], MetricsModule);
//# sourceMappingURL=metrics.module.js.map