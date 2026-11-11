"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCodeFromError = statusCodeFromError;
exports.clearDeliveryFailureRows = clearDeliveryFailureRows;
exports.recordWebhookDeliveryFailure = recordWebhookDeliveryFailure;
const typeorm_1 = require("typeorm");
const db_errors_1 = require("../../../common/utils/db-errors");
function statusCodeFromError(message) {
    const m = /^HTTP (\d{3})\b/.exec(message);
    return m ? Number(m[1]) : null;
}
async function clearDeliveryFailureRows(repo, logger, webhookId, idempotencyKey, onlyUnattempted = false) {
    if (!idempotencyKey)
        return;
    try {
        await repo.delete(onlyUnattempted ? { webhookId, idempotencyKey, attempts: 0 } : { webhookId, idempotencyKey });
    }
    catch (err) {
        logger.error('Failed to clear webhook delivery-failure rows', err instanceof Error ? err.message : String(err), {
            webhookId,
            idempotencyKey,
            action: 'webhook_failure_clear_error',
        });
    }
}
async function recordWebhookDeliveryFailure(repo, logger, input) {
    const terminal = input.attempts > 0;
    const refreshTerminal = async () => {
        const updated = await repo.update({ webhookId: input.webhookId, idempotencyKey: input.idempotencyKey, attempts: (0, typeorm_1.MoreThan)(0) }, {
            url: input.url,
            lastError: input.lastError,
            deliveryId: input.deliveryId,
            attempts: () => `"attempts" + ${input.attempts}`,
            lastStatusCode: input.lastStatusCode ?? null,
        });
        if (!updated.affected)
            return null;
        await clearDeliveryFailureRows(repo, logger, input.webhookId, input.idempotencyKey, true);
        return false;
    };
    try {
        if (input.idempotencyKey) {
            const existing = await repo.count({
                where: terminal
                    ? { webhookId: input.webhookId, idempotencyKey: input.idempotencyKey, attempts: (0, typeorm_1.MoreThan)(0) }
                    : { webhookId: input.webhookId, idempotencyKey: input.idempotencyKey },
            });
            if (existing > 0) {
                if (!terminal) {
                    await repo
                        .update({ webhookId: input.webhookId, idempotencyKey: input.idempotencyKey, attempts: 0 }, {
                        lastError: input.lastError,
                        url: input.url,
                        ...(input.deliveryId ? { deliveryId: input.deliveryId } : {}),
                    })
                        .catch((err) => logger.error('Failed to refresh the reason of an unsent webhook delivery', err instanceof Error ? err.message : String(err), {
                        webhookId: input.webhookId,
                        idempotencyKey: input.idempotencyKey,
                        action: 'webhook_failure_record_error',
                    }));
                }
                else {
                    return await refreshTerminal();
                }
                return false;
            }
        }
        const { payload, ...row } = input;
        try {
            await repo.insert({
                ...row,
                lastStatusCode: input.lastStatusCode ?? null,
                ...(terminal && payload ? { payload } : {}),
            });
        }
        catch (error) {
            if (terminal && input.idempotencyKey && (0, db_errors_1.isUniqueViolation)(error))
                return await refreshTerminal();
            throw error;
        }
        if (terminal) {
            await clearDeliveryFailureRows(repo, logger, input.webhookId, input.idempotencyKey, true);
        }
        return true;
    }
    catch (err) {
        logger.error('Failed to persist webhook delivery-failure record', err instanceof Error ? err.message : String(err), { webhookId: input.webhookId, deliveryId: input.deliveryId, action: 'webhook_failure_record_error' });
        return null;
    }
}
//# sourceMappingURL=record-delivery-failure.js.map