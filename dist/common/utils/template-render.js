"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRenderError = void 0;
exports.templateVariableNames = templateVariableNames;
exports.renderTemplate = renderTemplate;
exports.renderedLength = renderedLength;
const PLACEHOLDER_PATTERN = /\{\{\s*([\w.-]+)\s*\}\}|\{(\w+)\}/g;
function templateVariableNames(body) {
    return Array.from(body.matchAll(PLACEHOLDER_PATTERN), match => match[1] ?? match[2]);
}
class TemplateRenderError extends Error {
}
exports.TemplateRenderError = TemplateRenderError;
function substitution(vars, key, seen) {
    if (key === undefined)
        return undefined;
    if (seen.has(key))
        return seen.get(key);
    let text;
    if (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null) {
        try {
            text = String(vars[key]);
        }
        catch {
            throw new TemplateRenderError(`Variable '${key}' cannot be rendered as text`);
        }
    }
    seen.set(key, text);
    return text;
}
function renderTemplate(body, vars = {}) {
    if (!body || !body.includes('{')) {
        return body;
    }
    const seen = new Map();
    return body.replace(PLACEHOLDER_PATTERN, (match, doubleKey, singleKey) => substitution(vars, doubleKey ?? singleKey, seen) ?? match);
}
function renderedLength(body, vars = {}) {
    if (!body || !body.includes('{')) {
        return body ? body.length : 0;
    }
    let length = body.length;
    const seen = new Map();
    for (const match of body.matchAll(PLACEHOLDER_PATTERN)) {
        const text = substitution(vars, match[1] ?? match[2], seen);
        if (text !== undefined)
            length += text.length - match[0].length;
    }
    return length;
}
//# sourceMappingURL=template-render.js.map