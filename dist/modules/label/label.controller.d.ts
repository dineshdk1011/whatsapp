import { LabelService } from './label.service';
import { AddLabelDto } from './dto/add-label.dto';
import { UpsertLabelDto } from './dto/upsert-label.dto';
import { type ApiKey } from '../auth/entities/api-key.entity';
import { ChatScopeService } from '../auth/chat-scope.service';
export declare class LabelController {
    private readonly labelService;
    private readonly chatScope;
    constructor(labelService: LabelService, chatScope: ChatScopeService);
    findAll(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label[]>;
    findOne(sessionId: string, labelId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label>;
    getChatsByLabel(sessionId: string, labelId: string, apiKey?: ApiKey): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ChatSummary[]>;
    upsertLabel(sessionId: string, labelId: string, dto: UpsertLabelDto): Promise<{
        success: boolean;
    }>;
    deleteLabel(sessionId: string, labelId: string): Promise<{
        success: boolean;
    }>;
    getChatLabels(sessionId: string, chatId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label[]>;
    addLabelToChat(sessionId: string, chatId: string, body: AddLabelDto): Promise<{
        success: boolean;
    }>;
    removeLabelFromChat(sessionId: string, chatId: string, labelId: string): Promise<{
        success: boolean;
    }>;
}
