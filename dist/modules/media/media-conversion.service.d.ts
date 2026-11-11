import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { Session } from '../session/entities/session.entity';
import type { ConvertMediaDto } from './dto/convert-media.dto';
export interface ConvertedMedia {
    base64: string;
    mimetype: string;
    bytes: number;
}
export declare class MediaConversionService implements OnModuleInit, OnApplicationShutdown {
    private readonly configService;
    private readonly engines;
    private readonly sessionRepository;
    private readonly logger;
    private binaryAvailable?;
    private readonly ffmpegGate;
    private readonly shutdown;
    constructor(configService: ConfigService, engines: EngineRegistry, sessionRepository: Repository<Session>);
    onModuleInit(): void;
    onApplicationShutdown(): void;
    convertToVoice(sessionId: string, dto: ConvertMediaDto): Promise<ConvertedMedia>;
    convertToVideo(sessionId: string, dto: ConvertMediaDto): Promise<ConvertedMedia>;
    isAvailable(): Promise<boolean>;
    private convert;
    private sessionProxy;
    private resolveInput;
    private assertRunning;
    private assertAvailable;
    private probeOnce;
}
