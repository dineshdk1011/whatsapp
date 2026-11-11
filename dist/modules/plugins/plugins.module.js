"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsApiModule = void 0;
const common_1 = require("@nestjs/common");
const plugins_controller_1 = require("./plugins.controller");
const plugins_service_1 = require("./plugins.service");
let PluginsApiModule = class PluginsApiModule {
};
exports.PluginsApiModule = PluginsApiModule;
exports.PluginsApiModule = PluginsApiModule = __decorate([
    (0, common_1.Module)({
        controllers: [plugins_controller_1.PluginsController],
        providers: [plugins_service_1.PluginsService],
        exports: [plugins_service_1.PluginsService],
    })
], PluginsApiModule);
//# sourceMappingURL=plugins.module.js.map