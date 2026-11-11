import type { Request } from 'express';
import { GroupService } from './group.service';
import { CreateGroupDto, ParticipantsDto, GroupSubjectDto, GroupDescriptionDto, GroupMemberLabelDto, JoinGroupDto, GroupSettingsDto, MembershipRequestActionDto, SetGroupPictureDto } from './dto/group.dto';
export declare class GroupController {
    private readonly groupService;
    constructor(groupService: GroupService);
    joinInfo(sessionId: string, code: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupJoinInfo>;
    findOne(sessionId: string, groupId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupInfo>;
    join(sessionId: string, dto: JoinGroupDto): Promise<{
        success: boolean;
        groupId: string;
    }>;
    getSettings(sessionId: string, groupId: string): Promise<{
        memberAddMode?: import("../../engine/interfaces/whatsapp-engine.interface").GroupMemberAddMode | undefined;
        ephemeralSeconds?: number | undefined;
        announce: boolean | undefined;
        locked: boolean | undefined;
    }>;
    updateSettings(sessionId: string, groupId: string, dto: GroupSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    create(sessionId: string, dto: CreateGroupDto): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Group>;
    addParticipants(sessionId: string, groupId: string, dto: ParticipantsDto): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    removeParticipants(sessionId: string, groupId: string, dto: ParticipantsDto): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    promoteParticipants(sessionId: string, groupId: string, dto: ParticipantsDto): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    demoteParticipants(sessionId: string, groupId: string, dto: ParticipantsDto): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    getMembershipRequests(sessionId: string, groupId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupMembershipRequest[]>;
    approveMembershipRequests(sessionId: string, groupId: string, dto: MembershipRequestActionDto, req: Request): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    rejectMembershipRequests(sessionId: string, groupId: string, dto: MembershipRequestActionDto, req: Request): Promise<{
        success: boolean;
        message: string;
        results: import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[];
    }>;
    setSubject(sessionId: string, groupId: string, dto: GroupSubjectDto): Promise<{
        success: boolean;
        message: string;
    }>;
    setDescription(sessionId: string, groupId: string, dto: GroupDescriptionDto): Promise<{
        success: boolean;
        message: string;
    }>;
    setMemberLabel(sessionId: string, groupId: string, dto: GroupMemberLabelDto): Promise<{
        success: boolean;
        message: string;
    }>;
    leave(sessionId: string, groupId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPicture(sessionId: string, groupId: string): Promise<{
        url: string | null;
    }>;
    setPicture(sessionId: string, groupId: string, dto: SetGroupPictureDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deletePicture(sessionId: string, groupId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getInviteCode(sessionId: string, groupId: string): Promise<{
        inviteCode: string;
        inviteLink: string;
    }>;
    revokeInviteCode(sessionId: string, groupId: string): Promise<{
        inviteCode: string;
        inviteLink: string;
        message: string;
    }>;
}
