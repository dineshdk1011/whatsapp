export declare class CreateSessionDto {
    name: string;
    config?: Record<string, unknown>;
    proxyUrl?: string;
    proxyType?: 'http' | 'https' | 'socks4' | 'socks5';
}
