import { NotFoundException } from '@nestjs/common';
export declare class MessageNotFoundError extends NotFoundException {
    constructor(messageId: string, chatId?: string);
}
