"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
exports.bootstrapSearchProviders = bootstrapSearchProviders;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_controller_1 = require("./search.controller");
const search_service_1 = require("./search.service");
const search_provider_registry_1 = require("./search-provider.registry");
const builtin_fts_provider_1 = require("./providers/builtin-fts.provider");
const plugin_host_ports_1 = require("../../core/plugins/plugin-host-ports");
function bootstrapSearchProviders(registry, builtin, cfg) {
    const provider = cfg.get('search.provider', 'auto');
    if (provider === 'none')
        return registry;
    registry.register(builtin);
    if (provider === 'builtin-fts') {
        registry.setActive('builtin-fts');
    }
    return registry;
}
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [search_controller_1.SearchController],
        providers: [
            search_provider_registry_1.SearchProviderRegistry,
            search_service_1.SearchService,
            builtin_fts_provider_1.BuiltInFtsProvider,
            {
                provide: 'SEARCH_BOOTSTRAP',
                inject: [search_provider_registry_1.SearchProviderRegistry, builtin_fts_provider_1.BuiltInFtsProvider, config_1.ConfigService],
                useFactory: bootstrapSearchProviders,
            },
            { provide: plugin_host_ports_1.PLUGIN_SEARCH_REGISTRY_PORT, useExisting: search_provider_registry_1.SearchProviderRegistry },
        ],
        exports: [search_service_1.SearchService],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map