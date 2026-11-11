import { ConfigService } from '@nestjs/config';
interface Settings {
    general: {
        apiBaseUrl: string;
        autoReconnect: boolean;
        debugMode: boolean;
    };
    api: {
        rateLimit: number;
        rateLimitWindow: number;
        enableDocs: boolean;
    };
    notifications: {
        emailEnabled: boolean;
        notificationEmail: string;
        webhookAlerts: boolean;
    };
}
export declare class SettingsController {
    private readonly configService;
    private settings;
    constructor(configService: ConfigService);
    get(): Settings;
}
export {};
