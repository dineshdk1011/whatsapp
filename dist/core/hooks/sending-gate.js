"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySendingGate = applySendingGate;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('SendingGate');
async function applySendingGate(hookManager, sessionId, type, input, source) {
    const { continue: shouldContinue, data: hookData } = await hookManager.execute('message:sending', { sessionId, input, type }, { sessionId, source });
    if (!shouldContinue) {
        throw new common_1.BadRequestException('Message sending blocked by plugin');
    }
    if (hookData === undefined) {
        return input;
    }
    const envelope = hookData;
    if (typeof envelope !== 'object' ||
        envelope === null ||
        typeof envelope.input !== 'object' ||
        envelope.input === null) {
        logger.warn('A message:sending handler returned a payload without a usable `input`; refusing the send', {
            sessionId,
            source,
            type,
            received: hookData === null ? 'null' : typeof hookData,
        });
        throw new common_1.BadRequestException('A message:sending handler returned a payload without a usable `input`; the send was refused rather than sent unmoderated');
    }
    return envelope.input;
}
//# sourceMappingURL=sending-gate.js.map