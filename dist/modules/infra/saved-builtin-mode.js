"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectiveBuiltInFlag = effectiveBuiltInFlag;
exports.savedBuiltInMode = savedBuiltInMode;
const env_precedence_1 = require("../../config/env-precedence");
const docker_1 = require("../docker");
const SERVICES = {
    database: {
        flag: 'POSTGRES_BUILTIN',
        host: 'DATABASE_HOST',
        profile: 'postgres',
        selection: 'DATABASE_TYPE',
        selected: 'postgres',
    },
    redis: {
        flag: 'REDIS_BUILTIN',
        host: 'REDIS_HOST',
        profile: 'redis',
        selection: 'REDIS_ENABLED',
        selected: 'true',
    },
    storage: {
        flag: 'MINIO_BUILTIN',
        host: 'S3_ENDPOINT',
        profile: 'minio',
        selection: 'STORAGE_TYPE',
        selected: 's3',
    },
};
function flagValue(service, saved) {
    const flag = SERVICES[service].flag;
    return (0, env_precedence_1.isEnvPinned)(flag) ? process.env[flag] : saved[flag];
}
function effectiveBuiltInFlag(service, saved) {
    return flagValue(service, saved) === 'true';
}
function savedBuiltInMode(service, saved) {
    const spec = SERVICES[service];
    if ((0, env_precedence_1.isEnvPinned)(spec.host)) {
        return { builtIn: (0, docker_1.namesBundledContainer)(spec.profile, process.env[spec.host]), builtInSet: false };
    }
    const flagPinned = (0, env_precedence_1.isEnvPinned)(spec.flag);
    const flag = flagValue(service, saved);
    const selectedInFile = saved[spec.selection] === spec.selected;
    const dialsBundled = (0, docker_1.namesBundledContainer)(spec.profile, saved[spec.host]);
    if (flag !== 'true' && dialsBundled)
        return { builtIn: true, builtInSet: false };
    return { builtIn: dialsBundled, builtInSet: flag !== undefined && (flagPinned || selectedInFile) };
}
//# sourceMappingURL=saved-builtin-mode.js.map