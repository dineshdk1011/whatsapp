"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripBase64DataUri = stripBase64DataUri;
exports.assertBase64WithinMediaCap = assertBase64WithinMediaCap;
exports.assertBase64LengthWithinMediaCap = assertBase64LengthWithinMediaCap;
exports.resolveMediaBody = resolveMediaBody;
const common_1 = require("@nestjs/common");
const engine_1 = require("../../engine");
const media_url_1 = require("../../common/media/media-url");
function stripBase64DataUri(base64) {
    if (base64 == null)
        return undefined;
    const match = /^data:[^,]*;base64,/i.exec(base64);
    return match ? base64.slice(match[0].length) : base64;
}
function assertBase64WithinMediaCap(base64, capBytes) {
    const normalized = stripBase64DataUri(base64);
    if (!normalized) {
        return;
    }
    const maxBytes = Math.min(capBytes ?? Number.POSITIVE_INFINITY, (0, engine_1.inboundMediaMaxBytes)());
    if (Buffer.byteLength(normalized, 'base64') > maxBytes) {
        throw new common_1.PayloadTooLargeException(`Base64 media exceeds the maximum allowed size of ${maxBytes} bytes`);
    }
}
const DATA_URI_PREFIX_ALLOWANCE_CHARS = 256;
function assertBase64LengthWithinMediaCap(chars) {
    const maxBytes = (0, engine_1.inboundMediaMaxBytes)();
    if (Math.floor(((chars - DATA_URI_PREFIX_ALLOWANCE_CHARS) * 3) / 4) > maxBytes) {
        throw new common_1.PayloadTooLargeException(`Base64 media exceeds the maximum allowed size of ${maxBytes} bytes`);
    }
}
function resolveMediaBody(body, options) {
    const base64 = stripBase64DataUri(body?.base64);
    const url = body?.url;
    if (!url && !base64) {
        throw new common_1.BadRequestException('Either url or base64 must be provided');
    }
    if (options.checkUrl && !base64 && !(0, media_url_1.isMediaUrl)(url)) {
        throw new common_1.BadRequestException(media_url_1.MEDIA_URL_MESSAGE);
    }
    if (options.requireMimetypeForBase64 && base64 && !body?.mimetype) {
        throw new common_1.BadRequestException('mimetype is required when using base64 data');
    }
    assertBase64WithinMediaCap(base64);
    return { mimetype: body?.mimetype || options.fallbackMimetype, data: base64 || url };
}
//# sourceMappingURL=media-cap.util.js.map