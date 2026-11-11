import { NotFoundException } from '@nestjs/common';
export declare class ChannelNotFoundError extends NotFoundException {
    constructor(channelId: string);
}
