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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const contact_service_1 = require("./contact.service");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const paginate_1 = require("../../common/utils/paginate");
const upsert_contact_dto_1 = require("./dto/upsert-contact.dto");
const contact_response_dto_1 = require("./dto/contact-response.dto");
const engine_status_responses_1 = require("../../common/openapi/engine-status-responses");
let ContactController = class ContactController {
    contactService;
    chatScope;
    constructor(contactService, chatScope) {
        this.contactService = contactService;
        this.chatScope = chatScope;
    }
    async findAll(sessionId, limit, offset, apiKey) {
        const skip = offset ? parseInt(offset, 10) : undefined;
        const visible = await this.chatScope.filter(apiKey, await this.contactService.listContacts(sessionId, skip), c => c.id);
        return (0, paginate_1.paginate)(visible, limit ? parseInt(limit, 10) : undefined, skip);
    }
    async getProfilePictures(sessionId, ids) {
        const list = (ids ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const pictures = await this.contactService.getProfilePictures(sessionId, list);
        return { pictures };
    }
    async getBlockedContacts(sessionId) {
        return this.contactService.getBlockedContacts(sessionId);
    }
    async findOne(sessionId, contactId) {
        return this.contactService.getContactById(sessionId, contactId);
    }
    async checkNumber(sessionId, number) {
        const whatsappId = await this.contactService.getNumberId(sessionId, number);
        return {
            number,
            exists: whatsappId !== null,
            whatsappId,
        };
    }
    async getProfilePicture(sessionId, contactId) {
        const url = await this.contactService.getProfilePicture(sessionId, contactId);
        return { url };
    }
    async resolvePhone(sessionId, contactId) {
        const phone = await this.contactService.resolveContactPhone(sessionId, contactId);
        return { contactId, phone };
    }
    async upsertContact(sessionId, contactId, dto) {
        await this.contactService.upsertContact(sessionId, contactId, dto.firstName, dto.lastName);
        return { success: true, message: 'Contact saved' };
    }
    async deleteContact(sessionId, contactId) {
        await this.contactService.deleteContact(sessionId, contactId);
        return { success: true, message: 'Contact deleted' };
    }
    async blockContact(sessionId, contactId) {
        await this.contactService.blockContact(sessionId, contactId);
        return { success: true, message: 'Contact blocked' };
    }
    async unblockContact(sessionId, contactId) {
        await this.contactService.unblockContact(sessionId, contactId);
        return { success: true, message: 'Contact unblocked' };
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, auth_decorators_1.ChatScoped)('filtered'),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all contacts for a session' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of contacts, windowed by limit/offset. A bare array — there is no envelope.',
        type: [contact_response_dto_1.ContactDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The WhatsApp page died while reading contacts, or WhatsApp Web did not answer within the protocol ' +
            'timeout. Retry shortly.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'integer',
        description: 'Max contacts to return (1-1000, default 1000)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: 'integer',
        description: 'Number of contacts to skip (for paging)',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, auth_decorators_1.CurrentApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Function]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('profile-pictures'),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch-resolve profile picture URLs for up to 50 contacts',
        description: 'Resolve a chat sidebar in one request to avoid bursts of per-contact HTTP calls. ' +
            'Engine lookups run 5 at a time; per-id failures return null. After a lookup times out, ' +
            'later chunks are skipped and their ids are absent from the response.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiQuery)({ name: 'ids', required: true, description: 'Comma-separated contact ids (max 50 used)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Picture URL per requested id', type: contact_response_dto_1.ProfilePicturesResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getProfilePictures", null);
__decorate([
    (0, common_1.Get)('blocked'),
    (0, swagger_1.ApiOperation)({
        summary: 'List the contacts this account has blocked',
        description: 'The read half of the block/unblock endpoints. A bare array of neutral contact ids — ids ' +
            'only, because that is the honest common subset: whatsapp-web.js resolves full contact ' +
            "models but Baileys' blocklist query answers bare jids, and inventing the other fields on " +
            'one engine would make the two engines claim different things about the same account.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blocked contact ids', type: [String] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'WhatsApp did not answer the blocklist query — retry shortly' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getBlockedContacts", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':contactId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific contact by ID' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Contact details',
        type: contact_response_dto_1.ContactDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Contact not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'The whatsapp-web.js page connection died mid-read, or WhatsApp Web did not answer within the ' +
            'protocol timeout, so the lookup could not reach an answer. Distinct from the `404` above, which ' +
            'asserts the contact does not exist: this one asserts nothing about the contact. Retry once the ' +
            'session is ready again.',
    }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('check/:number'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Check if a phone number exists on WhatsApp',
        description: 'Returns whether the number is a registered WhatsApp account and its canonical id. Use this to ' +
            'pre-validate a recipient before sending. Baileys also checks unmapped phone destinations before ' +
            'sending: a number reported as unregistered is rejected with 400. A successful check does not ' +
            'confirm message delivery. Requires an OPERATOR key.',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'number', description: 'Phone number to check (e.g., 628123456789)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Number existence check result',
        type: contact_response_dto_1.NumberCheckResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer the lookup. Deliberately not reported as `exists: false` — that ' +
            'would be a claim about the number rather than about the query, and this route exists to be ' +
            'trusted before a send.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "checkNumber", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':contactId/profile-picture'),
    (0, swagger_1.ApiOperation)({ summary: 'Get profile picture URL for a contact' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile picture URL',
        type: contact_response_dto_1.ProfilePictureResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer the lookup. Deliberately not reported as `url: null` — that is the ' +
            'same answer a contact with no picture gives, and a caller cannot tell them apart. On Baileys, also ' +
            'answered when WhatsApp rate-limits, times out or fails on its side (code 429, 408 or 5xx); retry after a pause.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getProfilePicture", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Get)(':contactId/phone'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a contact id (e.g. an @lid) to a phone number — best-effort' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID / JID to resolve (e.g., an @lid)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Resolved phone number (MSISDN digits), or null when the engine cannot map it',
        type: contact_response_dto_1.ResolvedPhoneResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Session is not started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "resolvePhone", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Put)(':contactId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Save a contact to the account's addressbook, or edit an existing entry" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contact saved', type: contact_response_dto_1.ContactAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started, an invalid body, or a contact id that is not a phone-based individual id',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, upsert_contact_dto_1.UpsertContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "upsertContact", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Delete)(':contactId'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: "Remove a contact from the account's addressbook" }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contact deleted', type: contact_response_dto_1.ContactAckResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started, or a contact id that is not a phone-based individual id',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "deleteContact", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Post)(':contactId/block'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Block a contact' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Contact blocked',
        type: contact_response_dto_1.ContactAckResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started, or the id does not name an individual. On Baileys also an id the session ' +
            'cannot map between phone and privacy-id form (a `@lid` with no known phone to block, a phone-based ' +
            'id with no known `@lid`).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "blockContact", null);
__decorate([
    (0, auth_decorators_1.ChatScoped)('fenced'),
    (0, common_1.Delete)(':contactId/block'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock a contact' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    (0, swagger_1.ApiParam)({ name: 'contactId', description: 'Contact ID (e.g., 628xxx@c.us)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Contact unblocked',
        type: contact_response_dto_1.ContactAckResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Session is not started, or the id does not name an individual. On Baileys also a phone-based id ' +
            'the session cannot map to its privacy id (`@lid`).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'WhatsApp did not answer within the request budget. The change may or may not have been applied — ' +
            'the gateway stopped waiting for a confirmation that never came.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: engine_status_responses_1.ENGINE_NOT_READY_409 }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "unblockContact", null);
exports.ContactController = ContactController = __decorate([
    (0, swagger_1.ApiTags)('contacts'),
    (0, common_1.Controller)('sessions/:sessionId/contacts'),
    __metadata("design:paramtypes", [contact_service_1.ContactService,
        chat_scope_service_1.ChatScopeService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map