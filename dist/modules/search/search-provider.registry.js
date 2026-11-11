"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
let SearchProviderRegistry = class SearchProviderRegistry {
    providers = new Map();
    activeId = null;
    register(provider) {
        this.providers.set(provider.id, provider);
        if (this.activeId === null)
            this.activeId = provider.id;
    }
    unregister(id) {
        this.providers.delete(id);
        if (this.activeId === id) {
            this.activeId = Array.from(this.providers.keys())[0] ?? null;
        }
    }
    setActive(id) {
        if (!this.providers.has(id))
            throw new Error(`unknown search provider: ${id}`);
        this.activeId = id;
    }
    active() {
        return this.activeId === null ? null : (this.providers.get(this.activeId) ?? null);
    }
    list() {
        return [...this.providers.values()];
    }
};
exports.SearchProviderRegistry = SearchProviderRegistry;
exports.SearchProviderRegistry = SearchProviderRegistry = __decorate([
    (0, common_1.Injectable)()
], SearchProviderRegistry);
//# sourceMappingURL=search-provider.registry.js.map