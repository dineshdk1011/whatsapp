import { Label, ChatSummary } from '../interfaces/whatsapp-engine.interface';
import { type WwebjsEngineHost } from './wwebjs-host';
export declare function readLabelChatIds(labelId: string): string[];
export declare class WwebjsLabels {
    private readonly host;
    private readonly chatWrites;
    constructor(host: WwebjsEngineHost);
    private client;
    getLabels(): Promise<Label[]>;
    getChatsByLabel(labelId: string): Promise<ChatSummary[]>;
    private readLabelChatsLocally;
    getLabelById(labelId: string): Promise<Label | null>;
    getChatLabels(chatId: string): Promise<Label[]>;
    private readChatLabels;
    addLabelToChat(chatId: string, labelId: string): Promise<void>;
    removeLabelFromChat(chatId: string, labelId: string): Promise<void>;
    private changeChatLabel;
    private writeChatLabel;
}
