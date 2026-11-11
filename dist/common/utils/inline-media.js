"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WEBHOOK_MEDIA_INLINE_MAX_BYTES = void 0;
exports.shedInlineMedia = shedInlineMedia;
exports.DEFAULT_WEBHOOK_MEDIA_INLINE_MAX_BYTES = 1024 * 1024;
function shedInlineMedia(data, maxBytes) {
    if (!data || typeof data !== 'object')
        return data;
    const media = data.media;
    if (!media || typeof media !== 'object' || typeof media.data !== 'string' || media.data.length === 0) {
        return data;
    }
    const sizeBytes = Buffer.byteLength(media.data, 'base64');
    if (sizeBytes <= maxBytes)
        return data;
    return {
        ...data,
        media: {
            mimetype: media.mimetype,
            ...(typeof media.filename === 'string' ? { filename: media.filename } : {}),
            omitted: true,
            sizeBytes,
        },
    };
}
//# sourceMappingURL=inline-media.js.map