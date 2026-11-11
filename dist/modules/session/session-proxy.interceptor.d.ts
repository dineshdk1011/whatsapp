import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { Session } from './entities/session.entity';
import { SessionOwnershipService } from './session-ownership.service';
export declare const FORWARDED_HEADER = "x-openwa-forwarded";
export declare function forwardTarget(originalUrl: string, ownerNodeUrl: string): string;
export declare class SessionProxyInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly sessions;
    private readonly ownership?;
    private readonly configService?;
    private readonly logger;
    constructor(reflector: Reflector, sessions: Repository<Session>, ownership?: SessionOwnershipService | undefined, configService?: ConfigService | undefined);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
    private sessionIdOf;
    private forward;
}
