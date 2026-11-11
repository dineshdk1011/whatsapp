export declare class HealthCheckResponseDto {
    status: string;
    timestamp: string;
    version?: string;
}
export declare class LivenessResponseDto {
    status: string;
}
export declare class ReadinessResponseDto {
    status: string;
    details: {
        [dependency: string]: object;
    };
}
