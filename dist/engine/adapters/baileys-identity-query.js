"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryLidPhone = queryLidPhone;
const wa_id_1 = require("../identity/wa-id");
const baileys_query_deadline_1 = require("./baileys-query-deadline");
async function queryLidPhone(socket, library, phone, lid, budgetMs) {
    const query = new library.USyncQuery()
        .withLIDProtocol()
        .withContext('background')
        .withUser(new library.USyncUser().withId(`${phone}@s.whatsapp.net`));
    const result = await (0, baileys_query_deadline_1.withQueryDeadline)(socket.executeUSyncQuery(query), budgetMs, 'WhatsApp did not answer the LID identity query in time');
    const matches = result?.list.filter(row => (0, wa_id_1.parseWaId)(row.id).kind === 'user' && (0, wa_id_1.userPart)(row.id) === phone);
    return (matches?.length === 1 &&
        typeof matches[0].lid === 'string' &&
        (0, wa_id_1.parseWaId)(matches[0].lid).kind === 'lid' &&
        (0, wa_id_1.userPart)(matches[0].lid) === lid);
}
//# sourceMappingURL=baileys-identity-query.js.map