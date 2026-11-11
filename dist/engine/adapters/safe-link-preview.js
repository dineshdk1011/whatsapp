"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSafeLinkPreview = generateSafeLinkPreview;
const ssrf_guard_1 = require("../../common/security/ssrf-guard");
const proxy_dispatcher_1 = require("../../common/security/proxy-dispatcher");
async function generateSafeLinkPreview(matchedText, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 3000;
    const maxBytes = opts.maxBytes ?? 512 * 1024;
    const url = normaliseUrl(matchedText);
    if (!url)
        return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await (0, ssrf_guard_1.withSafeFetch)(url, {
            signal: controller.signal,
            headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'WhatsApp/2' },
        }, async (response) => {
            if (!response.ok)
                return undefined;
            const type = response.headers.get('content-type') ?? '';
            if (!type.includes('html') && !type.includes('xml'))
                return undefined;
            const html = await readCapped(response, maxBytes);
            const metas = new Map();
            for (const [, attrs] of html.matchAll(/<meta\b([^<]*)/gi)) {
                const key = (attribute(attrs, 'property') ?? attribute(attrs, 'name'))?.toLowerCase();
                const content = attribute(attrs, 'content');
                if (key && content && !metas.has(key))
                    metas.set(key, content);
            }
            const title = metas.get('og:title') ?? /<title\b[^<>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
            const description = metas.get('og:description') ?? metas.get('description');
            if (!title && !description)
                return undefined;
            return {
                'matched-text': matchedText,
                'canonical-url': url,
                title: title ? decodeEntities(title) : new URL(url).hostname,
                ...(description ? { description: decodeEntities(description) } : {}),
            };
        }, { proxyUrl: (0, proxy_dispatcher_1.urlFetchProxy)(opts.sessionProxyUrl), followRedirects: true });
    }
    catch {
        return undefined;
    }
    finally {
        clearTimeout(timer);
    }
}
function normaliseUrl(matchedText) {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(matchedText);
    if (hasScheme && !/^https?:\/\//i.test(matchedText))
        return undefined;
    try {
        const parsed = new URL(hasScheme ? matchedText : `https://${matchedText}`);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : undefined;
    }
    catch {
        return undefined;
    }
}
async function readCapped(response, maxBytes) {
    const reader = response.body?.getReader();
    if (!reader)
        return (await response.text()).slice(0, maxBytes);
    const decoder = new TextDecoder();
    let out = '';
    let read = 0;
    for (;;) {
        const chunk = await reader.read();
        if (chunk.done)
            break;
        const value = chunk.value.subarray(0, Math.max(0, maxBytes - read));
        read += value.byteLength;
        out += decoder.decode(value, { stream: true });
        if (read >= maxBytes) {
            await reader.cancel();
            break;
        }
    }
    return out;
}
function attribute(attrs, name) {
    const m = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i').exec(attrs);
    return (m?.[1] ?? m?.[2])?.trim();
}
const LATIN1_NAMES = 'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute ' +
    'micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring ' +
    'AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml ' +
    'times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil ' +
    'egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ' +
    'ugrave uacute ucirc uuml yacute thorn yuml';
const NAMED_ENTITIES = new Map([
    ...LATIN1_NAMES.split(' ').map((name, index) => [name, 0xa0 + index]),
    ['nbsp', 0x20],
    ['quot', 0x22],
    ['amp', 0x26],
    ['apos', 0x27],
    ['lt', 0x3c],
    ['gt', 0x3e],
    ['ndash', 0x2013],
    ['mdash', 0x2014],
    ['lsquo', 0x2018],
    ['rsquo', 0x2019],
    ['ldquo', 0x201c],
    ['rdquo', 0x201d],
    ['bull', 0x2022],
    ['hellip', 0x2026],
    ['euro', 0x20ac],
    ['trade', 0x2122],
]);
function decodeEntities(value) {
    return value.replace(/&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g, (whole, decimal, hex, name) => {
        const code = name ? NAMED_ENTITIES.get(name) : decimal ? Number(decimal) : parseInt(hex ?? '', 16);
        if (code === undefined || code < 0x20 || (code >= 0x7f && code <= 0x9f))
            return whole;
        if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff))
            return whole;
        return String.fromCodePoint(code);
    });
}
//# sourceMappingURL=safe-link-preview.js.map