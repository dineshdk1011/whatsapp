"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const engine_factory_1 = require("./engine.factory");
const baileys_stored_message_entity_1 = require("./adapters/baileys-stored-message.entity");
const baileys_message_store_service_1 = require("./adapters/baileys-message-store.service");
const lid_mapping_entity_1 = require("./identity/lid-mapping.entity");
const lid_mapping_store_service_1 = require("./identity/lid-mapping-store.service");
const baileys_chat_state_entity_1 = require("./adapters/baileys-chat-state.entity");
const baileys_chat_state_store_service_1 = require("./adapters/baileys-chat-state-store.service");
const engine_registry_service_1 = require("./engine-registry.service");
let EngineModule = class EngineModule {
};
exports.EngineModule = EngineModule;
exports.EngineModule = EngineModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([baileys_stored_message_entity_1.BaileysStoredMessage, lid_mapping_entity_1.LidMapping, baileys_chat_state_entity_1.ChatState], 'data')],
        providers: [engine_factory_1.EngineFactory, baileys_message_store_service_1.BaileysMessageStoreService, lid_mapping_store_service_1.LidMappingStoreService, baileys_chat_state_store_service_1.ChatStateStoreService, engine_registry_service_1.EngineRegistry],
        exports: [engine_factory_1.EngineFactory, lid_mapping_store_service_1.LidMappingStoreService, baileys_chat_state_store_service_1.ChatStateStoreService, engine_registry_service_1.EngineRegistry],
    })
], EngineModule);
//# sourceMappingURL=engine.module.js.map