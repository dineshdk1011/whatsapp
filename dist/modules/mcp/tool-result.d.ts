import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare function smartToolResult(data: string | object | object[]): CallToolResult;
export declare function jsonToolResult(data: object, isError?: boolean): CallToolResult;
export declare function handleToolError(error: unknown): CallToolResult;
