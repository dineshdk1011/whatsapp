"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupportedProxyUrl = isSupportedProxyUrl;
exports.buildProxyLaunchConfig = buildProxyLaunchConfig;
function isSupportedProxyUrl(url) {
    try {
        return ['http:', 'https:', 'socks4:', 'socks5:'].includes(new URL(url).protocol);
    }
    catch {
        return false;
    }
}
function buildProxyLaunchConfig(url) {
    const parsed = new URL(url);
    const serverArg = `${parsed.protocol}//${parsed.host}`;
    let username;
    let password;
    try {
        username = decodeURIComponent(parsed.username);
        password = decodeURIComponent(parsed.password);
    }
    catch {
        throw new Error('The session proxy URL has malformed percent-encoded credentials');
    }
    const hasCredentials = username !== '' || password !== '';
    const isSocks = parsed.protocol === 'socks4:' || parsed.protocol === 'socks5:';
    if (hasCredentials && !isSocks) {
        return { serverArg, proxyAuthentication: { username, password }, socksAuthUnsupported: false };
    }
    return { serverArg, socksAuthUnsupported: hasCredentials && isSocks };
}
//# sourceMappingURL=wwebjs-proxy.js.map