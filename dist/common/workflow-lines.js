"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executableLines = executableLines;
exports.executableLinesConservative = executableLinesConservative;
function executableLines(run) {
    return withoutComments(run, /[ \t;&|(]/);
}
function executableLinesConservative(run) {
    return withoutComments(run, /[\s;&|()<>`]/);
}
function withoutComments(run, before) {
    return run
        .split('\n')
        .map(line => {
        const hash = commentStart(line, before);
        return hash === -1 ? line : line.slice(0, hash);
    })
        .join('\n');
}
function commentStart(line, before) {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quote) {
            if (char === '\\' && quote === '"')
                i++;
            else if (char === quote)
                quote = null;
        }
        else if (char === '\\') {
            i++;
        }
        else if (char === '"' || char === "'") {
            quote = char;
        }
        else if (char === '#' && (i === 0 || before.test(line[i - 1]))) {
            return i;
        }
    }
    return -1;
}
//# sourceMappingURL=workflow-lines.js.map