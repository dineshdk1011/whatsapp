import { NotImplementedException } from '@nestjs/common';
export declare class EngineNotSupportedError extends NotImplementedException {
    constructor(method: string);
}
