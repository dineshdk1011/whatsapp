"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVCard = buildVCard;
function buildVCard(contact) {
    const clean = (s) => s.replace(/[\r\n]+/g, ' ');
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const name = clean(contact.name);
    const number = clean(contact.number);
    const waid = number.replace(/\D/g, '');
    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${esc(name)}`,
        `TEL;type=CELL;type=VOICE;waid=${waid}:${number}`,
        'END:VCARD',
    ].join('\n');
}
//# sourceMappingURL=vcard.js.map