import { UnprocessableEntityException } from '@nestjs/common';
export declare class ChatLabelsUnsupportedError extends UnprocessableEntityException {
    constructor(message?: string);
}
