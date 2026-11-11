export declare class GroupParticipantDto {
    id: string;
    number: string;
    name?: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}
export declare class GroupSummaryDto {
    id: string;
    name: string;
    participantsCount?: number;
    isAdmin?: boolean;
    linkedParentJID?: string | null;
}
export declare class GroupInfoDto {
    id: string;
    name: string;
    linkedParentJID?: string | null;
    description?: string;
    owner?: string;
    createdAt?: number;
    participants: GroupParticipantDto[];
    isReadOnly?: boolean;
    isAnnounce?: boolean;
    announce?: boolean;
    locked?: boolean;
    ephemeralSeconds?: number;
    memberAddMode?: string;
}
export declare class GroupJoinInfoDto {
    id: string;
    name: string;
    description?: string;
    owner?: string;
    createdAt?: number;
    participantCount?: number;
}
export declare class GroupSettingsResponseDto {
    announce?: boolean;
    locked?: boolean;
    ephemeralSeconds?: number;
    memberAddMode?: string;
}
export declare class GroupAckResponseDto {
    success: boolean;
    message: string;
}
export declare class ParticipantOperationResultDto {
    id: string;
    success: boolean;
    status?: number;
    message?: string;
}
export declare class ParticipantsOperationResponseDto extends GroupAckResponseDto {
    results: ParticipantOperationResultDto[];
}
export declare class GroupMembershipRequestDto {
    participantId: string;
    addedById?: string;
    method?: string;
    requestedAt?: number;
}
export declare class GroupJoinedResponseDto {
    success: boolean;
    groupId: string;
}
export declare class GroupPictureResponseDto {
    url: string | null;
}
export declare class GroupInviteCodeResponseDto {
    inviteCode: string;
    inviteLink: string;
}
export declare class GroupInviteCodeRevokedResponseDto extends GroupInviteCodeResponseDto {
    message: string;
}
