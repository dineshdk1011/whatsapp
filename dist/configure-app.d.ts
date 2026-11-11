import { INestApplication } from '@nestjs/common';
export interface DashboardSource {
    distDir: string;
    enabled: boolean;
}
export interface ConfigureAppOptions {
    dashboard?: DashboardSource;
}
export interface AppliedBodyCaps {
    bodyLimit: string;
    inflightBudgetBytes: number;
}
export declare function configureApp(app: INestApplication, options?: ConfigureAppOptions): AppliedBodyCaps;
