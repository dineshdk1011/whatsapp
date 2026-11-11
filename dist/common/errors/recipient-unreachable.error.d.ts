import { BadRequestException } from '@nestjs/common';
export declare class RecipientUnreachableError extends BadRequestException {
    constructor(chatId: string);
}
