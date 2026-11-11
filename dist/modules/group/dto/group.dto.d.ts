import type { GroupMemberAddMode } from '../../../engine/interfaces/whatsapp-engine.interface';
export declare const GROUP_NAME_MAX_LENGTH = 100;
export declare const GROUP_DESCRIPTION_MAX_LENGTH = 1024;
export declare const GROUP_MEMBER_LABEL_MAX_LENGTH = 30;
export declare const GROUP_PARTICIPANTS_MAX = 256;
export declare class CreateGroupDto {
    name: string;
    participants: string[];
}
export declare class ParticipantsDto {
    participants: string[];
}
export declare class MembershipRequestActionDto {
    participants?: string[];
}
export declare class GroupSubjectDto {
    subject: string;
}
export declare class GroupDescriptionDto {
    description: string;
}
export declare class GroupMemberLabelDto {
    label: string;
}
export declare class JoinGroupDto {
    inviteCode: string;
}
export declare class SetGroupPictureDto {
    url?: string;
    base64?: string;
    mimetype?: string;
}
export declare class GroupSettingsDto {
    announce?: boolean;
    locked?: boolean;
    ephemeralSeconds?: number;
    memberAddMode?: GroupMemberAddMode;
}
