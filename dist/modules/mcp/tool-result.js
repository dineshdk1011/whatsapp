"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartToolResult = smartToolResult;
exports.jsonToolResult = jsonToolResult;
exports.handleToolError = handleToolError;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const logger = (0, logger_service_1.createLogger)('Mcp');
function smartToolResult(data) {
    const text = typeof data === 'string' ? data : (JSON.stringify(data) ?? 'null');
    const mimeType = typeof data === 'string' ? 'text/plain' : 'application/json';
    const ext = typeof data === 'string' ? 'txt' : 'json';
    const buffer = Buffer.from(text);
    if (buffer.byteLength > 4096) {
        const uri = `mcp://toolResult/${(0, node_crypto_1.randomUUID)()}.${ext}`;
        return {
            content: [
                { type: 'text', text: `Received resource ${uri} with ${buffer.byteLength} bytes` },
                { type: 'resource', resource: { uri, mimeType, blob: buffer.toString('base64') } },
            ],
        };
    }
    return { content: [{ type: 'text', text }] };
}
function jsonToolResult(data, isError = false) {
    const result = { content: [{ type: 'text', text: JSON.stringify(data) }] };
    if (isError) {
        result.isError = true;
    }
    return result;
}
function handleToolError(error) {
    if (error instanceof common_1.HttpException) {
        if (error.getStatus() >= 500)
            logger.error(error.message, error.stack);
        else
            logger.warn(`MCP tool error ${error.getStatus()}: ${error.message}`);
        const res = error.getResponse();
        const message = typeof res === 'object' && res !== null && 'message' in res
            ? res['message']
            : error.message;
        return jsonToolResult({ success: false, name: error.name, message }, true);
    }
    if (error instanceof Error) {
        logger.error(error.message, error.stack);
        return jsonToolResult({ success: false, name: error.name, message: 'Internal error' }, true);
    }
    logger.error('Unknown tool error', String(error));
    return jsonToolResult({ success: false, name: 'Unknown error', message: 'Internal error' }, true);
}
//# sourceMappingURL=tool-result.js.map