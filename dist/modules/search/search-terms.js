"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainsTermsRefusedError = void 0;
exports.foldSearchText = foldSearchText;
exports.foldForMatching = foldForMatching;
exports.containsTerms = containsTerms;
exports.searchTermCount = searchTermCount;
const common_1 = require("@nestjs/common");
const RUN_CHAR = /^(?![ᦰ-ᧀᧈᧉᳲᳳ])[\p{L}\p{N}]$/u;
function wordsOf(word) {
    let words = 0;
    let inRun = false;
    let stretch = 0;
    let afterRun = false;
    const close = (beforeRun) => {
        if (stretch === 0)
            return;
        const neighbours = (afterRun ? 1 : 0) + (beforeRun ? 1 : 0);
        words += neighbours === 0 ? Math.ceil(stretch / 2) : Math.floor((stretch - (neighbours === 2 ? 1 : 0)) / 2);
        stretch = 0;
    };
    for (const char of word) {
        if (RUN_CHAR.test(char)) {
            close(true);
            if (!inRun)
                words += 1;
            inRun = true;
        }
        else if ((char.codePointAt(0) ?? 0) > 0x7f) {
            if (stretch === 0)
                afterRun = inRun;
            stretch += 1;
            inRun = false;
        }
        else {
            close(false);
            inRun = false;
        }
    }
    close(false);
    return words;
}
function foldSearchText(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC').toLowerCase();
}
function foldForMatching(text) {
    return foldSearchText(text).replace(/ς/g, 'σ');
}
class ContainsTermsRefusedError extends common_1.BadRequestException {
}
exports.ContainsTermsRefusedError = ContainsTermsRefusedError;
function containsTerms(q) {
    const terms = new Map();
    for (const term of q.trim().split(/\s+/)) {
        const folded = foldSearchText(term);
        if (folded && !terms.has(folded))
            terms.set(folded, term);
    }
    return [...terms.values()];
}
function searchTermCount(q) {
    let count = 0;
    for (const word of new Set(q.trim().split(/\s+/))) {
        count += wordsOf(word) || 1;
    }
    return count;
}
//# sourceMappingURL=search-terms.js.map