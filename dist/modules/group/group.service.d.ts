import { EngineRegistry } from '../../engine/engine-registry.service';
import { GroupMemberAddMode } from '../../engine/interfaces/whatsapp-engine.interface';
import { SetGroupPictureDto } from './dto/group.dto';
import { ListOptions } from '../../common/utils/paginate';
import { SendPacingService } from '../message/send-pacing.service';
export declare class GroupService {
    private readonly engines;
    private readonly pacing;
    private readonly logger;
    constructor(engines: EngineRegistry, pacing: SendPacingService);
    private getEngine;
    private assertAddressableParticipants;
    listGroups(sessionId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Group[]>;
    getGroups(sessionId: string, opts?: ListOptions): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Group[]>;
    getGroupInfo(sessionId: string, groupId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupInfo>;
    createGroup(sessionId: string, name: string, participants: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").Group>;
    addParticipants(sessionId: string, groupId: string, participants: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    removeParticipants(sessionId: string, groupId: string, participants: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    promoteParticipants(sessionId: string, groupId: string, participants: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    demoteParticipants(sessionId: string, groupId: string, participants: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    getGroupMembershipRequests(sessionId: string, groupId: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupMembershipRequest[]>;
    approveGroupMembershipRequests(sessionId: string, groupId: string, participants?: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    rejectGroupMembershipRequests(sessionId: string, groupId: string, participants?: string[]): Promise<import("../../engine/interfaces/whatsapp-engine.interface").ParticipantOperationResult[]>;
    setGroupSubject(sessionId: string, groupId: string, subject: string): Promise<void>;
    setGroupDescription(sessionId: string, groupId: string, description: string): Promise<void>;
    setGroupMemberLabel(sessionId: string, groupId: string, label: string): Promise<void>;
    leaveGroup(sessionId: string, groupId: string): Promise<void>;
    getGroupInviteCode(sessionId: string, groupId: string): Promise<string>;
    revokeGroupInviteCode(sessionId: string, groupId: string): Promise<string>;
    getGroupJoinInfo(sessionId: string, inviteCode: string): Promise<import("../../engine/interfaces/whatsapp-engine.interface").GroupJoinInfo>;
    joinGroupViaInviteCode(sessionId: string, inviteCode: string): Promise<string>;
    private requireInviteCode;
    private assertGroupId;
    getGroupPicture(sessionId: string, groupId: string): Promise<string | null>;
    setGroupPicture(sessionId: string, groupId: string, dto: SetGroupPictureDto): Promise<void>;
    deleteGroupPicture(sessionId: string, groupId: string): Promise<void>;
    getGroupSettings(sessionId: string, groupId: string): Promise<{
        memberAddMode?: GroupMemberAddMode | undefined;
        ephemeralSeconds?: number | undefined;
        announce: boolean | undefined;
        locked: boolean | undefined;
    }>;
    updateGroupSettings(sessionId: string, groupId: string, settings: {
        announce?: boolean;
        locked?: boolean;
        ephemeralSeconds?: number;
        memberAddMode?: GroupMemberAddMode;
    }): Promise<void>;
}
