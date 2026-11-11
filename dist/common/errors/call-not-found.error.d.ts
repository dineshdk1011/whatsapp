import { NotFoundException } from '@nestjs/common';
export declare class CallNotFoundError extends NotFoundException {
    constructor(callId: string);
}
