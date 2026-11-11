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
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const logger_service_1 = require("../../common/services/logger.service");
const paginate_1 = require("../../common/utils/paginate");
const listing_memo_1 = require("../../common/utils/listing-memo");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const wa_id_1 = require("../../engine/identity/wa-id");
let ContactService = class ContactService {
    static { ContactService_1 = this; }
    engines;
    logger = (0, logger_service_1.createLogger)('ContactService');
    listings = new listing_memo_1.ListingMemo();
    constructor(engines) {
        this.engines = engines;
        engines.onRetire(id => this.listings.drop(id));
    }
    getEngine(sessionId) {
        return this.engines.require(sessionId);
    }
    listContacts(sessionId, offset) {
        const engine = this.getEngine(sessionId);
        return this.listings.read(sessionId, offset, () => engine.getContacts());
    }
    getContacts(sessionId, opts = {}) {
        return this.listContacts(sessionId, opts.offset).then(contacts => (0, paginate_1.paginate)(contacts, opts.limit, opts.offset));
    }
    async getContactById(sessionId, contactId) {
        const contact = await this.getEngine(sessionId).getContactById(contactId);
        if (!contact) {
            throw new common_1.NotFoundException(`Contact ${contactId} not found`);
        }
        return contact;
    }
    getBlockedContacts(sessionId) {
        return this.getEngine(sessionId).getBlockedContacts();
    }
    getNumberId(sessionId, number) {
        return this.getEngine(sessionId).getNumberId(number);
    }
    async resolveContactPhone(sessionId, contactId) {
        const engine = this.getEngine(sessionId);
        try {
            return await engine.resolveContactPhone(contactId);
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.debug(`resolveContactPhone lookup failed for ${contactId}`, {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    getProfilePicture(sessionId, contactId) {
        return this.getEngine(sessionId).getProfilePicture(contactId);
    }
    static PROFILE_PICTURES_MAX_IDS = 50;
    static PROFILE_PICTURE_LOOKUP_TIMEOUT_MS = 8000;
    async getProfilePictures(sessionId, ids) {
        const engine = this.getEngine(sessionId);
        const capped = ids.slice(0, ContactService_1.PROFILE_PICTURES_MAX_IDS);
        const pictures = {};
        const CHUNK = 5;
        let notReady;
        for (let i = 0; i < capped.length; i += CHUNK) {
            const chunk = capped.slice(i, i + CHUNK);
            let timedOut = false;
            const results = await Promise.all(chunk.map((id) => {
                return new Promise(resolve => {
                    const timer = setTimeout(() => {
                        timedOut = true;
                        resolve([id, null]);
                    }, ContactService_1.PROFILE_PICTURE_LOOKUP_TIMEOUT_MS);
                    engine.getProfilePicture(id).then(url => {
                        clearTimeout(timer);
                        resolve([id, url]);
                    }, (error) => {
                        clearTimeout(timer);
                        if (error instanceof engine_not_ready_error_1.EngineNotReadyError)
                            notReady = error;
                        resolve([id, null]);
                    });
                });
            }));
            if (notReady)
                throw notReady;
            for (const [id, url] of results) {
                pictures[id] = url;
            }
            if (timedOut)
                break;
        }
        return pictures;
    }
    blockContact(sessionId, contactId) {
        this.assertBlockable(contactId);
        return this.getEngine(sessionId)
            .blockContact(this.toAddressableId(contactId))
            .finally(() => this.listings.drop(sessionId));
    }
    assertBlockable(contactId) {
        if ((0, wa_id_1.isIndividualWid)(contactId) || this.isBareNumber(contactId))
            return;
        throw new common_1.BadRequestException(`Contact ${contactId} does not name an individual; block and unblock act on a person, so pass a phone-based or privacy (@lid) contact id instead`);
    }
    assertAddressable(contactId) {
        const kind = (0, wa_id_1.parseWaId)(contactId).kind;
        if ((kind === 'user' && (0, wa_id_1.isIndividualWid)(contactId)) || this.isBareNumber(contactId))
            return;
        if (kind === 'lid') {
            throw new common_1.BadRequestException(`Contact ${contactId} is a privacy id (@lid) with no known phone number; the addressbook is keyed by phone number, so pass a phone-based contact id instead`);
        }
        throw new common_1.BadRequestException(`Contact ${contactId} does not name a person; the addressbook is keyed by phone number, so pass a phone-based contact id instead`);
    }
    isBareNumber(contactId) {
        return (0, wa_id_1.parseWaId)(contactId).kind === 'unknown' && /^\d{5,}$/.test(contactId.trim());
    }
    toAddressableId(contactId) {
        const trimmed = contactId.trim();
        return this.isBareNumber(trimmed) ? `${trimmed}@c.us` : (0, wa_id_1.toNeutralJid)(trimmed);
    }
    upsertContact(sessionId, contactId, firstName, lastName) {
        this.assertAddressable(contactId);
        return this.getEngine(sessionId)
            .upsertContact(this.toAddressableId(contactId), firstName, lastName ?? undefined)
            .finally(() => this.listings.drop(sessionId));
    }
    deleteContact(sessionId, contactId) {
        this.assertAddressable(contactId);
        return this.getEngine(sessionId)
            .deleteContact(this.toAddressableId(contactId))
            .finally(() => this.listings.drop(sessionId));
    }
    unblockContact(sessionId, contactId) {
        this.assertBlockable(contactId);
        return this.getEngine(sessionId)
            .unblockContact(this.toAddressableId(contactId))
            .finally(() => this.listings.drop(sessionId));
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry])
], ContactService);
//# sourceMappingURL=contact.service.js.map