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
var InfraStorageController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraStorageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const infra_response_dto_1 = require("./dto/infra-response.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const path_safety_1 = require("../../common/utils/path-safety");
const storage_service_1 = require("../../common/storage/storage.service");
const storage_local_files_1 = require("../../common/storage/storage-local-files");
const logger_service_1 = require("../../common/services/logger.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const import_storage_dto_1 = require("./dto/import-storage.dto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const S3_UNAVAILABLE_DESCRIPTION = 'STORAGE_TYPE is s3 but the bucket is unreachable or its credentials are missing; nothing was read or written.';
const WALK_REFUSED_DESCRIPTION = 'The local storage directory cannot be enumerated completely, so the answer would silently leave files out: ' +
    'it holds a symbolic link, a directory the app cannot read, or one nested too deep. `message` names the path ' +
    'relative to the storage root and the cause. Replace a link with a bind mount or fix the permissions, then ' +
    'retry; nothing was written.';
let InfraStorageController = class InfraStorageController {
    static { InfraStorageController_1 = this; }
    storageService;
    auditService;
    logger = (0, logger_service_1.createLogger)('InfraStorageController');
    constructor(storageService, auditService) {
        this.storageService = storageService;
        this.auditService = auditService;
    }
    static EXPORT_ARCHIVE_PATTERN = /^storage-export-(\d+)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tar\.gz$/;
    async onApplicationBootstrap() {
        await this.sweepStaleExportArchives();
    }
    async sweepStaleExportArchives(exportDir = path.join(process.cwd(), 'data', 'exports')) {
        const maxAgeRaw = Number.parseInt(process.env.STORAGE_EXPORT_SWEEP_MAX_AGE_MS ?? '', 10);
        const maxAgeMs = Number.isInteger(maxAgeRaw) && maxAgeRaw > 0 ? maxAgeRaw : 24 * 60 * 60 * 1000;
        let entries;
        try {
            entries = await fs.promises.readdir(exportDir, { withFileTypes: true });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.warn('Storage export sweep could not read the exports directory', {
                    exportDir,
                    error: String(error),
                });
            }
            return;
        }
        const now = Date.now();
        for (const entry of entries) {
            if (!entry.isFile())
                continue;
            const match = InfraStorageController_1.EXPORT_ARCHIVE_PATTERN.exec(entry.name);
            if (!match)
                continue;
            if (now - Number(match[1]) < maxAgeMs)
                continue;
            try {
                await fs.promises.unlink(path.join(exportDir, entry.name));
                this.logger.log('Swept stale storage export archive', { file: entry.name });
            }
            catch (error) {
                this.logger.warn('Failed to sweep stale storage export archive', { file: entry.name, error: String(error) });
            }
        }
    }
    static refusalAsConflict(error) {
        if (error instanceof storage_local_files_1.StorageWalkRefusedError)
            throw new common_1.ConflictException(error.message);
        throw error;
    }
    async assertStorageBackendReady() {
        if (this.storageService.getCurrentStorageType() !== 's3')
            return;
        if (await this.storageService.refreshS3Availability())
            return;
        throw new common_1.ServiceUnavailableException('S3 storage is not available (bucket unreachable or credentials missing); retry once GET /api/infra/status reports s3Available: true');
    }
    async getStorageFileCount() {
        await this.assertStorageBackendReady();
        const { count, sizeBytes } = await this.storageService
            .getFileCount()
            .catch((error) => InfraStorageController_1.refusalAsConflict(error));
        return {
            storageType: this.storageService.getCurrentStorageType(),
            count,
            sizeBytes,
            sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
        };
    }
    async exportStorage() {
        await this.assertStorageBackendReady();
        const exportDir = path.join(process.cwd(), 'data', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        const exportPath = path.join(exportDir, `storage-export-${Date.now()}-${(0, crypto_1.randomUUID)()}.tar.gz`);
        const stream = await this.storageService
            .createExportStream()
            .catch((error) => InfraStorageController_1.refusalAsConflict(error));
        let writeStream;
        try {
            const sink = (writeStream = fs.createWriteStream(exportPath));
            await new Promise((resolve, reject) => {
                sink.on('finish', resolve);
                sink.on('error', (err) => {
                    stream.destroy();
                    reject(err);
                });
                stream.on('error', (err) => {
                    sink.destroy();
                    reject(err);
                });
                stream.pipe(sink);
            });
        }
        catch (error) {
            stream.destroy();
            if (writeStream) {
                const sink = writeStream;
                sink.destroy();
                if (!sink.closed)
                    await new Promise(resolve => sink.once('close', () => resolve()));
            }
            await fs.promises.unlink(exportPath).catch(() => undefined);
            throw error;
        }
        const ttlRaw = Number.parseInt(process.env.STORAGE_EXPORT_TTL_MS ?? '', 10);
        const ttlMs = Number.isInteger(ttlRaw) && ttlRaw > 0 ? ttlRaw : 60 * 60 * 1000;
        setTimeout(() => {
            fs.promises.unlink(exportPath).catch(() => undefined);
        }, ttlMs).unref();
        const download = path.relative(process.cwd(), exportPath);
        await this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_STORAGE_EXPORTED, { metadata: { download } });
        return {
            message: 'Storage export completed',
            download,
        };
    }
    async importStorage(body) {
        await this.assertStorageBackendReady();
        const { filePath } = body;
        const dataDir = path.join(process.cwd(), 'data');
        const resolved = path.resolve(process.cwd(), filePath || '');
        if (!filePath || !(0, path_safety_1.isPathWithin)(dataDir, resolved)) {
            throw new common_1.BadRequestException('filePath must reference a file inside the data directory');
        }
        if (!fs.existsSync(resolved)) {
            throw new common_1.BadRequestException(`File not found: ${filePath}`);
        }
        const readStream = fs.createReadStream(resolved);
        let count;
        let failed;
        try {
            ({ imported: count, failed } = await this.storageService.importFromStream(readStream));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const partial = error;
            await this.auditService?.logWarn(audit_log_entity_1.AuditAction.INFRA_STORAGE_IMPORTED, {
                metadata: {
                    aborted: true,
                    error: message,
                    storageType: this.storageService.getCurrentStorageType(),
                    count: partial?.imported,
                    failed: partial?.failed,
                },
            });
            throw new common_1.BadRequestException(`Storage import failed: ${message}`);
        }
        const storageType = this.storageService.getCurrentStorageType();
        const imported = !(failed > 0 && count === 0);
        const audit = { metadata: { count, failed, storageType } };
        if (imported) {
            await this.auditService?.logInfo(audit_log_entity_1.AuditAction.INFRA_STORAGE_IMPORTED, audit);
        }
        else {
            await this.auditService?.logWarn(audit_log_entity_1.AuditAction.INFRA_STORAGE_IMPORTED, audit);
        }
        return {
            imported,
            count,
            failed,
            storageType,
        };
    }
};
exports.InfraStorageController = InfraStorageController;
__decorate([
    (0, common_1.Get)('storage/files/count'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get file count in current storage' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File count and size', type: infra_response_dto_1.StorageFileCountResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: WALK_REFUSED_DESCRIPTION }),
    (0, swagger_1.ApiResponse)({ status: 503, description: S3_UNAVAILABLE_DESCRIPTION }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfraStorageController.prototype, "getStorageFileCount", null);
__decorate([
    (0, common_1.Get)('storage/export'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Export all storage files as tar.gz' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'JSON pointing at the archive that was written under data/exports/. This route does NOT stream ' +
            'the tar.gz, and no route serves it: `download` is a server-side path to pass as `filePath` to ' +
            'POST /api/infra/storage/import.',
        type: infra_response_dto_1.StorageExportResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: WALK_REFUSED_DESCRIPTION }),
    (0, swagger_1.ApiResponse)({ status: 503, description: S3_UNAVAILABLE_DESCRIPTION }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfraStorageController.prototype, "exportStorage", null);
__decorate([
    (0, common_1.Post)('storage/import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Import storage files from tar.gz' }),
    (0, swagger_1.ApiBody)({ type: import_storage_dto_1.ImportStorageDto, description: 'Path to tar.gz file to import' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Import result', type: infra_response_dto_1.StorageImportResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '`filePath` is outside the data directory or does not exist, or the archive could not be read or ' +
            'broke a resource cap. Entries written before an abort are kept.',
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: S3_UNAVAILABLE_DESCRIPTION }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_storage_dto_1.ImportStorageDto]),
    __metadata("design:returntype", Promise)
], InfraStorageController.prototype, "importStorage", null);
exports.InfraStorageController = InfraStorageController = InfraStorageController_1 = __decorate([
    (0, swagger_1.ApiTags)('infrastructure'),
    (0, common_1.Controller)('infra'),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [storage_service_1.StorageService,
        audit_service_1.AuditService])
], InfraStorageController);
//# sourceMappingURL=infra-storage.controller.js.map