"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WwebjsContacts = void 0;
exports.readLeanContacts = readLeanContacts;
exports.readCurrentLid = readCurrentLid;
const common_1 = require("@nestjs/common");
const engine_not_ready_error_1 = require("../../common/errors/engine-not-ready.error");
const engine_transport_error_1 = require("../../common/errors/engine-transport.error");
const wa_id_1 = require("../identity/wa-id");
const whatsapp_web_js_types_1 = require("../types/whatsapp-web-js.types");
const wwebjs_host_1 = require("./wwebjs-host");
const wwebjs_lifecycle_1 = require("./wwebjs-lifecycle");
async function readLeanContacts() {
    const w = window;
    const models = w.require('WAWebCollections').Contact.getModelsArray().slice();
    const rows = [];
    let failed = 0;
    let firstError;
    for (let i = 0; i < models.length; i++) {
        try {
            const m = w.WWebJS.getContactModel(models[i]);
            rows.push({
                id: m.id,
                name: m.name,
                pushname: m.pushname,
                number: m.userid,
                isMyContact: m.isMyContact,
                isBlocked: m.isBlocked,
            });
        }
        catch (error) {
            failed++;
            if (firstError === undefined)
                firstError = error instanceof Error ? error.message : String(error);
        }
        if ((i & 0xff) === 0xff)
            await new Promise(resolve => setTimeout(resolve));
    }
    return { rows, failed, firstError };
}
function readCurrentLid(phoneId) {
    const w = window;
    const lid = w.require('WAWebApiContact').getCurrentLid(w.require('WAWebWidFactory').createWid(phoneId));
    return lid?._serialized || lid?.$1 || null;
}
class WwebjsContacts {
    host;
    constructor(host) {
        this.host = host;
    }
    client() {
        return this.host.getClient();
    }
    toContact(c) {
        const id = (0, whatsapp_web_js_types_1.readWid)(c.id);
        if (!id)
            return null;
        return {
            id,
            name: c.name || undefined,
            pushName: c.pushname || undefined,
            number: (0, wa_id_1.parseWaId)(id).kind === 'user' ? (0, wa_id_1.userPart)(id) : c.number,
            isMyContact: c.isMyContact,
            isBlocked: c.isBlocked,
        };
    }
    static mergeById(contacts) {
        const byId = new Map();
        for (const c of contacts) {
            const first = byId.get(c.id);
            byId.set(c.id, first
                ? {
                    ...first,
                    name: first.name ?? c.name,
                    pushName: first.pushName ?? c.pushName,
                    isMyContact: first.isMyContact || c.isMyContact,
                    isBlocked: first.isBlocked || c.isBlocked,
                }
                : c);
        }
        return [...byId.values()];
    }
    async getContacts() {
        this.host.ensureReady();
        let raw;
        let unreadable;
        let firstError;
        try {
            const page = this.client()
                .pupPage;
            const read = await page?.evaluate(readLeanContacts);
            raw = (read?.rows ?? []);
            unreadable = read?.failed ?? 0;
            firstError = read?.firstError;
        }
        catch (error) {
            (0, wwebjs_host_1.rethrowIfNavigation)(this.host, error);
            if (this.host.isPageTransportError(error)) {
                this.host.reportIfPageTransportError(error, 'getContacts');
                throw new engine_transport_error_1.EngineTransportError('Transport died while reading contacts');
            }
            if ((0, wwebjs_lifecycle_1.isProtocolTimeout)(error)) {
                throw new engine_transport_error_1.EngineTransportError('WhatsApp Web did not answer the contact list read in time');
            }
            throw error;
        }
        const contacts = [];
        let skipped = 0;
        for (const c of raw) {
            const mapped = this.toContact(c);
            if (!mapped) {
                skipped++;
                continue;
            }
            contacts.push(mapped);
        }
        if ((unreadable > 0 && !contacts.some(c => !c.isBlocked)) || (contacts.length === 0 && skipped > 0)) {
            const reason = `WhatsApp Web could not read any unblocked contact (${unreadable} failed, ${skipped} without an id, ` +
                `${contacts.length} blocked read)${firstError ? `: ${firstError}` : ''}`;
            this.host.logger.error(reason);
            throw new common_1.InternalServerErrorException(reason);
        }
        if (skipped > 0) {
            this.host.logger.warn(`Skipped ${skipped} contact(s) without a serialized id`);
        }
        if (unreadable > 0) {
            this.host.logger.warn(`Skipped ${unreadable} contact(s) WhatsApp Web could not read`, { error: firstError });
        }
        return WwebjsContacts.mergeById(contacts);
    }
    async getContactById(contactId) {
        this.host.ensureReady();
        try {
            const contact = await this.client().getContactById(contactId);
            return this.toContact(contact);
        }
        catch (error) {
            (0, wwebjs_host_1.rethrowIfNavigation)(this.host, error);
            if (this.host.isPageTransportError(error)) {
                this.host.reportIfPageTransportError(error, 'getContactById');
                throw new engine_transport_error_1.EngineTransportError(`Transport died while reading contact ${contactId}`);
            }
            if ((0, wwebjs_lifecycle_1.isProtocolTimeout)(error)) {
                throw new engine_transport_error_1.EngineTransportError(`WhatsApp Web did not answer the read of contact ${contactId} in time`);
            }
            this.host.logger.warn(`Failed to get contact: ${contactId}`, { error: String(error) });
            return null;
        }
    }
    async lookupNumberId(number) {
        this.host.ensureReady();
        const numberId = await (0, wwebjs_host_1.withPage)(this.host, 'getNumberId', () => this.client().getNumberId(number));
        return (0, whatsapp_web_js_types_1.readWid)(numberId) ?? null;
    }
    async getNumberId(number) {
        const wid = await this.lookupNumberId(number);
        if (!wid?.endsWith('@lid'))
            return wid;
        const typed = `${(0, wa_id_1.userPart)(number).replace(/\D/g, '')}@c.us`;
        try {
            const phone = await (0, wwebjs_host_1.withPage)(this.host, 'getNumberId', () => this.resolveContactPhone(wid));
            return phone ? `${phone}@c.us` : typed;
        }
        catch (error) {
            if (error instanceof engine_not_ready_error_1.EngineNotReadyError || error instanceof engine_transport_error_1.EngineTransportError)
                throw error;
            this.host.logger.debug('Could not read the phone of a migrated number, answering the typed number', {
                error: String(error),
            });
            return typed;
        }
    }
    async checkNumberExists(number) {
        return (await this.lookupNumberId(number)) !== null;
    }
    async resolveContactPhone(contactId) {
        this.host.ensureReady();
        const [result] = await this.client().getContactLidAndPhone([contactId]);
        const pn = result?.pn;
        return pn ? pn.replace(/@c\.us$/i, '').replace(/\D/g, '') || null : null;
    }
    async upsertContact(contactId, firstName, lastName = '') {
        this.host.ensureReady();
        await (0, wwebjs_host_1.withPage)(this.host, 'upsertContact', () => this.client().saveOrEditAddressbookContact((0, wa_id_1.userPart)(contactId), firstName, lastName));
        this.host.logger.debug('Saved addressbook contact', { contactId });
    }
    async deleteContact(contactId) {
        this.host.ensureReady();
        await (0, wwebjs_host_1.withPage)(this.host, 'deleteContact', () => this.client().deleteAddressbookContact((0, wa_id_1.userPart)(contactId)));
        this.host.logger.debug('Deleted addressbook contact', { contactId });
    }
    async blockContact(contactId) {
        this.host.ensureReady();
        await (0, wwebjs_host_1.withPage)(this.host, 'blockContact', async () => {
            const contact = await this.client().getContactById(contactId);
            this.host.ensureReady();
            await contact.block();
        });
        this.host.logger.debug('Blocked contact', { contactId });
    }
    async getBlockedContacts() {
        this.host.ensureReady();
        const contacts = await (0, wwebjs_host_1.withPage)(this.host, 'getBlockedContacts', () => this.client().getBlockedContacts());
        const ids = contacts.map(c => (0, whatsapp_web_js_types_1.readWid)(c.id)).filter((id) => Boolean(id));
        return [...new Set(ids)];
    }
    async unblockContact(contactId) {
        this.host.ensureReady();
        await (0, wwebjs_host_1.withPage)(this.host, 'unblockContact', async () => {
            const contact = await this.client().getContactById(contactId);
            this.host.ensureReady();
            await contact.unblock();
        });
        this.host.logger.debug('Unblocked contact', { contactId });
    }
    async getProfilePicture(contactId) {
        this.host.ensureReady();
        const byLid = (0, wa_id_1.parseWaId)(contactId).kind === 'user';
        let url;
        try {
            url = await this.client().getProfilePicUrl(contactId);
        }
        catch (error) {
            (0, wwebjs_host_1.rethrowIfNavigation)(this.host, error);
            const pageDown = this.host.isPageTransportError(error) || (0, wwebjs_lifecycle_1.isProtocolTimeout)(error);
            const viaLid = byLid && !pageDown ? await this.profilePictureByLid(contactId) : undefined;
            if (viaLid)
                return viaLid;
            this.host.reportIfPageTransportError(error, 'getProfilePicture');
            this.host.logger.warn(`Failed to get profile picture for ${contactId}: ${String(error)}`);
            throw new engine_transport_error_1.EngineTransportError(`Could not read the profile picture for ${contactId}: ${String(error)}`);
        }
        return url || (byLid ? await this.profilePictureByLid(contactId) : undefined) || null;
    }
    async profilePictureByLid(phoneId) {
        try {
            const page = this.client().pupPage;
            const lid = await page?.evaluate(readCurrentLid, phoneId);
            if (!lid)
                return undefined;
            return (await this.client().getProfilePicUrl(lid)) || undefined;
        }
        catch (error) {
            if (error instanceof engine_not_ready_error_1.EngineNotReadyError)
                throw error;
            this.host.reportIfPageTransportError(error, 'getProfilePicture');
            this.host.logger.debug('Could not read a profile picture by its LID', { error: String(error) });
            return undefined;
        }
    }
}
exports.WwebjsContacts = WwebjsContacts;
//# sourceMappingURL=wwebjs-contacts.js.map