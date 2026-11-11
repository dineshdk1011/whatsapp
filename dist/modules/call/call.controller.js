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
exports.CallController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const call_response_dto_1 = require("./dto/call-response.dto");
const create_call_link_dto_1 = require("./dto/create-call-link.dto");
const call_link_response_dto_1 = require("./dto/call-link-response.dto");
const call_service_1 = require("./call.service");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let CallController = class CallController {
    callService;
    constructor(callService) {
        this.callService = callService;
    }
    async createLink(sessionId, dto) {
        const link = await this.callService.createCallLink(sessionId, dto.type, dto.startTime);
        return { link };
    }
    async reject(sessionId, callId) {
        await this.callService.rejectCall(sessionId, callId);
        return { success: true };
    }
};
exports.CallController = CallController;
__decorate([
    (0, common_1.Post)('link'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a shareable WhatsApp call link' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The generated link', type: call_link_response_dto_1.CallLinkResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started, or an invalid type / startTime' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'WhatsApp generated no link for this request' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_call_link_dto_1.CreateCallLinkDto]),
    __metadata("design:returntype", Promise)
], CallController.prototype, "createLink", null);
__decorate([
    (0, common_1.Post)(':callId/reject'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a ringing incoming call' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'callId', description: 'Call ID from the call.received event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Call rejected', type: call_response_dto_1.CallAckResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Call not found or no longer ringing' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'The active engine cannot reject a call (whatsapp-web.js)' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CallController.prototype, "reject", null);
exports.CallController = CallController = __decorate([
    (0, swagger_1.ApiTags)('calls'),
    (0, common_1.Controller)('sessions/:sessionId/calls'),
    __metadata("design:paramtypes", [call_service_1.CallService])
], CallController);
//# sourceMappingURL=call.controller.js.map