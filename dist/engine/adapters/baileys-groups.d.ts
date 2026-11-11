import type { GroupMetadata, WASocket } from '@whiskeysockets/baileys';
import { Group, GroupInfo, GroupJoinInfo, GroupMemberAddMode, GroupMembershipRequest, MediaInput, ParticipantOperationResult } from '../interfaces/whatsapp-engine.interface';
import { type createLogger } from '../../common/services/logger.service';
export interface BaileysGroupsHost {
    sessionProxyUrl(): string | undefined;
    ensureReady(): void;
    getSocket(): WASocket;
    readonly logger: ReturnType<typeof createLogger>;
    toNeutralJid(jid: string): string;
    toEngineJid(jid: string): string;
    normalizedSelfJid(): string;
    addLidMappings(mappings: {
        lid?: string;
        pn?: string;
    }[]): void;
    forgetGroupMetadata?(groupId: string): void;
}
export declare function refusedStatusCode(error: unknown): number | undefined;
export declare function mapServerRefusal<T>(operation: string, op: () => Promise<T>, classify?: (error: unknown) => number | undefined, notFound?: () => Error): Promise<T>;
export declare function toEngineParticipants(participants: string[], toEngineJid: (jid: string) => string): string[];
export declare function collectGroupLidTwins(metadata: GroupMetadata): {
    lid: string;
    pn: string;
}[];
export declare class BaileysGroups {
    private readonly host;
    private readonly queryBudgetMs;
    constructor(host: BaileysGroupsHost, queryBudgetMs?: number);
    private confirmed;
    private sock;
    private groupWrite;
    private toEngineParticipants;
    getGroups(): Promise<Group[]>;
    getGroupInfo(groupId: string): Promise<GroupInfo | null>;
    createGroup(name: string, participants: string[]): Promise<Group>;
    addParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    removeParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    promoteParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    demoteParticipants(groupId: string, participants: string[]): Promise<ParticipantOperationResult[]>;
    private runParticipantsUpdate;
    leaveGroup(groupId: string): Promise<void>;
    setGroupSubject(groupId: string, subject: string): Promise<void>;
    setGroupDescription(groupId: string, description: string): Promise<void>;
    getGroupInviteCode(groupId: string): Promise<string>;
    revokeGroupInviteCode(groupId: string): Promise<string>;
    getGroupJoinInfo(inviteCode: string): Promise<GroupJoinInfo>;
    joinGroupViaInviteCode(inviteCode: string): Promise<string>;
    setGroupMessagesAdminsOnly(groupId: string, adminsOnly: boolean): Promise<void>;
    setGroupInfoAdminsOnly(groupId: string, adminsOnly: boolean): Promise<void>;
    setGroupPicture(groupId: string, media: MediaInput): Promise<void>;
    deleteGroupPicture(groupId: string): Promise<void>;
    private pictureWrite;
    setGroupMemberAddMode(groupId: string, mode: GroupMemberAddMode): Promise<void>;
    setGroupEphemeral(groupId: string, durationSec: number): Promise<void>;
    setGroupMemberLabel(groupId: string, label: string): Promise<void>;
    getGroupMembershipRequests(groupId: string): Promise<GroupMembershipRequest[]>;
    approveGroupMembershipRequests(groupId: string, participants?: string[]): Promise<ParticipantOperationResult[]>;
    rejectGroupMembershipRequests(groupId: string, participants?: string[]): Promise<ParticipantOperationResult[]>;
    private runMembershipRequestsUpdate;
}
