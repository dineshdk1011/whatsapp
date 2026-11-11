import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { StatusService } from './status.service';
import { SendTextStatusDto } from './dto/send-text-status.dto';
import { SendImageStatusDto, SendVideoStatusDto, SendVoiceStatusDto } from './dto/send-media-status.dto';
export declare class StatusController {
    private readonly statusService;
    constructor(statusService: StatusService);
    getStatuses(sessionId: string): Promise<{
        statuses: import("../../engine/interfaces/whatsapp-engine.interface").Status[];
    }>;
    getContactStatus(sessionId: string, contactId: string): Promise<{
        statuses: import("../../engine/interfaces/whatsapp-engine.interface").Status[];
    }>;
    getStatusMedia(sessionId: string, statusId: string, res: Response): Promise<StreamableFile>;
    sendTextStatus(sessionId: string, dto: SendTextStatusDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").StatusResult>;
    sendImageStatus(sessionId: string, dto: SendImageStatusDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").StatusResult>;
    sendVideoStatus(sessionId: string, dto: SendVideoStatusDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").StatusResult>;
    sendVoiceStatus(sessionId: string, dto: SendVoiceStatusDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").StatusResult>;
    deleteStatus(sessionId: string, statusId: string): Promise<{
        message: string;
    }>;
}
