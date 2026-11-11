import type { z } from 'zod';
import type { ApiKey } from '../../modules/auth/entities/api-key.entity';
import type { ApiKeyRole } from '../../modules/auth/entities/api-key.entity';
import type { ChatScopeService } from '../../modules/auth/chat-scope.service';
export interface ToolDescriptor<I = unknown> {
    name: string;
    description: string;
    inputSchema: z.ZodType<I>;
    tier: 'read' | 'write';
    destructive?: boolean;
    idempotent?: boolean;
    requiredRole?: ApiKeyRole;
    sessionScoped?: boolean;
    chatScope?: readonly string[] | 'filtered' | 'agnostic';
    chatQuotedAllowed?: boolean;
    handler: (input: I, apiKey: ApiKey, chatScope?: ChatScopeService, signal?: AbortSignal) => Promise<unknown>;
}
export type AnyToolDescriptor = Omit<ToolDescriptor, 'inputSchema' | 'handler'> & {
    inputSchema: z.ZodType;
    handler: (input: never, apiKey: ApiKey, chatScope?: ChatScopeService, signal?: AbortSignal) => Promise<unknown>;
};
export declare function defineTool<I>(descriptor: ToolDescriptor<I>): AnyToolDescriptor;
