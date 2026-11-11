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
exports.IngressUrl = void 0;
exports.buildIngressUrls = buildIngressUrls;
const swagger_1 = require("@nestjs/swagger");
class IngressUrl {
    route;
    url;
}
exports.IngressUrl = IngressUrl;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin-declared route segment the provider posts to.' }),
    __metadata("design:type", String)
], IngressUrl.prototype, "route", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full ingress URL (BASE_URL + plugin/instance/route), or a relative path when BASE_URL is unset.',
    }),
    __metadata("design:type", String)
], IngressUrl.prototype, "url", void 0);
function buildIngressUrls(baseUrl, pluginId, instanceId, routes) {
    const base = (baseUrl ?? '').replace(/\/+$/, '');
    return routes.map(route => ({
        route,
        url: `${base}/api/ingress/${pluginId}/${instanceId}/${encodeURIComponent(route)}`,
    }));
}
//# sourceMappingURL=ingress-url.js.map