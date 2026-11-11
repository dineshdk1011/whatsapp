"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsScore = containsScore;
const search_terms_1 = require("./search-terms");
function containsScore(body, terms) {
    const folded = (0, search_terms_1.foldForMatching)(body);
    let score = 0;
    for (const term of terms.map(search_terms_1.foldForMatching)) {
        let best = 0;
        for (let at = folded.indexOf(term); at !== -1 && best < 3; at = folded.indexOf(term, at + 1)) {
            const startsWord = !isWordChar(folded[at - 1]);
            const endsWord = !isWordChar(folded[at + term.length]);
            best = Math.max(best, startsWord && endsWord ? 3 : startsWord ? 2 : 1);
        }
        score += best;
    }
    return score;
}
function isWordChar(char) {
    return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}
//# sourceMappingURL=search-score.js.map