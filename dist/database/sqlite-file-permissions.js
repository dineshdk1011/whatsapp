"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlitePermissionsBoot = void 0;
exports.tightenSqliteFilePermissions = tightenSqliteFilePermissions;
const fs_1 = require("fs");
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../common/services/logger.service");
const config_1 = require("@nestjs/config");
const SIDECAR_SUFFIXES = ['-wal', '-shm', '-journal'];
function tightenSqliteFilePermissions(paths, warn) {
    const tightened = [];
    for (const path of paths) {
        for (const candidate of [path, ...SIDECAR_SUFFIXES.map(suffix => `${path}${suffix}`)]) {
            if (!(0, fs_1.existsSync)(candidate))
                continue;
            try {
                (0, fs_1.chmodSync)(candidate, 0o600);
                tightened.push(candidate);
            }
            catch (error) {
                warn(`Could not tighten ${candidate} to owner-only permissions: ` +
                    `${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    return tightened;
}
let SqlitePermissionsBoot = class SqlitePermissionsBoot {
    config;
    logger = (0, logger_service_1.createLogger)('SqlitePermissions');
    constructor(config) {
        this.config = config;
    }
    onApplicationBootstrap() {
        const paths = [this.config.get('database.database', './data/main.sqlite')];
        if (this.config.get('dataDatabase.type', 'sqlite') !== 'postgres') {
            paths.push(this.config.get('dataDatabase.database', './data/openwa.sqlite'));
        }
        tightenSqliteFilePermissions(paths, message => this.logger.warn(message));
    }
};
exports.SqlitePermissionsBoot = SqlitePermissionsBoot;
exports.SqlitePermissionsBoot = SqlitePermissionsBoot = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SqlitePermissionsBoot);
//# sourceMappingURL=sqlite-file-permissions.js.map