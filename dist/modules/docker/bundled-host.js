"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUNDLED_SERVICE_ENV = void 0;
exports.namesBundledContainer = namesBundledContainer;
exports.BUNDLED_SERVICE_ENV = Object.assign(Object.create(null), {
    postgres: ['DATABASE_HOST', 'postgres'],
    redis: ['REDIS_HOST', 'redis'],
    minio: ['S3_ENDPOINT', 'http://minio:9000'],
});
function namesBundledContainer(profile, value) {
    if (!exports.BUNDLED_SERVICE_ENV[profile] || value === undefined)
        return false;
    let host = value.trim();
    if (profile === 'minio') {
        try {
            host = new URL(host).hostname;
        }
        catch {
            return false;
        }
    }
    host = host.toLowerCase().replace(/\.$/, '');
    return host === profile || host === `openwa-${profile}`;
}
//# sourceMappingURL=bundled-host.js.map