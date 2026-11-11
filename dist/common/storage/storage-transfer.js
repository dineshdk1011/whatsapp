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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadsBusyException = exports.DOWNLOADS_BUSY_RETRY_AFTER_SECONDS = exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES = exports.DEFAULT_IMPORT_MAX_ENTRIES = exports.DEFAULT_IMPORT_MAX_BYTES = void 0;
exports.isMissingObjectError = isMissingObjectError;
exports.retryAfterWhenBusy = retryAfterWhenBusy;
exports.storedFileAttachment = storedFileAttachment;
exports.createExportStream = createExportStream;
exports.importFromStream = importFromStream;
const tar = __importStar(require("tar-stream"));
const zlib_1 = require("zlib");
const stream_1 = require("stream");
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../services/logger.service");
const env_int_1 = require("../utils/env-int");
exports.DEFAULT_IMPORT_MAX_BYTES = 200 * 1024 * 1024;
exports.DEFAULT_IMPORT_MAX_ENTRIES = 100_000;
exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES = 10 * 1024 * 1024 * 1024;
function isMissingObjectError(error) {
    const e = error;
    return (e?.code === 'ENOENT' || e?.name === 'NoSuchKey' || e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404);
}
const storedFileLogger = (0, logger_service_1.createLogger)('StoredFile');
exports.DOWNLOADS_BUSY_RETRY_AFTER_SECONDS = 1;
class DownloadsBusyException extends common_1.ServiceUnavailableException {
    constructor() {
        super('Too many media downloads are in progress; retry shortly');
    }
}
exports.DownloadsBusyException = DownloadsBusyException;
function retryAfterWhenBusy(res) {
    return error => {
        if (error instanceof DownloadsBusyException)
            res.set('Retry-After', String(exports.DOWNLOADS_BUSY_RETRY_AFTER_SECONDS));
        throw error;
    };
}
function storedFileAttachment(res, source, mimetype) {
    res.set({ 'Content-Type': mimetype, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'attachment' });
    const file = new common_1.StreamableFile(source.stream, source.size === undefined ? {} : { length: source.size });
    const cutConnection = file.errorHandler;
    return file.setErrorHandler((error, response) => {
        if (response.destroyed || response.headersSent)
            return cutConnection(error, response);
        storedFileLogger.error('Reading a stored file failed before any of it was sent', String(error));
        res.removeHeader('Content-Type');
        res.removeHeader('Content-Disposition');
        res.removeHeader('Content-Length');
        res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    });
}
async function createExportStream(listFiles, openFile, logger) {
    const files = await listFiles();
    const localImportCap = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_ENTRIES', exports.DEFAULT_IMPORT_MAX_ENTRIES);
    const warnAbove = Math.min(localImportCap, exports.DEFAULT_IMPORT_MAX_ENTRIES);
    if (files.length > warnAbove) {
        logger.warn(`Export contains ${files.length} files, above the import limit of ${warnAbove} ` +
            `(this deployment: ${localImportCap}, shipped default: ${exports.DEFAULT_IMPORT_MAX_ENTRIES}). ` +
            'Raise STORAGE_IMPORT_MAX_ENTRIES on the destination before restoring this archive.');
    }
    const output = new stream_1.PassThrough();
    const pack = tar.pack();
    const gzip = (0, zlib_1.createGzip)({ level: 6 });
    const failArchive = (err) => {
        logger.error('Export archive failed', String(err));
        output.destroy(err);
    };
    pack.on('error', failArchive);
    gzip.on('error', failArchive);
    pack.pipe(gzip).pipe(output);
    output.once('close', () => {
        pack.destroy();
        gzip.destroy();
    });
    appendEntries(files, openFile, pack, output, logger).catch((err) => output.destroy(err));
    return output;
}
function enforceSize(file, size, onRead) {
    let seen = 0;
    const mismatch = () => new Error(`Export failed: ${file} changed size while being read (expected ${size})`);
    return new stream_1.Transform({
        transform(chunk, _encoding, callback) {
            seen += chunk.length;
            callback(size !== undefined && seen > size ? mismatch() : null, chunk);
        },
        flush(callback) {
            if (size !== undefined && seen < size)
                return callback(mismatch());
            onRead(seen);
            callback();
        },
    });
}
function writeEntry(pack, source, header, size, output, done) {
    if (size !== undefined) {
        const sink = pack.entry({ ...header, size }, () => done());
        sink.on('error', () => undefined);
        source.pipe(sink);
        return;
    }
    const chunks = [];
    source.on('data', (chunk) => chunks.push(chunk));
    source.on('end', () => {
        if (output.destroyed)
            return;
        pack.entry(header, Buffer.concat(chunks), () => done()).on('error', () => undefined);
    });
}
async function appendEntries(files, openFile, pack, output, logger) {
    let exportedBytes = 0;
    let largest = { file: '', size: 0 };
    for (const file of files) {
        let source;
        try {
            source = await openFile(file);
        }
        catch (error) {
            const { code, name } = error;
            if (code !== 'ENOENT' && name !== 'NoSuchKey')
                throw error;
            logger.warn(`Failed to export file: ${file}`, { error: String(error) });
            continue;
        }
        const { stream, size } = source;
        if (output.destroyed) {
            stream.destroy();
            break;
        }
        const entry = (0, stream_1.pipeline)(stream, enforceSize(file, size, bytes => {
            exportedBytes += bytes;
            if (bytes > largest.size)
                largest = { file, size: bytes };
        }), err => {
            if (!err || output.destroyed)
                return;
            logger.error(`Export failed reading file: ${file}`, String(err));
            output.destroy(err);
        });
        await new Promise(resolve => {
            const done = () => {
                output.removeListener('close', done);
                resolve();
            };
            output.on('close', done);
            writeEntry(pack, entry, { name: file, mode: 0o644, mtime: new Date() }, size, output, done);
        });
        if (output.destroyed) {
            stream.destroy();
            break;
        }
    }
    if (output.destroyed)
        return;
    const localByteCap = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_TOTAL_BYTES', exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES);
    const warnAboveBytes = Math.min(localByteCap, exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES);
    if (exportedBytes > warnAboveBytes) {
        logger.warn(`Export contains ${exportedBytes} bytes, above the import limit of ${warnAboveBytes} ` +
            `(this deployment: ${localByteCap}, shipped default: ${exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES}). ` +
            'Raise STORAGE_IMPORT_MAX_TOTAL_BYTES on the destination before restoring this archive.');
    }
    const localEntryCap = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_BYTES', exports.DEFAULT_IMPORT_MAX_BYTES);
    const warnAboveEntry = Math.min(localEntryCap, exports.DEFAULT_IMPORT_MAX_BYTES);
    if (largest.size > warnAboveEntry) {
        logger.warn(`Export contains ${largest.file} (${largest.size} bytes), above the per-entry import limit of ${warnAboveEntry} ` +
            `(this deployment: ${localEntryCap}, shipped default: ${exports.DEFAULT_IMPORT_MAX_BYTES}). ` +
            'Raise STORAGE_IMPORT_MAX_BYTES on the destination before restoring this archive.');
    }
    pack.finalize();
}
async function importFromStream(inputStream, putFile, logger) {
    let importedCount = 0;
    let failedCount = 0;
    let entryCount = 0;
    let totalBytes = 0;
    const maxEntryBytes = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_BYTES', exports.DEFAULT_IMPORT_MAX_BYTES);
    const maxEntries = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_ENTRIES', exports.DEFAULT_IMPORT_MAX_ENTRIES);
    const maxTotalBytes = (0, env_int_1.positiveIntFromEnv)('STORAGE_IMPORT_MAX_TOTAL_BYTES', exports.DEFAULT_IMPORT_MAX_TOTAL_BYTES);
    const extract = tar.extract();
    const gunzip = (0, zlib_1.createGunzip)();
    return new Promise((resolve, reject) => {
        let settled = false;
        const fail = (err) => {
            if (settled)
                return;
            settled = true;
            extract.destroy();
            gunzip.destroy();
            inputStream.destroy();
            reject(Object.assign(err, { imported: importedCount, failed: failedCount }));
        };
        gunzip.on('error', (err) => {
            logger.error('Import failed (gzip)', String(err));
            fail(err);
        });
        inputStream.on('error', (err) => {
            logger.error('Import failed (input)', String(err));
            fail(err);
        });
        extract.on('entry', (header, stream, next) => {
            if (settled) {
                stream.resume();
                return;
            }
            if (++entryCount > maxEntries) {
                stream.resume();
                fail(new Error(`Import aborted: archive exceeds the ${maxEntries}-entry limit (STORAGE_IMPORT_MAX_ENTRIES)`));
                return;
            }
            if (header.type !== 'file' && header.type !== 'contiguous-file') {
                logger.debug(`Skipped ${header.type ?? 'unknown'} entry: ${header.name}`);
                stream.on('end', () => next());
                stream.resume();
                return;
            }
            const key = header.name.replace(/^(?:\.\/)+/, '');
            const chunks = [];
            let entryBytes = 0;
            let entryAborted = false;
            stream.on('data', (chunk) => {
                if (entryAborted || settled)
                    return;
                entryBytes += chunk.length;
                totalBytes += chunk.length;
                if (entryBytes > maxEntryBytes) {
                    entryAborted = true;
                    stream.resume();
                    fail(new Error(`Import aborted: entry "${key}" exceeds the ${maxEntryBytes}-byte per-entry cap (STORAGE_IMPORT_MAX_BYTES)`));
                }
                else if (totalBytes > maxTotalBytes) {
                    entryAborted = true;
                    stream.resume();
                    fail(new Error(`Import aborted: archive exceeds the ${maxTotalBytes}-byte total cap (STORAGE_IMPORT_MAX_TOTAL_BYTES)`));
                }
                else {
                    chunks.push(chunk);
                }
            });
            stream.on('end', () => {
                if (entryAborted || settled)
                    return;
                const data = Buffer.concat(chunks);
                putFile(key, data)
                    .then(() => {
                    importedCount++;
                    logger.debug(`Imported file: ${key}`);
                    next();
                })
                    .catch((error) => {
                    failedCount++;
                    logger.error(`Failed to import file: ${key}`, String(error));
                    next();
                });
            });
            stream.resume();
        });
        extract.on('finish', () => {
            if (settled)
                return;
            settled = true;
            logger.log(`Import completed: ${importedCount} files, ${failedCount} failed`);
            resolve({ imported: importedCount, failed: failedCount });
        });
        extract.on('error', (err) => {
            logger.error('Import failed', String(err));
            fail(err);
        });
        inputStream.pipe(gunzip).pipe(extract);
    });
}
//# sourceMappingURL=storage-transfer.js.map