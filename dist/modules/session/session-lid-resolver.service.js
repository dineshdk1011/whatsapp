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
var SessionLidResolver_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLidResolver = void 0;
const common_1 = require("@nestjs/common");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const wa_id_1 = require("../../engine/identity/wa-id");
const lid_not_mapped_error_1 = require("../../common/errors/lid-not-mapped.error");
let SessionLidResolver = class SessionLidResolver {
    static { SessionLidResolver_1 = this; }
    engines;
    lidMappingStore;
    cache = new Map();
    static CACHE_MAX = 5000;
    retryAfter = new Map();
    static RETRY_AFTER_MS = 60_000;
    inFlight = new Map();
    recheckAt = new Map();
    static RECHECK_MS = 5 * 60_000;
    now = () => performance.now();
    constructor(engines, lidMappingStore) {
        this.engines = engines;
        this.lidMappingStore = lidMappingStore;
        engines.onRetire(id => {
            for (const map of [this.cache, this.retryAfter, this.inFlight, this.recheckAt]) {
                for (const key of map.keys())
                    if (key.startsWith(`${id}:`))
                        map.delete(key);
            }
        });
    }
    async resolveSenderPhone(sessionId, contactId) {
        const key = `${sessionId}:${contactId}`;
        const cached = this.cache.get(key);
        if (cached !== undefined) {
            if ((this.recheckAt.get(key) ?? Infinity) > this.now())
                return cached;
            this.forget(key);
        }
        if ((this.retryAfter.get(key) ?? 0) > this.now()) {
            return null;
        }
        let lookup = this.inFlight.get(key);
        if (!lookup) {
            lookup = this.lookup(sessionId, contactId, key).finally(() => {
                if (this.inFlight.get(key) === lookup)
                    this.inFlight.delete(key);
            });
            this.inFlight.set(key, lookup);
        }
        return lookup;
    }
    async lookup(sessionId, contactId, key) {
        let phone;
        const engine = this.engines.get(sessionId);
        let failure;
        let resolved = false;
        try {
            if (engine) {
                phone = (await engine.resolveContactPhone(contactId)) ?? null;
                resolved = true;
            }
            else {
                phone = null;
            }
        }
        catch (err) {
            phone = null;
            failure = err;
        }
        if (engine && !this.engines.isLive(sessionId, engine))
            return null;
        if (failure instanceof lid_not_mapped_error_1.LidNotMappedError) {
            this.retryAfter.delete(key);
            if (this.retryAfter.size >= SessionLidResolver_1.CACHE_MAX) {
                this.retryAfter.delete(this.retryAfter.keys().next().value);
            }
            this.retryAfter.set(key, this.now() + SessionLidResolver_1.RETRY_AFTER_MS);
        }
        if (resolved) {
            this.retryAfter.delete(key);
            if (this.cache.size >= SessionLidResolver_1.CACHE_MAX) {
                for (const oldest of this.cache.keys()) {
                    this.forget(oldest);
                    break;
                }
            }
            this.cache.set(key, phone);
            this.recheckAt.set(key, this.now() + SessionLidResolver_1.RECHECK_MS);
        }
        if (engine && (phone || resolved)) {
            this.persist(key, sessionId, contactId, phone, engine);
        }
        return phone;
    }
    persist(key, sessionId, contactId, phone, engine) {
        const stored = phone && engine.contactPhoneLookupPersistence === 'seed'
            ? this.lidMappingStore?.rememberIfUnknown((0, wa_id_1.userPart)(contactId), phone, sessionId)
            : this.lidMappingStore?.remember((0, wa_id_1.userPart)(contactId), phone, sessionId);
        void stored
            ?.then(stored => {
            if (stored === false && this.engines.isLive(sessionId, engine))
                this.forget(key);
        })
            .catch(() => { });
    }
    forget(key) {
        this.cache.delete(key);
        this.recheckAt.delete(key);
    }
};
exports.SessionLidResolver = SessionLidResolver;
exports.SessionLidResolver = SessionLidResolver = SessionLidResolver_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [engine_registry_service_1.EngineRegistry,
        lid_mapping_store_service_1.LidMappingStoreService])
], SessionLidResolver);
//# sourceMappingURL=session-lid-resolver.service.js.map