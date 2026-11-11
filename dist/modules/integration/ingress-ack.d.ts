import type { IngressResponseContract } from '../../core/plugins/plugin.interfaces';
export interface AckRenderCtx {
    rawBody: string;
    timestamp: string;
    id: string;
}
export type AckResult = {
    status: number;
    body?: string;
    headers?: Record<string, string>;
};
export declare function renderAck(spec: IngressResponseContract['ack'] | undefined, ctx: AckRenderCtx): AckResult;
export declare function safeAckHeaders(headers: Record<string, string> | undefined): Record<string, string>;
export declare function ackContentType(headers: Record<string, string> | undefined): string;
