import { NotFoundException } from '@nestjs/common';
export declare class GroupNotFoundError extends NotFoundException {
    constructor(groupId: string);
}
