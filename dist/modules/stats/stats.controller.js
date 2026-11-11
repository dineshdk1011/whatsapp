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
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stats_response_dto_1 = require("./dto/stats-response.dto");
const stats_service_1 = require("./stats.service");
const stats_query_dto_1 = require("./dto/stats-query.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
let StatsController = class StatsController {
    statsService;
    constructor(statsService) {
        this.statsService = statsService;
    }
    async getOverview() {
        return this.statsService.getOverview();
    }
    async getMessageStats(query) {
        return this.statsService.getMessageStats(query.period || '24h');
    }
    async getSessionStats(sessionId) {
        return this.statsService.getSessionStats(sessionId);
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get overall statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cross-session aggregate statistics (sessions, messages, etc.).',
        type: stats_response_dto_1.OverviewStatsResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get message statistics with time series' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Message statistics with a time series for the requested period.',
        type: stats_response_dto_1.MessageStatsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'A query value is invalid, or the query carries a field the DTO does not declare.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stats_query_dto_1.StatsQueryDto]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getMessageStats", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get statistics for a specific session' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Per-session statistics for the requested session.',
        type: stats_response_dto_1.SessionStatsResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getSessionStats", null);
exports.StatsController = StatsController = __decorate([
    (0, swagger_1.ApiTags)('statistics'),
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [stats_service_1.StatsService])
], StatsController);
//# sourceMappingURL=stats.controller.js.map