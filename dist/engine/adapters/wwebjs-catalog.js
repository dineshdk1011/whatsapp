"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsCatalog = void 0;
const engine_not_supported_error_1 = require("../../common/errors/engine-not-supported.error");
class WwebjsCatalog {
    host;
    constructor(host) {
        this.host = host;
    }
    async getCatalog() {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('getCatalog');
    }
    async getProducts(_options) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('getProducts');
    }
    async getProduct(_productId) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('getProduct');
    }
    async sendProduct(_chatId, _productId, _body) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('sendProduct');
    }
    async sendCatalog(_chatId, _body) {
        this.host.ensureReady();
        throw new engine_not_supported_error_1.EngineNotSupportedError('sendCatalog');
    }
}
exports.WwebjsCatalog = WwebjsCatalog;
//# sourceMappingURL=wwebjs-catalog.js.map