"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIp = normalizeIp;
exports.resolveClientIp = resolveClientIp;
exports.limiterKeyForIp = limiterKeyForIp;
exports.isIpOrCidrEntry = isIpOrCidrEntry;
exports.invalidTrustedProxies = invalidTrustedProxies;
exports.parseTrustedProxies = parseTrustedProxies;
exports.ipMatches = ipMatches;
const net_1 = require("net");
const throttler_1 = require("@nestjs/throttler");
function normalizeIp(ip) {
    if (!ip)
        return ip;
    const match = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
    return match ? match[1] : ip;
}
function resolveClientIp(req, trustedProxies) {
    const socketIp = normalizeIp(req.socket?.remoteAddress || req.ip || '');
    if (!trustedProxies || trustedProxies.length === 0) {
        return socketIp;
    }
    const isTrusted = (ip) => trustedProxies.some(proxy => ipMatches(ip, proxy));
    if (!isTrusted(socketIp)) {
        return socketIp;
    }
    const forwarded = req.headers['x-forwarded-for'];
    if (!forwarded) {
        return socketIp;
    }
    const hops = (Array.isArray(forwarded) ? forwarded.join(',') : forwarded)
        .split(',')
        .map(hop => normalizeIp(stripHopPort(hop.trim())))
        .filter(Boolean);
    for (let i = hops.length - 1; i >= 0; i--) {
        if (!isTrusted(hops[i])) {
            return hops[i];
        }
    }
    return socketIp;
}
function stripHopPort(hop) {
    const v4 = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(hop);
    if (v4)
        return v4[1];
    const v6 = /^\[([0-9a-f:.]+)\](?::\d+)?$/i.exec(hop);
    return v6 ? v6[1] : hop;
}
function limiterKeyForIp(ip) {
    return (0, throttler_1.normalizeIp)(ip, 64);
}
function parseIpTarget(entry) {
    const ref = (entry || '').trim();
    const slash = ref.indexOf('/');
    const address = normalizeIp(slash === -1 ? ref : ref.slice(0, slash));
    const family = (0, net_1.isIP)(address);
    if (family === 0)
        return null;
    const type = family === 6 ? 'ipv6' : 'ipv4';
    if (slash === -1)
        return { address, type };
    const bitsRaw = ref.slice(slash + 1);
    if (!/^\d{1,3}$/.test(bitsRaw))
        return null;
    const bits = Number(bitsRaw);
    if (bits > (family === 6 ? 128 : 32))
        return null;
    return { address, type, bits };
}
function isIpOrCidrEntry(entry) {
    return parseIpTarget(entry) !== null;
}
function invalidTrustedProxies(raw) {
    return parseTrustedProxies(raw).filter(entry => !isIpOrCidrEntry(entry));
}
function parseTrustedProxies(raw) {
    return (raw || '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
}
function ipMatches(ip, target) {
    const candidate = normalizeIp((ip || '').trim());
    const parsed = parseIpTarget(target);
    if (!parsed || (0, net_1.isIP)(candidate) !== (parsed.type === 'ipv6' ? 6 : 4))
        return false;
    try {
        const list = new net_1.BlockList();
        if (parsed.bits === undefined)
            list.addAddress(parsed.address, parsed.type);
        else
            list.addSubnet(parsed.address, parsed.bits, parsed.type);
        return list.check(candidate, parsed.type);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=ip.js.map