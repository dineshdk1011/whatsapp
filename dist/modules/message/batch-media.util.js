"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripBatchMediaPayloads = stripBatchMediaPayloads;
exports.failUnfinishedSessionBatches = failUnfinishedSessionBatches;
const typeorm_1 = require("typeorm");
const template_render_1 = require("../../common/utils/template-render");
const message_batch_entity_1 = require("./entities/message-batch.entity");
function stripBatchMediaPayloads(messages) {
    for (const m of messages ?? []) {
        for (const key of ['image', 'video', 'audio', 'document']) {
            const media = m.content[key];
            if (media && typeof media === 'object' && 'base64' in media) {
                if (typeof media.base64 === 'string' && m.variables && typeof m.variables === 'object') {
                    for (const name of (0, template_render_1.templateVariableNames)(media.base64))
                        delete m.variables[name];
                }
                delete media.base64;
            }
        }
    }
}
async function failUnfinishedSessionBatches(dataSource, sessionId) {
    const batches = dataSource.getRepository(message_batch_entity_1.MessageBatch);
    const unfinished = await batches.find({
        where: { sessionId, status: (0, typeorm_1.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]) },
    });
    for (const batch of unfinished) {
        stripBatchMediaPayloads(batch.messages);
        await batches.update({ id: batch.id, status: (0, typeorm_1.In)([message_batch_entity_1.BatchStatus.PENDING, message_batch_entity_1.BatchStatus.PROCESSING]) }, {
            status: message_batch_entity_1.BatchStatus.FAILED,
            completedAt: new Date(),
            messages: batch.messages,
        });
    }
}
//# sourceMappingURL=batch-media.util.js.map