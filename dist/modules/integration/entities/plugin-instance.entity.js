"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginInstance = void 0;
const typeorm_1 = require("typeorm");
const column_types_1 = require("../../../common/utils/column-types");
let PluginInstance = class PluginInstance {
    id;
    pluginId;
    instanceId;
    sessionScope;
    secret;
    verifyToken;
    config;
    enabled;
    createdAt;
    updatedAt;
};
exports.PluginInstance = PluginInstance;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], PluginInstance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PluginInstance.prototype, "pluginId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PluginInstance.prototype, "instanceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PluginInstance.prototype, "sessionScope", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PluginInstance.prototype, "secret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PluginInstance.prototype, "verifyToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: (0, column_types_1.jsonColumnType)(), nullable: true }),
    __metadata("design:type", Object)
], PluginInstance.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PluginInstance.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PluginInstance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PluginInstance.prototype, "updatedAt", void 0);
exports.PluginInstance = PluginInstance = __decorate([
    (0, typeorm_1.Entity)('plugin_instances'),
    (0, typeorm_1.Index)('UQ_plugin_instances_plugin_instance', ['pluginId', 'instanceId'], { unique: true })
], PluginInstance);
//# sourceMappingURL=plugin-instance.entity.js.map