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
exports.killOrphanedChromiumProcesses = killOrphanedChromiumProcesses;
exports.removeStaleSingletonFiles = removeStaleSingletonFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const auth_dir_paths_1 = require("../auth-dir-paths");
async function killOrphanedChromiumProcesses(sessionId, logger) {
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
        logger.debug(`Skipping orphaned Chromium sweep: unsupported platform ${process.platform}`);
        return;
    }
    try {
        const psOutput = await new Promise((resolve, reject) => {
            (0, child_process_1.execFile)('ps', ['-eo', 'pid=,args='], { maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => {
                if (error)
                    reject(error instanceof Error ? error : new Error(error.message));
                else
                    resolve(stdout);
            });
        });
        const marker = `--openwa-session=${sessionId}`;
        const markerRe = new RegExp('(?:^|\\s)' + marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=\\s|$)');
        const killedPids = [];
        for (const line of psOutput.split('\n')) {
            const match = /^\s*(\d+)\s+(.*)$/.exec(line);
            if (!match)
                continue;
            const pid = Number(match[1]);
            const args = match[2];
            if (pid === process.pid || !markerRe.test(args))
                continue;
            if (!/chrome|chromium|headless/i.test(args))
                continue;
            try {
                process.kill(pid, 'SIGKILL');
                killedPids.push(pid);
            }
            catch (error) {
                if (error.code !== 'ESRCH') {
                    logger.debug(`Could not SIGKILL orphaned Chromium pid ${pid}`, { error: String(error) });
                }
            }
        }
        if (killedPids.length > 0) {
            logger.log(`Killed ${killedPids.length} orphaned Chromium process(es) left over from a previous process lifetime`, { sessionId, pids: killedPids });
        }
    }
    catch (error) {
        logger.debug('Could not enumerate processes for the orphaned Chromium sweep', { error: String(error) });
    }
}
async function removeStaleSingletonFiles(sessionId, sessionDataPath, logger) {
    const profileDir = (0, auth_dir_paths_1.wwjsAuthDir)(sessionDataPath, sessionId);
    for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
        try {
            await fs.promises.rm(path.join(profileDir, name), { force: true });
        }
        catch (error) {
            logger.debug(`Could not remove stale ${name} from ${profileDir}`, { error: String(error) });
        }
    }
}
//# sourceMappingURL=chromium-profile-hygiene.js.map