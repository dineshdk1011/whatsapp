"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStatsResponseDto = exports.SessionHourlyActivityDto = exports.SessionStatsTopChatDto = exports.SessionStatsMessagesDto = exports.SessionStatsSessionDto = exports.MessageStatsResponseDto = exports.StatsTopChatDto = exports.StatsBySessionDto = exports.TimeSeriesPointDto = exports.OverviewStatsResponseDto = exports.OverviewMessagesDto = exports.OverviewTodayDto = exports.OverviewSessionsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class OverviewSessionsDto {
    active;
    total;
    byStatus;
}
exports.OverviewSessionsDto = OverviewSessionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sessions currently connected.', example: 2 }),
    __metadata("design:type", Number)
], OverviewSessionsDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sessions on record, connected or not.', example: 5 }),
    __metadata("design:type", Number)
], OverviewSessionsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Session count per status value.',
        example: { ready: 2, disconnected: 3 },
        additionalProperties: { type: 'integer' },
    }),
    __metadata("design:type", Object)
], OverviewSessionsDto.prototype, "byStatus", void 0);
class OverviewTodayDto {
    sent;
    received;
}
exports.OverviewTodayDto = OverviewTodayDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], OverviewTodayDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 34 }),
    __metadata("design:type", Number)
], OverviewTodayDto.prototype, "received", void 0);
class OverviewMessagesDto {
    sent;
    received;
    failed;
    today;
}
exports.OverviewMessagesDto = OverviewMessagesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'All-time sent count.', example: 1024 }),
    __metadata("design:type", Number)
], OverviewMessagesDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'All-time received count.', example: 2048 }),
    __metadata("design:type", Number)
], OverviewMessagesDto.prototype, "received", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sends the gateway recorded as failed.', example: 3 }),
    __metadata("design:type", Number)
], OverviewMessagesDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: OverviewTodayDto, description: "Today's counts, in the server's timezone." }),
    __metadata("design:type", OverviewTodayDto)
], OverviewMessagesDto.prototype, "today", void 0);
class OverviewStatsResponseDto {
    sessions;
    messages;
}
exports.OverviewStatsResponseDto = OverviewStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: OverviewSessionsDto }),
    __metadata("design:type", OverviewSessionsDto)
], OverviewStatsResponseDto.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: OverviewMessagesDto }),
    __metadata("design:type", OverviewMessagesDto)
], OverviewStatsResponseDto.prototype, "messages", void 0);
class TimeSeriesPointDto {
    timestamp;
    sent;
    received;
}
exports.TimeSeriesPointDto = TimeSeriesPointDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bucket start in UTC as zone-less text: YYYY-MM-DD HH:00:00 for period=24h, YYYY-MM-DD for 7d/30d.',
        example: '2026-08-07 12:00:00',
    }),
    __metadata("design:type", String)
], TimeSeriesPointDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], TimeSeriesPointDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 34 }),
    __metadata("design:type", Number)
], TimeSeriesPointDto.prototype, "received", void 0);
class StatsBySessionDto {
    sessionId;
    name;
    sent;
    received;
}
exports.StatsBySessionDto = StatsBySessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], StatsBySessionDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'primary' }),
    __metadata("design:type", String)
], StatsBySessionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], StatsBySessionDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 34 }),
    __metadata("design:type", Number)
], StatsBySessionDto.prototype, "received", void 0);
const CHAT_NAME_DESCRIPTION = "The contact's push name for a 1:1 chat, taken from its incoming messages. Null for a group chat, " +
    'or when no name is known.';
class StatsTopChatDto {
    chatId;
    chatName;
    messageCount;
}
exports.StatsTopChatDto = StatsTopChatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], StatsTopChatDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, description: CHAT_NAME_DESCRIPTION }),
    __metadata("design:type", Object)
], StatsTopChatDto.prototype, "chatName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42 }),
    __metadata("design:type", Number)
], StatsTopChatDto.prototype, "messageCount", void 0);
class MessageStatsResponseDto {
    timeSeries;
    byType;
    bySession;
    topChats;
}
exports.MessageStatsResponseDto = MessageStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TimeSeriesPointDto], description: 'One point per bucket over the requested period.' }),
    __metadata("design:type", Array)
], MessageStatsResponseDto.prototype, "timeSeries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message count per message type.',
        example: { text: 900, image: 124 },
        additionalProperties: { type: 'integer' },
    }),
    __metadata("design:type", Object)
], MessageStatsResponseDto.prototype, "byType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StatsBySessionDto] }),
    __metadata("design:type", Array)
], MessageStatsResponseDto.prototype, "bySession", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StatsTopChatDto] }),
    __metadata("design:type", Array)
], MessageStatsResponseDto.prototype, "topChats", void 0);
class SessionStatsSessionDto {
    id;
    name;
    status;
}
exports.SessionStatsSessionDto = SessionStatsSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0a941dac-a965-45e7-b318-74ae8be134f0' }),
    __metadata("design:type", String)
], SessionStatsSessionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'primary' }),
    __metadata("design:type", String)
], SessionStatsSessionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ready' }),
    __metadata("design:type", String)
], SessionStatsSessionDto.prototype, "status", void 0);
class SessionStatsMessagesDto {
    sent;
    received;
    today;
    failed;
}
exports.SessionStatsMessagesDto = SessionStatsMessagesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1024 }),
    __metadata("design:type", Number)
], SessionStatsMessagesDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2048 }),
    __metadata("design:type", Number)
], SessionStatsMessagesDto.prototype, "received", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 46 }),
    __metadata("design:type", Number)
], SessionStatsMessagesDto.prototype, "today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], SessionStatsMessagesDto.prototype, "failed", void 0);
class SessionStatsTopChatDto {
    chatId;
    chatName;
    count;
    lastActive;
}
exports.SessionStatsTopChatDto = SessionStatsTopChatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '628123456789@c.us' }),
    __metadata("design:type", String)
], SessionStatsTopChatDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, description: CHAT_NAME_DESCRIPTION }),
    __metadata("design:type", Object)
], SessionStatsTopChatDto.prototype, "chatName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42 }),
    __metadata("design:type", Number)
], SessionStatsTopChatDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Time of the last message in UTC as zone-less text, YYYY-MM-DD HH:MM:SS.',
        example: '2026-08-07 12:00:00',
    }),
    __metadata("design:type", String)
], SessionStatsTopChatDto.prototype, "lastActive", void 0);
class SessionHourlyActivityDto {
    hour;
    sent;
    received;
}
exports.SessionHourlyActivityDto = SessionHourlyActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hour of day in UTC, 0-23.', example: 9 }),
    __metadata("design:type", Number)
], SessionHourlyActivityDto.prototype, "hour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], SessionHourlyActivityDto.prototype, "sent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 34 }),
    __metadata("design:type", Number)
], SessionHourlyActivityDto.prototype, "received", void 0);
class SessionStatsResponseDto {
    session;
    messages;
    topChats;
    hourlyActivity;
}
exports.SessionStatsResponseDto = SessionStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: SessionStatsSessionDto }),
    __metadata("design:type", SessionStatsSessionDto)
], SessionStatsResponseDto.prototype, "session", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SessionStatsMessagesDto }),
    __metadata("design:type", SessionStatsMessagesDto)
], SessionStatsResponseDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SessionStatsTopChatDto] }),
    __metadata("design:type", Array)
], SessionStatsResponseDto.prototype, "topChats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SessionHourlyActivityDto] }),
    __metadata("design:type", Array)
], SessionStatsResponseDto.prototype, "hourlyActivity", void 0);
//# sourceMappingURL=stats-response.dto.js.map