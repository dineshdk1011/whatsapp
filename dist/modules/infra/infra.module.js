"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraModule = void 0;
const common_1 = require("@nestjs/common");
const infra_status_controller_1 = require("./infra-status.controller");
const infra_config_controller_1 = require("./infra-config.controller");
const infra_data_controller_1 = require("./infra-data.controller");
const infra_data_service_1 = require("./infra-data.service");
const infra_storage_controller_1 = require("./infra-storage.controller");
const engine_module_1 = require("../../engine/engine.module");
const docker_1 = require("../docker");
const session_module_1 = require("../session/session.module");
const queueModules = [];
if (process.env.QUEUE_ENABLED === 'true') {
    const queueModule = require('../queue/queue.module');
    queueModules.push(queueModule.QueueModule);
}
let InfraModule = class InfraModule {
};
exports.InfraModule = InfraModule;
exports.InfraModule = InfraModule = __decorate([
    (0, common_1.Module)({
        imports: [engine_module_1.EngineModule, docker_1.DockerModule, session_module_1.SessionModule, ...queueModules],
        controllers: [infra_status_controller_1.InfraStatusController, infra_config_controller_1.InfraConfigController, infra_data_controller_1.InfraDataController, infra_storage_controller_1.InfraStorageController],
        providers: [infra_data_service_1.InfraDataService],
    })
], InfraModule);
//# sourceMappingURL=infra.module.js.map