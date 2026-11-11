"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveJidCandidates = resolveJidCandidates;
const wa_id_1 = require("./wa-id");
async function resolveJidCandidates(value, directory) {
    const parsed = (0, wa_id_1.parseWaId)(value);
    if (parsed.kind === 'group')
        return [`${parsed.userPart}@g.us`];
    if (parsed.kind !== 'user' && parsed.kind !== 'lid' && (parsed.kind !== 'unknown' || value.includes('@'))) {
        return [value];
    }
    if (parsed.kind === 'lid') {
        const candidates = new Set([`${parsed.userPart}@lid`]);
        const resolved = await directory?.resolveLid(parsed.userPart);
        if (resolved) {
            candidates.add(`${resolved}@c.us`);
            candidates.add(`${resolved}@s.whatsapp.net`);
        }
        return [...candidates];
    }
    const phone = parsed.userPart;
    const candidates = new Set([value, `${phone}@c.us`, `${phone}@s.whatsapp.net`]);
    for (const lid of (await directory?.lidsForPhone(phone)) ?? []) {
        candidates.add(`${lid}@lid`);
    }
    return [...candidates];
}
//# sourceMappingURL=jid-candidates.js.map