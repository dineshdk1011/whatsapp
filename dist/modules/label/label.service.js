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
exports.LabelService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
let LabelService = class LabelService {
    engines;
    constructor(engines) {
        this.engines = engines;
    }
    getEngine(sessionId) {
        return this.engines.require(sessionId);
    }
    getLabels(sessionId) {
        return this.getEngine(sessionId).getLabels();
    }
    async getLabelById(sessionId, labelId) {
        const label = await this.getEngine(sessionId).getLabelById(labelId);
        if (!label) {
            throw new common_1.NotFoundException(`Label ${labelId} not found`);
        }
        return label;
    }
    getChatLabels(sessionId, chatId) {
        return this.getEngine(sessionId).getChatLabels(chatId);
    }
    upsertLabel(sessionId, labelId, body) {
        const name = body.name ?? undefined;
        const color = body.color ?? undefined;
        if (name === undefined && color === undefined) {
            throw new common_1.BadRequestException('At least one of name or color must be provided');
        }
        return this.getEngine(sessionId).upsertLabel({
            id: labelId,
            ...(name === undefined ? {} : { name }),
            ...(color === undefined ? {} : { color }),
        });
    }
    deleteLabel(sessionId, labelId) {
        return this.getEngine(sessionId).deleteLabel(labelId);
    }
    getChatsByLabel(sessionId, labelId) {
        return this.getEngine(sessionId).getChatsByLabel(labelId);
    }
    addLabelToChat(sessionId, chatId, labelId) {
        return this.getEngine(sessionId).addLabelToChat(chatId, labelId);
    }
    removeLabelFromChat(sessionId, chatId, labelId) {
        return this.getEngine(sessionId).removeLabelFromChat(chatId, labelId);
    }
};
exports.LabelService = LabelService;
exports.LabelService = LabelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry])
], LabelService);
//# sourceMappingURL=label.service.js.map