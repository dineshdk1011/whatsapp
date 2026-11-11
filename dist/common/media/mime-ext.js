"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extFromMimetype = extFromMimetype;
const MIME_SUBTYPE_EXT_OVERRIDES = { jpeg: 'jpg', quicktime: 'mov' };
function extFromMimetype(mimetype) {
    const subtype = mimetype.split('/')[1]?.split(';')[0]?.trim().toLowerCase();
    if (!subtype || !/^[a-z0-9]+$/.test(subtype))
        return 'bin';
    return Object.hasOwn(MIME_SUBTYPE_EXT_OVERRIDES, subtype) ? MIME_SUBTYPE_EXT_OVERRIDES[subtype] : subtype;
}
//# sourceMappingURL=mime-ext.js.map