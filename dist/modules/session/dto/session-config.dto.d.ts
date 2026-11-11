export declare class UpdateSessionConfigDto {
    autoRejectCalls?: boolean | null;
    maxReconnectAttempts?: number | null;
    reconnectBaseDelay?: number | null;
}
export declare class SessionConfigResponseDto {
    autoRejectCalls: boolean;
    maxReconnectAttempts: number | null;
    reconnectBaseDelay: number;
}
