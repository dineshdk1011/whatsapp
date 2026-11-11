export declare class StatusContactDto {
    id: string;
    name?: string;
    pushName?: string;
}
export declare class StatusDto {
    id: string;
    contact: StatusContactDto;
    type: string;
    caption?: string;
    mediaUrl?: string;
    backgroundColor?: string;
    font?: number;
    timestamp: string;
    expiresAt: string;
}
export declare class StatusListResponseDto {
    statuses: StatusDto[];
}
export declare class StatusResultDto {
    statusId: string;
    timestamp: string;
    expiresAt: string;
}
export declare class StatusDeletedResponseDto {
    message: string;
}
