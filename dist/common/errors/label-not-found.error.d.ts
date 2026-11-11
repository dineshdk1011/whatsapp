import { NotFoundException } from '@nestjs/common';
export declare class LabelNotFoundError extends NotFoundException {
    constructor(labelId: string);
}
