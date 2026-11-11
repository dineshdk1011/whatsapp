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
exports.ToolRegistryService = void 0;
const common_1 = require("@nestjs/common");
let ToolRegistryService = class ToolRegistryService {
    byName = new Map();
    constructor(tools) {
        for (const t of tools) {
            if (this.byName.has(t.name)) {
                throw new Error(`Duplicate agent tool name: ${t.name}`);
            }
            this.byName.set(t.name, t);
        }
    }
    list(opts = {}) {
        const all = [...this.byName.values()];
        return opts.readOnly ? all.filter(t => t.tier === 'read') : all;
    }
    get(name) {
        return this.byName.get(name);
    }
};
exports.ToolRegistryService = ToolRegistryService;
exports.ToolRegistryService = ToolRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Array])
], ToolRegistryService);
//# sourceMappingURL=tool-registry.service.js.map