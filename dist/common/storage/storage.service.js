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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.S3_READER_IDLE_MS = exports.S3_MAX_OPEN_DOWNLOADS = exports.S3_LIST_TIMEOUT_MS = exports.S3_SOCKET_TIMEOUT_MS = exports.S3_CONNECT_TIMEOUT_MS = exports.S3_PROBE_TIMEOUT_MS = exports.S3_DELETE_TIMEOUT_MS = exports.DEFAULT_S3_REPROBE_INTERVAL_MS = exports.isMissingObjectError = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stream_1 = require("stream");
const client_s3_1 = require("@aws-sdk/client-s3");
const logger_service_1 = require("../services/logger.service");
const env_int_1 = require("../utils/env-int");
const path_safety_1 = require("../utils/path-safety");
const s3_key_prefix_1 = require("./s3-key-prefix");
const storage_transfer_1 = require("./storage-transfer");
const storage_local_files_1 = require("./storage-local-files");
var storage_transfer_2 = require("./storage-transfer");
Object.defineProperty(exports, "isMissingObjectError", { enumerable: true, get: function () { return storage_transfer_2.isMissingObjectError; } });
exports.DEFAULT_S3_REPROBE_INTERVAL_MS = 60_000;
exports.S3_DELETE_TIMEOUT_MS = 30_000;
exports.S3_PROBE_TIMEOUT_MS = 10_000;
exports.S3_CONNECT_TIMEOUT_MS = 5_000;
exports.S3_SOCKET_TIMEOUT_MS = 30_000;
exports.S3_LIST_TIMEOUT_MS = 30_000;
exports.S3_MAX_OPEN_DOWNLOADS = 50;
exports.S3_READER_IDLE_MS = 600_000;
function withIdleBound(body, idleMs, readerIdleMs) {
    let heldBackMs = 0;
    const timer = setTimeout(() => {
        const readerBehind = guard.readableLength >= guard.readableHighWaterMark;
        if (readerBehind && (heldBackMs += idleMs) < readerIdleMs) {
            timer.refresh();
            return;
        }
        const idle = readerBehind ? `reader took nothing for ${heldBackMs} ms` : `body sent nothing for ${idleMs} ms`;
        guard.destroy(Object.assign(new Error(`S3 object ${idle}`), { name: 'TimeoutError' }));
    }, idleMs);
    timer.unref();
    const guard = new stream_1.Transform({
        transform(chunk, _encoding, callback) {
            heldBackMs = 0;
            timer.refresh();
            callback(null, chunk);
        },
        flush(callback) {
            clearTimeout(timer);
            callback();
        },
        destroy(error, callback) {
            clearTimeout(timer);
            callback(error);
        },
    });
    (0, stream_1.pipeline)(body, guard, () => undefined);
    return guard;
}
let StorageService = class StorageService {
    configService;
    logger = (0, logger_service_1.createLogger)('StorageService');
    storageType;
    localPath;
    s3Client = null;
    s3StreamClient = null;
    s3OpenDownloads = 0;
    s3Bucket = 'openwa';
    s3KeyRoot = s3_key_prefix_1.DEFAULT_S3_KEY_PREFIX;
    s3Available = false;
    s3ReprobeTimer = null;
    s3ReprobeIntervalMs = (0, env_int_1.positiveIntFromEnv)('S3_REPROBE_INTERVAL_MS', exports.DEFAULT_S3_REPROBE_INTERVAL_MS);
    constructor(configService) {
        this.configService = configService;
        this.storageType = this.configService.get('storage.type') || 'local';
        this.localPath = this.configService.get('storage.localPath') || './data/media';
        if (this.storageType === 's3') {
            const s3Config = this.configService.get('storage.s3') || {};
            const endpoint = process.env.S3_ENDPOINT || s3Config.endpoint;
            const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || s3Config.accessKeyId;
            const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || s3Config.secretAccessKey;
            const region = process.env.S3_REGION || s3Config.region || 'us-east-1';
            if (accessKeyId && secretAccessKey) {
                const clientConfig = {
                    ...(endpoint ? { endpoint } : {}),
                    region,
                    credentials: {
                        accessKeyId,
                        secretAccessKey,
                    },
                    ...(endpoint ? { forcePathStyle: true } : {}),
                    requestHandler: { connectionTimeout: exports.S3_CONNECT_TIMEOUT_MS, socketTimeout: exports.S3_SOCKET_TIMEOUT_MS },
                };
                this.s3Client = new client_s3_1.S3Client(clientConfig);
                this.s3StreamClient = new client_s3_1.S3Client(clientConfig);
                this.s3Bucket = process.env.S3_BUCKET || s3Config.bucket || 'openwa';
                const keyRoot = (0, s3_key_prefix_1.normalizeS3KeyPrefix)(process.env.S3_KEY_PREFIX || s3Config.keyPrefix);
                if (!keyRoot)
                    throw new Error('S3_KEY_PREFIX is not a safe relative key prefix');
                this.s3KeyRoot = keyRoot;
                void this.initializeS3Bucket();
                this.startS3Reprobe();
            }
            else {
                const missing = [
                    accessKeyId ? null : 'S3_ACCESS_KEY_ID',
                    secretAccessKey ? null : 'S3_SECRET_ACCESS_KEY',
                ].filter((name) => name !== null);
                this.logger.warn(`STORAGE_TYPE=s3 but ${missing.join(' and ')} is not set; media is being written to the ` +
                    `local dir '${this.localPath}' instead of the bucket. The built-in MinIO uses ` +
                    `minioadmin/minioadmin.`);
            }
        }
        if (!fs.existsSync(this.localPath)) {
            fs.mkdirSync(this.localPath, { recursive: true });
        }
    }
    onModuleDestroy() {
        this.clearS3Reprobe();
    }
    async initializeS3Bucket() {
        if (!this.s3Client)
            return;
        try {
            await this.ensureS3Bucket();
            this.s3Available = true;
            this.logger.log(`S3 bucket '${this.s3Bucket}' is available`);
        }
        catch (error) {
            this.logger.error('S3 bucket check failed', String(error));
            this.lastS3Error = String(error);
            this.warnLocalFallback();
        }
    }
    async ensureS3Bucket() {
        try {
            await this.s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: this.s3Bucket }), {
                abortSignal: AbortSignal.timeout(exports.S3_PROBE_TIMEOUT_MS),
            });
            return;
        }
        catch (error) {
            const name = error.name;
            if (name !== 'NotFound' && name !== 'NoSuchBucket')
                throw error;
        }
        try {
            await this.s3Client.send(new client_s3_1.CreateBucketCommand({ Bucket: this.s3Bucket }), {
                abortSignal: AbortSignal.timeout(exports.S3_PROBE_TIMEOUT_MS),
            });
        }
        catch (error) {
            if (error.name !== 'BucketAlreadyOwnedByYou')
                throw error;
            return;
        }
        this.logger.log(`Created S3 bucket '${this.s3Bucket}'`);
    }
    warnLocalFallback() {
        this.logger.warn(`S3 bucket '${this.s3Bucket}' is unavailable (${this.lastS3Error}); media storage degraded, using the ` +
            `local fallback dir '${this.localPath}'. Re-probing every ${this.s3ReprobeIntervalMs}ms; writes return ` +
            'to S3 once it recovers.');
    }
    startS3Reprobe() {
        this.s3ReprobeTimer = setInterval(() => {
            if (this.s3Available) {
                this.clearS3Reprobe();
                return;
            }
            void this.refreshS3Availability().then(available => {
                if (!available)
                    this.warnLocalFallback();
            });
        }, this.s3ReprobeIntervalMs);
        this.s3ReprobeTimer.unref();
    }
    clearS3Reprobe() {
        if (this.s3ReprobeTimer) {
            clearInterval(this.s3ReprobeTimer);
            this.s3ReprobeTimer = null;
        }
    }
    getCurrentStorageType() {
        return this.storageType;
    }
    lastS3Check = 0;
    lastS3Error = '';
    s3CheckInFlight = null;
    async refreshS3Availability() {
        if (this.storageType !== 's3' || !this.s3Client || this.s3Available)
            return this.s3Available;
        if (this.s3CheckInFlight) {
            await this.s3CheckInFlight;
            return this.s3Available;
        }
        const now = Date.now();
        if (now - this.lastS3Check < 10_000)
            return this.s3Available;
        this.lastS3Check = now;
        this.s3CheckInFlight = (async () => {
            try {
                await this.ensureS3Bucket();
                this.s3Available = true;
                this.logger.warn(`S3 bucket '${this.s3Bucket}' recovered — media storage back on S3. Files written to the local ` +
                    `fallback dir '${this.localPath}' during the outage remain there (still readable via read-through).`);
            }
            catch (error) {
                this.lastS3Error = String(error);
            }
            finally {
                this.s3CheckInFlight = null;
            }
        })();
        await this.s3CheckInFlight;
        return this.s3Available;
    }
    async *iterateFiles(prefix = '', options = {}) {
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            const local = new Set();
            for await (const file of this.iterateLocalFiles(prefix, options.skipUnreadable)) {
                local.add(file);
                yield file;
            }
            for await (const file of this.iterateS3Files(prefix)) {
                if (!local.has(file))
                    yield file;
            }
            return;
        }
        yield* this.iterateLocalFiles(prefix, options.skipUnreadable);
    }
    async getFile(filePath) {
        if (!(0, path_safety_1.isSafeStorageKey)(filePath)) {
            throw new Error(`Refusing to read an unsafe storage key: ${filePath}`);
        }
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            return this.getS3File(filePath);
        }
        return this.getLocalFile(filePath);
    }
    async openFile(filePath) {
        return this.openStoredFile(filePath, this.s3StreamClient);
    }
    async openStoredFile(filePath, client) {
        if (!(0, path_safety_1.isSafeStorageKey)(filePath)) {
            throw new Error(`Refusing to read an unsafe storage key: ${filePath}`);
        }
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            return this.openS3File(filePath, client);
        }
        return (0, storage_local_files_1.openLocalFile)(this.localPath, filePath);
    }
    async putFile(filePath, data) {
        if (!(0, path_safety_1.isSafeStorageKey)(filePath)) {
            throw new Error(`Refusing to store an unsafe storage key: ${filePath}`);
        }
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            return this.putS3File(filePath, data);
        }
        return this.putLocalFile(filePath, data);
    }
    async deleteFile(filePath) {
        if (!(0, path_safety_1.isSafeStorageKey)(filePath)) {
            throw new Error(`Refusing to delete an unsafe storage key: ${filePath}`);
        }
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            await this.deleteS3File(filePath);
        }
        return this.deleteLocalFile(filePath);
    }
    async getFileCount() {
        if (this.storageType === 's3' && this.s3Client && this.s3Available) {
            const s3 = await this.getS3CountAndSize();
            const s3Keys = new Set(s3.keys);
            let { count, sizeBytes } = s3;
            for await (const file of this.iterateLocalFiles()) {
                if (s3Keys.has(file) || !this.isExportableKey(file))
                    continue;
                count += 1;
                try {
                    sizeBytes += (await fs.promises.stat(path.join(this.localPath, file))).size;
                }
                catch (error) {
                    this.logger.debug(`Failed to stat file: ${file}`, { error: String(error) });
                }
            }
            return { count, sizeBytes };
        }
        const files = await this.listExportableFiles();
        let sizeBytes = 0;
        for (const file of files) {
            try {
                const fullPath = path.join(this.localPath, file);
                const stats = await fs.promises.stat(fullPath);
                sizeBytes += stats.size;
            }
            catch (error) {
                this.logger.debug(`Failed to stat file: ${file}`, { error: String(error) });
            }
        }
        return { count: files.length, sizeBytes };
    }
    async getS3CountAndSize() {
        let count = 0;
        let sizeBytes = 0;
        const keys = [];
        let continuationToken;
        do {
            const response = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: this.s3Bucket,
                Prefix: this.s3KeyRoot,
                ContinuationToken: continuationToken,
            }), { abortSignal: AbortSignal.timeout(exports.S3_LIST_TIMEOUT_MS) });
            for (const obj of response.Contents ?? []) {
                const key = this.stripS3KeyRoot(obj.Key);
                if (key === null || !this.isExportableKey(key))
                    continue;
                count += 1;
                sizeBytes += obj.Size ?? 0;
                keys.push(key);
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);
        return { count, sizeBytes, keys };
    }
    createExportStream() {
        return (0, storage_transfer_1.createExportStream)(() => this.listExportableFiles(), filePath => this.openStoredFile(filePath, this.s3Client), this.logger);
    }
    isExportableKey(file) {
        if (file.endsWith('/'))
            return false;
        if ((0, path_safety_1.isSafeStorageKey)(file))
            return true;
        this.logger.warn(`Leaving an unsafe storage key out of the export and the file count: ${JSON.stringify(file)}`);
        return false;
    }
    async listExportableFiles() {
        const files = [];
        for await (const file of this.iterateFiles()) {
            if (this.isExportableKey(file))
                files.push(file);
        }
        return files;
    }
    importFromStream(inputStream) {
        return (0, storage_transfer_1.importFromStream)(inputStream, (filePath, data) => this.putFile(filePath, data), this.logger);
    }
    iterateLocalFiles(prefix = '', skipUnreadable = false) {
        return (0, storage_local_files_1.iterateLocalFiles)(this.localPath, prefix, { skipUnreadable, logger: this.logger });
    }
    getLocalFile(filePath) {
        return (0, storage_local_files_1.getLocalFile)(this.localPath, filePath);
    }
    putLocalFile(filePath, data) {
        return (0, storage_local_files_1.putLocalFile)(this.localPath, filePath, data);
    }
    deleteLocalFile(filePath) {
        return (0, storage_local_files_1.deleteLocalFile)(this.localPath, filePath);
    }
    async *iterateS3Files(prefix = '') {
        if (!this.s3Client)
            return;
        let continuationToken;
        do {
            const response = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: this.s3Bucket,
                Prefix: `${this.s3KeyRoot}${prefix}`,
                ContinuationToken: continuationToken,
            }), { abortSignal: AbortSignal.timeout(exports.S3_LIST_TIMEOUT_MS) });
            for (const obj of response.Contents ?? []) {
                const key = this.stripS3KeyRoot(obj.Key);
                if (key !== null)
                    yield key;
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);
    }
    stripS3KeyRoot(key) {
        return key?.startsWith(this.s3KeyRoot) ? key.slice(this.s3KeyRoot.length) : null;
    }
    async getS3File(filePath) {
        const { stream } = await this.openS3File(filePath, this.s3Client);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async openS3File(filePath, client) {
        if (!client)
            throw new Error('S3 client not initialized');
        let held = client === this.s3StreamClient;
        if (held && this.s3OpenDownloads >= exports.S3_MAX_OPEN_DOWNLOADS) {
            throw new storage_transfer_1.DownloadsBusyException();
        }
        if (held)
            this.s3OpenDownloads++;
        const release = () => {
            if (held)
                this.s3OpenDownloads--;
            held = false;
        };
        let response;
        try {
            response = await client.send(new client_s3_1.GetObjectCommand({
                Bucket: this.s3Bucket,
                Key: `${this.s3KeyRoot}${filePath}`,
            }));
        }
        catch (error) {
            release();
            if (error.name !== 'NoSuchKey')
                throw error;
            let local;
            try {
                local = await (0, storage_local_files_1.openLocalFile)(this.localPath, filePath);
            }
            catch (localError) {
                throw (0, storage_transfer_1.isMissingObjectError)(localError) ? error : localError;
            }
            this.logger.debug(`Served '${filePath}' from the local fallback dir (not yet in S3)`);
            return local;
        }
        if (!response.Body) {
            release();
            throw new Error('Empty response body');
        }
        const body = response.Body;
        (0, stream_1.finished)(body, release);
        return { stream: withIdleBound(body, exports.S3_SOCKET_TIMEOUT_MS, exports.S3_READER_IDLE_MS), size: response.ContentLength };
    }
    async putS3File(filePath, data) {
        if (!this.s3Client)
            throw new Error('S3 client not initialized');
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: `${this.s3KeyRoot}${filePath}`,
            Body: data,
        }));
    }
    async deleteS3File(filePath) {
        if (!this.s3Client)
            throw new Error('S3 client not initialized');
        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.s3Bucket,
            Key: `${this.s3KeyRoot}${filePath}`,
        }), { abortSignal: AbortSignal.timeout(exports.S3_DELETE_TIMEOUT_MS) });
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map