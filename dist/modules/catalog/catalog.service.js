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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const send_pacing_service_1 = require("../message/send-pacing.service");
const hooks_1 = require("../../core/hooks");
let CatalogService = class CatalogService {
    engines;
    pacing;
    hookManager;
    constructor(engines, pacing, hookManager) {
        this.engines = engines;
        this.pacing = pacing;
        this.hookManager = hookManager;
    }
    async getCatalog(sessionId) {
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        return engine.getCatalog();
    }
    async getProducts(sessionId, page = 1, limit = 20) {
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        return engine.getProducts({ page, limit });
    }
    async getProduct(sessionId, productId) {
        const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
        return engine.getProduct(productId);
    }
    async sendProduct(sessionId, chatId, productId, body) {
        const settle = await this.pacing.assertSendAllowed(sessionId, chatId, { untilSettled: true });
        let engineAsked = false;
        try {
            const gated = await (0, hooks_1.applySendingGate)(this.hookManager, sessionId, 'product', { chatId, productId, body: body ?? undefined }, 'CatalogService');
            const gatedProductId = gated.productId;
            const gatedBody = gated.body;
            if (typeof gatedProductId !== 'string' || gatedProductId === '') {
                throw new common_1.BadRequestException('A message:sending handler returned an invalid productId');
            }
            if (gatedBody !== undefined && typeof gatedBody !== 'string') {
                throw new common_1.BadRequestException('A message:sending handler returned an invalid body');
            }
            const engine = this.engines.require(sessionId, () => new common_1.NotFoundException(`Session ${sessionId} not found or not connected`));
            engineAsked = true;
            const result = await this.recordedSend(sessionId, () => engine.sendProduct(chatId, gatedProductId, gatedBody));
            settle?.(true);
            return result;
        }
        catch (error) {
            settle?.(engineAsked && !(0, send_pacing_service_1.sentNothing)(error));
            throw error;
        }
    }
    async recordedSend(sessionId, send) {
        try {
            const result = await send();
            this.pacing.recordSendSuccess(sessionId);
            return result;
        }
        catch (error) {
            if ((0, send_pacing_service_1.countsTowardSendBreaker)(error)) {
                this.pacing.recordSendFailure(sessionId);
            }
            throw error;
        }
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry,
        send_pacing_service_1.SendPacingService,
        hooks_1.HookManager])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map