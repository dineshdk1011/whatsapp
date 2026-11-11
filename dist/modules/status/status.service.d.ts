import type { Readable } from 'stream';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { StatusStoreService } from '../status-store/status-store.service';
import { StorageService } from '../../common/storage/storage.service';
import type { Status, StatusResult, StatusPostOptions } from '../../engine/interfaces/whatsapp-engine.interface';
import { HookManager } from '../../core/hooks';
import { SendPacingService } from '../message/send-pacing.service';
export declare class StatusService {
    private readonly engines;
    private readonly hookManager;
    private readonly store;
    private readonly storageService;
    private readonly pacing;
    private readonly logger;
    constructor(engines: EngineRegistry, hookManager: HookManager, store: StatusStoreService, storageService: StorageService, pacing: SendPacingService);
    private gate;
    private guardGatedMedia;
    getStatuses(sessionId: string): Promise<Status[]>;
    getContactStatus(sessionId: string, contactId: string): Promise<Status[]>;
    getStatusMedia(sessionId: string, statusId: string): Promise<{
        stream: Readable;
        size?: number;
        mimetype: string;
    }>;
    private recordedPost;
    postTextStatus(sessionId: string, text: string, options: StatusPostOptions): Promise<StatusResult>;
    postImageStatus(sessionId: string, media: {
        url?: string;
        base64?: string;
        mimetype?: string;
    } | undefined, options: StatusPostOptions): Promise<StatusResult>;
    postVideoStatus(sessionId: string, media: {
        url?: string;
        base64?: string;
        mimetype?: string;
    } | undefined, options: StatusPostOptions): Promise<StatusResult>;
    postVoiceStatus(sessionId: string, media: {
        url?: string;
        base64?: string;
        mimetype?: string;
    } | undefined, options: StatusPostOptions): Promise<StatusResult>;
    deleteStatus(sessionId: string, statusId: string): Promise<void>;
}
