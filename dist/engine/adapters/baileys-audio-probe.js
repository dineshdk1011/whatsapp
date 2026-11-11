"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAVEFORM_BARS = void 0;
exports.describeAudio = describeAudio;
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const concurrency_limiter_1 = require("../../common/utils/concurrency-limiter");
const ffmpeg_1 = require("../../modules/media/ffmpeg");
exports.WAVEFORM_BARS = 64;
const FLAT_BAR = 40;
const DURATION_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_CHARS = 1024;
const WAVEFORM_MAX_PCM_BYTES = 32 * 1024 * 1024;
const WAVEFORM_TIMEOUT_MS = 30_000;
const PCM_RATE = 8000;
const reads = new concurrency_limiter_1.ConcurrencyLimiter(2);
const APP_ROOT = (0, node_path_1.join)(__dirname, '..', '..', '..');
const DURATION_SCRIPT = `
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', async () => {
  try {
    const mm = await import('music-metadata');
    const metadata = await mm.parseBuffer(Buffer.concat(chunks), undefined, { duration: true });
    const duration = metadata.format.duration;
    if (typeof duration === 'number' && Number.isFinite(duration) && duration >= 0) {
      process.stdout.write(JSON.stringify({ seconds: Math.floor(duration) }) + '\\n');
    }
  } catch {}
});
`;
function readDuration(data) {
    return new Promise(resolve => {
        let settled = false;
        let output = '';
        const child = (0, node_child_process_1.spawn)(process.execPath, ['-e', DURATION_SCRIPT], {
            cwd: APP_ROOT,
            env: { PATH: process.env.PATH ?? '' },
            stdio: ['pipe', 'pipe', 'ignore'],
        });
        const finish = (seconds) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve(seconds);
        };
        const parse = () => {
            try {
                const { seconds } = JSON.parse(output.trim());
                return typeof seconds === 'number' && Number.isInteger(seconds) && seconds >= 0 ? seconds : undefined;
            }
            catch {
                return undefined;
            }
        };
        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            finish(undefined);
        }, DURATION_TIMEOUT_MS);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            output += chunk;
            if (output.length > MAX_OUTPUT_CHARS) {
                child.kill('SIGKILL');
                finish(undefined);
            }
        });
        child.on('error', () => finish(undefined));
        child.on('close', () => finish(parse()));
        child.stdin.on('error', () => undefined);
        child.stdin.end(data);
    });
}
function barsOf(pcm) {
    const samples = Math.floor(pcm.length / 2);
    const view = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + samples * 2));
    const block = Math.floor(samples / exports.WAVEFORM_BARS);
    if (block === 0)
        return { samples };
    const averages = [];
    for (let bar = 0; bar < exports.WAVEFORM_BARS; bar++) {
        let sum = 0;
        for (let at = block * bar, end = at + block; at < end; at++)
            sum += Math.abs(view[at]);
        averages.push(sum / block);
    }
    const peak = Math.max(...averages);
    if (!(peak > 0))
        return { samples };
    return { waveform: Uint8Array.from(averages, average => Math.floor((100 * average) / peak)), samples };
}
async function readWaveform(data) {
    try {
        const pcm = await (0, ffmpeg_1.runFfmpeg)(data, 'bin', 'raw', ['-vn', '-map', '0:a:0', '-ac', '1', '-ar', String(PCM_RATE), '-f', 's16le'], {
            ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
            timeoutMs: WAVEFORM_TIMEOUT_MS,
            maxOutputBytes: WAVEFORM_MAX_PCM_BYTES,
        });
        return barsOf(pcm);
    }
    catch {
        return {};
    }
}
async function describeAudio(data, ptt) {
    const found = await reads
        .run(async () => {
        const [seconds, wave] = await Promise.all([
            readDuration(data),
            ptt ? readWaveform(data) : Promise.resolve({}),
        ]);
        const decoded = seconds === undefined && wave.samples !== undefined && wave.samples * 2 < WAVEFORM_MAX_PCM_BYTES
            ? Math.floor(wave.samples / PCM_RATE)
            : undefined;
        return { seconds: seconds ?? decoded, waveform: wave.waveform };
    })
        .catch(() => ({ seconds: undefined, waveform: undefined }));
    return {
        seconds: found.seconds ?? 0,
        ...(ptt ? { waveform: found.waveform ?? new Uint8Array(exports.WAVEFORM_BARS).fill(FLAT_BAR) } : {}),
    };
}
//# sourceMappingURL=baileys-audio-probe.js.map