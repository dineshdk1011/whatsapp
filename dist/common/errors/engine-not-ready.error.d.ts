import { ConflictException } from '@nestjs/common';
export declare class EngineNotReadyError extends ConflictException {
    constructor(message?: string);
}
