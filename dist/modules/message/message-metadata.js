"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMessageMetadata = updateMessageMetadata;
exports.mergeSentMetadata = mergeSentMetadata;
const typeorm_1 = require("typeorm");
async function updateMessageMetadata(repository, where, change) {
    const target = { ...where, type: (0, typeorm_1.Not)('revoked') };
    for (let attempt = 0; attempt < 3; attempt++) {
        const row = await repository.findOne({ where: target });
        if (!row)
            return null;
        const snapshot = row.metadata;
        const metadata = change({ ...snapshot });
        const result = await repository.update({
            ...target,
            metadata: snapshot == null ? (0, typeorm_1.IsNull)() : (0, typeorm_1.Raw)(column => `${column} = :snapshot`, { snapshot: JSON.stringify(snapshot) }),
        }, { metadata: metadata });
        if (result.affected)
            return metadata;
    }
    throw new Error('Message metadata changed repeatedly during update');
}
function mergeSentMetadata(current, incoming) {
    const media = current.media;
    return { ...current, ...incoming, ...(media?.archived && media.omitted ? { media } : {}) };
}
//# sourceMappingURL=message-metadata.js.map