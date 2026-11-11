import { ServiceUnavailableException } from '@nestjs/common';
export declare class EngineTransportError extends ServiceUnavailableException {
    constructor(detail: string);
}
