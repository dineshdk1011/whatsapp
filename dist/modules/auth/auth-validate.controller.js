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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorators_1 = require("./decorators/auth.decorators");
const api_key_entity_1 = require("./entities/api-key.entity");
const dto_1 = require("./dto");
const engine_factory_1 = require("../../engine/engine.factory");
let AuthValidateController = class AuthValidateController {
    engineFactory;
    constructor(engineFactory) {
        this.engineFactory = engineFactory;
    }
    validate(apiKey) {
        if (!apiKey) {
            return { valid: false };
        }
        return {
            valid: true,
            role: apiKey.role,
            engineType: this.engineFactory.getCurrentEngine(),
            scoped: (apiKey.allowedSessions?.length ?? 0) > 0,
        };
    }
};
exports.AuthValidateController = AuthValidateController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate an API key' }),
    (0, swagger_1.ApiHeader)({ name: 'X-API-Key', description: 'API key to validate' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key is valid', type: dto_1.ValidateApiKeyResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or missing API key' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'The key is valid but refused here: its allowedIps exclude this client, or it is restricted to selected chats',
    }),
    __param(0, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_key_entity_1.ApiKey]),
    __metadata("design:returntype", Object)
], AuthValidateController.prototype, "validate", null);
exports.AuthValidateController = AuthValidateController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [engine_factory_1.EngineFactory])
], AuthValidateController);
//# sourceMappingURL=auth-validate.controller.js.map