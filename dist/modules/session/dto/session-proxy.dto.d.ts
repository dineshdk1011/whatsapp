import type { Session } from '../entities/session.entity';
export type SessionProxyType = 'http' | 'https' | 'socks4' | 'socks5';
export declare class SessionProxyResponseDto {
    enabled: boolean;
    proxyType: SessionProxyType | null;
    proxyHost: string | null;
    hasCredentials: boolean;
}
export declare class UpdateSessionProxyDto {
    proxyUrl?: string | null;
}
export declare function projectSessionProxy(session: Pick<Session, 'proxyUrl'>): SessionProxyResponseDto;
