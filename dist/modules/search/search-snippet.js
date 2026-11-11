"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsSnippet = containsSnippet;
const search_terms_1 = require("./search-terms");
const WORDS_BEFORE_MATCH = 8;
const FOLD_UNIT = /[\u1100-\u115f]+[\u1160-\u11a7]*[\u11a8-\u11ff]*\p{M}*|[\s\S]\p{M}*/gu;
function foldWithOffsets(text) {
    let folded = '';
    const starts = [];
    const ends = [];
    for (const { 0: unit, index } of text.matchAll(FOLD_UNIT)) {
        const mapped = (0, search_terms_1.foldForMatching)(unit);
        for (let i = 0; i < mapped.length; i++) {
            starts.push(index);
            ends.push(index + unit.length);
        }
        folded += mapped;
    }
    return { folded, starts, ends };
}
function matchRanges(body, terms) {
    const { folded, starts, ends } = foldWithOffsets(body);
    const ranges = [];
    for (const term of terms.map(search_terms_1.foldForMatching).filter(Boolean)) {
        for (let at = folded.indexOf(term); at !== -1; at = folded.indexOf(term, at + term.length)) {
            ranges.push([starts[at], ends[at + term.length - 1]]);
        }
    }
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const [start, end] of ranges) {
        const last = merged[merged.length - 1];
        if (last && start <= last[1])
            last[1] = Math.max(last[1], end);
        else
            merged.push([start, end]);
    }
    return merged;
}
function containsSnippet(body, terms, maxWords) {
    const words = [...body.matchAll(/\S+/g)];
    if (words.length === 0)
        return '';
    const ranges = matchRanges(body, terms);
    const firstHit = ranges.length ? words.findIndex(w => (w.index ?? 0) + w[0].length > ranges[0][0]) : 0;
    const before = Math.min(WORDS_BEFORE_MATCH, maxWords - 1);
    const from = Math.max(0, Math.min(firstHit - before, words.length - maxWords));
    const to = Math.min(words.length, from + maxWords);
    const sliceStart = words[from].index ?? 0;
    const sliceEnd = (words[to - 1].index ?? 0) + words[to - 1][0].length;
    let snippet = from > 0 ? '…' : '';
    let cursor = sliceStart;
    for (const [start, end] of ranges) {
        if (end <= sliceStart || start >= sliceEnd)
            continue;
        const markStart = Math.max(start, sliceStart);
        const markEnd = Math.min(end, sliceEnd);
        snippet += `${body.slice(cursor, markStart)}<mark>${body.slice(markStart, markEnd)}</mark>`;
        cursor = markEnd;
    }
    snippet += body.slice(cursor, sliceEnd);
    return to < words.length ? `${snippet}…` : snippet;
}
//# sourceMappingURL=search-snippet.js.map