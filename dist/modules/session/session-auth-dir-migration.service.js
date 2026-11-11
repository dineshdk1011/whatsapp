"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionAuthDirMigration = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("./entities/session.entity");
const auth_dir_paths_1 = require("../../engine/auth-dir-paths");
const path_safety_1 = require("../../common/utils/path-safety");
const logger_service_1 = require("../../common/services/logger.service");
let SessionAuthDirMigration = class SessionAuthDirMigration {
    sessionRepository;
    configService;
    logger = (0, logger_service_1.createLogger)('SessionAuthDirMigration');
    constructor(sessionRepository, configService) {
        this.sessionRepository = sessionRepository;
        this.configService = configService;
    }
    async onModuleInit() {
        const rows = await this.sessionRepository.find({ select: { id: true, name: true } });
        if (rows.length === 0)
            return;
        const sessions = rows.filter(row => (0, path_safety_1.isSafeSessionName)(row.name) && (0, path_safety_1.isSafeSessionName)(row.id));
        if (sessions.length < rows.length) {
            this.logger.warn(`Skipped ${rows.length - sessions.length} session(s) whose name or id is not a safe auth-directory key; ` +
                'their auth directories stay where they are and those sessions start at a QR code.', { action: 'auth_dir_migration_unsafe_key' });
        }
        const ids = new Set(rows.map(row => row.id));
        const sessionDataPath = this.configService.get('engine.sessionDataPath') ?? './data/sessions';
        const authDir = this.configService.get('engine.baileys.authDir') ?? './data/baileys';
        const found = [
            ...this.migrateBase('whatsapp-web.js', sessions, ids, path.resolve(sessionDataPath), key => (0, auth_dir_paths_1.wwjsAuthDir)(sessionDataPath, key)),
            ...this.migrateBase('baileys', sessions, ids, authDir, key => (0, auth_dir_paths_1.baileysAuthDir)(authDir, key)),
        ];
        this.warnOnCaseCollisions(sessions, new Set(found));
    }
    migrateBase(engine, sessions, ids, base, dirFor) {
        let entries;
        try {
            entries = (0, auth_dir_paths_1.readAuthDirEntries)(base);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.warn(`Could not list the ${engine} auth directory, so no session was migrated under it`, {
                    action: 'auth_dir_migration_unreadable',
                    engine,
                    base,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return [];
        }
        const entry = (key) => path.basename(dirFor(key));
        const owners = new Map(sessions.map(row => [row.id, row]));
        const idNamed = new Set();
        const rest = [];
        for (const session of sessions) {
            if (!ids.has(session.name)) {
                rest.push(session);
                continue;
            }
            const owner = owners.get(session.name);
            if (owner && entries.has(entry(owner.name)) && !entries.has(entry(session.id)))
                idNamed.add(session);
        }
        const found = [];
        for (const session of [...idNamed, ...rest]) {
            const legacy = entry(session.name);
            const target = entry(session.id);
            if (legacy === target || !entries.has(legacy))
                continue;
            found.push(session.name);
            if (entries.has(target)) {
                this.logger.warn(`Session "${session.name}" has both a legacy and an id-keyed ${engine} auth directory; ` +
                    `keeping both and using the id-keyed one. Remove "${path.join(base, legacy)}" once you have ` +
                    'confirmed the session links correctly.', { sessionId: session.id, action: 'auth_dir_migration_conflict', engine, legacy, target });
                continue;
            }
            try {
                fs.renameSync(path.join(base, legacy), path.join(base, target));
                entries.delete(legacy);
                entries.add(target);
                this.logger.log(`Moved the ${engine} auth directory of session "${session.name}" onto its session id`, {
                    sessionId: session.id,
                    action: 'auth_dir_migrated',
                    engine,
                    legacy,
                    target,
                });
                if (idNamed.has(session)) {
                    this.logger.warn(`Session "${session.name}" is named after the id of session "${owners.get(session.name)?.name}". Its ${engine} ` +
                        'auth directory was inferred from the name-keyed layout and moved onto its own id; confirm ' +
                        'each of the two sessions links the WhatsApp account you expect.', { sessionId: session.id, action: 'auth_dir_migration_id_named', engine, legacy, target });
                }
            }
            catch (error) {
                this.logger.warn(`Could not move the ${engine} auth directory of session "${session.name}"`, {
                    sessionId: session.id,
                    action: 'auth_dir_migration_failed',
                    engine,
                    legacy,
                    target,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return found;
    }
    warnOnCaseCollisions(sessions, legacyNames) {
        const byFoldedName = new Map();
        for (const session of sessions) {
            const folded = session.name.toLowerCase();
            byFoldedName.set(folded, [...(byFoldedName.get(folded) ?? []), session.name]);
        }
        for (const names of byFoldedName.values()) {
            if (names.length < 2 || !names.some(name => legacyNames.has(name)))
                continue;
            this.logger.warn(`Sessions ${names.map(name => `"${name}"`).join(', ')} have names that differ only in letter case. ` +
                'On a case-insensitive filesystem they shared one engine auth directory, so only one keeps its ' +
                'stored WhatsApp login; the others come back with a QR to scan.', { action: 'auth_dir_case_collision', names });
        }
    }
};
exports.SessionAuthDirMigration = SessionAuthDirMigration;
exports.SessionAuthDirMigration = SessionAuthDirMigration = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], SessionAuthDirMigration);
//# sourceMappingURL=session-auth-dir-migration.service.js.map