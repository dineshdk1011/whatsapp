export declare class SettingsGeneralDto {
    apiBaseUrl: string;
    autoReconnect: boolean;
    debugMode: boolean;
}
export declare class SettingsApiDto {
    rateLimit: number;
    rateLimitWindow: number;
    enableDocs: boolean;
}
export declare class SettingsNotificationsDto {
    emailEnabled: boolean;
    notificationEmail: string;
    webhookAlerts: boolean;
}
export declare class SettingsResponseDto {
    general: SettingsGeneralDto;
    api: SettingsApiDto;
    notifications: SettingsNotificationsDto;
}
