"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INPUT_FORMATS = exports.FfmpegSpawnError = exports.FfmpegConversionError = void 0;
exports.buildFfmpegArgs = buildFfmpegArgs;
exports.voiceEncodeArgs = voiceEncodeArgs;
exports.videoEncodeArgs = videoEncodeArgs;
exports.runFfmpeg = runFfmpeg;
exports.removeStaleConversionDirs = removeStaleConversionDirs;
exports.killRunningConversions = killRunningConversions;
exports.probeFfmpeg = probeFfmpeg;
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const CONVERSION_DIR_PREFIX = 'openwa-convert-';
const CONVERSION_DIR = /^openwa-convert-[A-Za-z0-9]{6}$/;
class FfmpegConversionError extends Error {
    detail;
    constructor(message, detail = '') {
        super(message);
        this.detail = detail;
        this.name = 'FfmpegConversionError';
    }
}
exports.FfmpegConversionError = FfmpegConversionError;
class FfmpegSpawnError extends FfmpegConversionError {
    constructor(message) {
        super(message);
        this.name = 'FfmpegSpawnError';
    }
}
exports.FfmpegSpawnError = FfmpegSpawnError;
exports.INPUT_FORMATS = [
    'mov',
    'matroska',
    'ogg',
    'mp3',
    'wav',
    'w64',
    'aac',
    'ac3',
    'eac3',
    'flac',
    'wv',
    'au',
    'amr',
    'avi',
    'mpeg',
    'mpegts',
    'asf',
    'flv',
    'caf',
    'aiff',
    'gif',
    'h264',
    'hevc',
].join(',');
const BASE_ARGS = [
    '-hide_banner',
    '-nostdin',
    '-loglevel',
    'error',
    '-y',
    '-protocol_whitelist',
    'file',
    '-format_whitelist',
    exports.INPUT_FORMATS,
];
function buildFfmpegArgs(inputPath, outputPath, encodeArgs, maxOutputBytes) {
    const fs = Math.min(maxOutputBytes, Number.MAX_SAFE_INTEGER - 1) + 1;
    return [...BASE_ARGS, '-i', inputPath, ...encodeArgs, '-fs', String(fs), outputPath];
}
function voiceEncodeArgs() {
    return ['-vn', '-c:a', 'libopus', '-b:a', '32k', '-ar', '48000', '-ac', '1', '-application', 'voip'];
}
function videoEncodeArgs() {
    return [
        '-c:v',
        'libx264',
        '-profile:v',
        'baseline',
        '-level',
        '3.1',
        '-pix_fmt',
        'yuv420p',
        '-vf',
        "scale='min(iw,if(gte(iw,ih),1280,720))':'min(ih,if(gte(iw,ih),720,1280))':force_original_aspect_ratio=decrease:force_divisible_by=2",
        '-fpsmax',
        '30',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
    ];
}
async function runFfmpeg(input, inputExtension, outputExtension, encodeArgs, options) {
    const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), CONVERSION_DIR_PREFIX));
    const inputPath = (0, node_path_1.join)(dir, `in.${inputExtension}`);
    const outputPath = (0, node_path_1.join)(dir, `out.${outputExtension}`);
    try {
        await (0, promises_1.writeFile)(inputPath, input);
        try {
            await execute(buildFfmpegArgs(inputPath, outputPath, encodeArgs, options.maxOutputBytes), options);
        }
        catch (error) {
            if (error instanceof FfmpegConversionError && error.detail) {
                throw new FfmpegConversionError(error.message, error.detail.replaceAll(dir + node_path_1.sep, ''));
            }
            throw error;
        }
        const { size } = await (0, promises_1.stat)(outputPath);
        if (size > options.maxOutputBytes) {
            throw new FfmpegConversionError(`Converted media is ${size} bytes, above the ${options.maxOutputBytes} byte limit`);
        }
        if (size === 0) {
            throw new FfmpegConversionError('Conversion produced no output');
        }
        return await (0, promises_1.readFile)(outputPath);
    }
    finally {
        await (0, promises_1.rm)(dir, { recursive: true, force: true });
    }
}
async function removeStaleConversionDirs(minAgeMs, warn, now = Date.now()) {
    const root = (0, node_os_1.tmpdir)();
    let entries;
    try {
        entries = await (0, promises_1.readdir)(root, { withFileTypes: true });
    }
    catch (error) {
        warn('Could not list the temp dir for leftover conversion directories', error);
        return 0;
    }
    let removed = 0;
    for (const entry of entries) {
        if (!entry.isDirectory() || !CONVERSION_DIR.test(entry.name))
            continue;
        const dir = (0, node_path_1.join)(root, entry.name);
        try {
            if (now - (await (0, promises_1.lstat)(dir)).mtimeMs < minAgeMs)
                continue;
            await (0, promises_1.rm)(dir, { recursive: true, force: true });
            removed += 1;
        }
        catch (error) {
            warn(`Could not remove the leftover conversion directory ${entry.name}`, error);
        }
    }
    return removed;
}
const runningGroups = new Set();
function killRunningConversions() {
    for (const pid of runningGroups) {
        try {
            process.kill(-pid, 'SIGKILL');
        }
        catch {
        }
    }
    runningGroups.clear();
}
process.on('exit', killRunningConversions);
function ffmpegEnv() {
    const env = {};
    for (const name of [
        'PATH',
        'LD_LIBRARY_PATH',
        'DYLD_LIBRARY_PATH',
        'HOME',
        'TMPDIR',
        'TEMP',
        'TMP',
        'LANG',
        'LC_ALL',
        'SystemRoot',
    ]) {
        const value = process.env[name];
        if (value !== undefined)
            env[name] = value;
    }
    return env;
}
function execute(args, options) {
    return new Promise((resolve, reject) => {
        options.signal?.throwIfAborted();
        const child = (0, node_child_process_1.spawn)(options.ffmpegPath, args, {
            stdio: ['ignore', 'ignore', 'pipe'],
            detached: true,
            env: ffmpegEnv(),
        });
        const pid = child.pid;
        if (pid !== undefined)
            runningGroups.add(pid);
        let stderr = '';
        let timedOut = false;
        child.stderr.on('data', (chunk) => {
            stderr = (stderr + chunk.toString()).slice(-4096);
        });
        const timer = setTimeout(() => {
            timedOut = true;
            try {
                if (child.pid !== undefined)
                    process.kill(-child.pid, 'SIGKILL');
            }
            catch {
                child.kill('SIGKILL');
            }
            child.stderr.destroy();
            if (pid !== undefined)
                runningGroups.delete(pid);
            reject(new FfmpegConversionError(`Conversion timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
        child.on('error', err => {
            clearTimeout(timer);
            if (pid !== undefined)
                runningGroups.delete(pid);
            reject(new FfmpegSpawnError(`Could not run ffmpeg: ${err instanceof Error ? err.message : String(err)}`));
        });
        child.on('close', code => {
            clearTimeout(timer);
            if (pid !== undefined)
                runningGroups.delete(pid);
            if (timedOut)
                return;
            if (code !== 0) {
                reject(new FfmpegConversionError(`ffmpeg exited with code ${code}`, stderr.trim()));
                return;
            }
            resolve();
        });
    });
}
async function probeFfmpeg(ffmpegPath, timeoutMs = 5_000) {
    try {
        await execute(['-version'], { ffmpegPath, timeoutMs, maxOutputBytes: 0 });
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=ffmpeg.js.map