"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWid = readWid;
function readWid(wid) {
    if (typeof wid === 'string')
        return wid || undefined;
    return wid?._serialized ?? wid?.$1 ?? undefined;
}
//# sourceMappingURL=whatsapp-web-js.types.js.map