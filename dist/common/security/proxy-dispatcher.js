"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxyDispatcher = createProxyDispatcher;
exports.urlFetchProxy = urlFetchProxy;
exports.hasUnauthenticatableSocks4Credentials = hasUnauthenticatableSocks4Credentials;
const net_1 = require("net");
const promises_1 = require("dns/promises");
const socks_1 = require("socks");
const undici_1 = require("undici");
const DEFAULT_DESTINATION_PORTS = { 'https:': 443, 'http:': 80 };
const DEFAULT_SOCKS_PORT = 1080;
async function socksDestinations(type, hostname, pinnedAddresses) {
    const hosts = pinnedAddresses?.length ? pinnedAddresses : [hostname.replace(/^\[|\]$/g, '')];
    if (type === 5) {
        return hosts;
    }
    const ipv4 = hosts.filter(host => (0, net_1.isIP)(host) === 4);
    if (ipv4.length > 0) {
        return ipv4;
    }
    if ((0, net_1.isIP)(hosts[0]) === 6) {
        throw new Error(`A SOCKS4 proxy cannot reach the IPv6 destination ${hosts.join(', ')}`);
    }
    return [(await (0, promises_1.lookup)(hosts[0], { family: 4 })).address];
}
async function connectThroughSocks(proxy, hosts, port) {
    let lastError = new Error('No destination address to reach through the SOCKS proxy');
    for (const host of hosts) {
        try {
            const { socket } = await socks_1.SocksClient.createConnection({ proxy, command: 'connect', destination: { host, port } });
            return socket;
        }
        catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}
function socksConnector(proxyUrl, pinnedAddresses) {
    const type = proxyUrl.protocol === 'socks4:' ? 4 : 5;
    const proxy = {
        host: proxyUrl.hostname.replace(/^\[|\]$/g, ''),
        port: Number(proxyUrl.port) || DEFAULT_SOCKS_PORT,
        type,
        userId: decodeURIComponent(proxyUrl.username) || undefined,
        password: decodeURIComponent(proxyUrl.password) || undefined,
    };
    const upgradeTls = (0, undici_1.buildConnector)({});
    return (options, callback) => {
        let answered = false;
        const answer = (...args) => {
            if (answered)
                return;
            answered = true;
            callback(...args);
        };
        const open = async () => {
            const socket = await connectThroughSocks(proxy, await socksDestinations(type, options.hostname, pinnedAddresses), Number(options.port) || DEFAULT_DESTINATION_PORTS[options.protocol] || 80);
            if (options.protocol === 'https:') {
                upgradeTls({ ...options, httpSocket: socket }, answer);
                return;
            }
            answer(null, socket.setNoDelay());
        };
        open().catch((error) => answer(error, null));
    };
}
function createProxyDispatcher(proxyUrl, options = {}) {
    const url = new URL(proxyUrl);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
        return new undici_1.Dispatcher1Wrapper(new undici_1.ProxyAgent(proxyUrl));
    }
    if (url.protocol === 'socks4:' || url.protocol === 'socks5:') {
        return new undici_1.Dispatcher1Wrapper(new undici_1.Agent({ connect: socksConnector(url, options.pinnedAddresses) }));
    }
    throw new Error(`Unsupported proxy protocol: ${url.protocol}`);
}
function urlFetchProxy(sessionProxyUrl) {
    return process.env.SESSION_PROXY_URL_FETCH === 'false' ? undefined : sessionProxyUrl;
}
function hasUnauthenticatableSocks4Credentials(proxyUrl) {
    const url = new URL(proxyUrl);
    return url.protocol === 'socks4:' && (url.username !== '' || url.password !== '');
}
//# sourceMappingURL=proxy-dispatcher.js.map