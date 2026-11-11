import { ForbiddenException } from '@nestjs/common';
export declare class EngineRefusedError extends ForbiddenException {
    constructor(detail: string);
}
