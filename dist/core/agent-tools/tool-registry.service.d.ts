import type { AnyToolDescriptor } from './tool-descriptor';
export declare class ToolRegistryService {
    private readonly byName;
    constructor(tools: AnyToolDescriptor[]);
    list(opts?: {
        readOnly?: boolean;
    }): AnyToolDescriptor[];
    get(name: string): AnyToolDescriptor | undefined;
}
