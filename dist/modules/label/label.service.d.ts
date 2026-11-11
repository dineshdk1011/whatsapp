import { EngineRegistry } from '../../engine/engine-registry.service';
export declare class LabelService {
    private readonly engines;
    constructor(engines: EngineRegistry);
    private getEngine;
    getLabels(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label[]>;
    getLabelById(sessionId: string, labelId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label>;
    getChatLabels(sessionId: string, chatId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Label[]>;
    upsertLabel(sessionId: string, labelId: string, body: {
        name?: string;
        color?: number;
    }): Promise<void>;
    deleteLabel(sessionId: string, labelId: string): Promise<void>;
    getChatsByLabel(sessionId: string, labelId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ChatSummary[]>;
    addLabelToChat(sessionId: string, chatId: string, labelId: string): Promise<void>;
    removeLabelFromChat(sessionId: string, chatId: string, labelId: string): Promise<void>;
}
