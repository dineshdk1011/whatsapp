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
exports.useAtomicMultiFileAuthState = useAtomicMultiFileAuthState;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const fileChains = new Map();
function serialized(file, task) {
    const run = (fileChains.get(file) ?? Promise.resolve()).then(task);
    const tail = run.catch(() => undefined);
    fileChains.set(file, tail);
    void tail.then(() => {
        if (fileChains.get(file) === tail)
            fileChains.delete(file);
    });
    return run;
}
async function writeFileAtomic(file, data) {
    const tmp = `${file}.${process.pid}.${(0, crypto_1.randomBytes)(4).toString('hex')}.tmp`;
    try {
        const fh = await fs_1.promises.open(tmp, 'w', 0o600);
        try {
            await fh.writeFile(data);
            await fh.sync();
        }
        finally {
            await fh.close();
        }
        await fs_1.promises.rename(tmp, file);
    }
    catch (err) {
        await fs_1.promises.rm(tmp, { force: true });
        throw err;
    }
}
const isMissing = (err) => err?.code === 'ENOENT';
async function useAtomicMultiFileAuthState(folder, lib, logger) {
    const { BufferJSON, proto, initAuthCreds } = lib;
    const filePath = (file) => path.join(folder, file.replace(/\//g, '__').replace(/:/g, '-'));
    const writeData = (data, file) => {
        const target = filePath(file);
        const json = JSON.stringify(data, BufferJSON.replacer);
        return serialized(target, () => writeFileAtomic(target, json));
    };
    const readKey = (file) => {
        const target = filePath(file);
        return serialized(target, async () => {
            try {
                return JSON.parse(await fs_1.promises.readFile(target, 'utf-8'), BufferJSON.reviver);
            }
            catch (err) {
                if (!isMissing(err))
                    logger.warn('Unreadable Baileys key file ignored', { file: target });
                return null;
            }
        });
    };
    const removeData = (file) => {
        const target = filePath(file);
        return serialized(target, () => fs_1.promises.rm(target, { force: true }).catch(() => undefined));
    };
    const folderInfo = await fs_1.promises.stat(folder).catch(() => undefined);
    if (folderInfo && !folderInfo.isDirectory()) {
        throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
    }
    if (!folderInfo)
        await fs_1.promises.mkdir(folder, { recursive: true });
    const credsFile = filePath('creds.json');
    const creds = await serialized(credsFile, async () => {
        let raw;
        try {
            raw = await fs_1.promises.readFile(credsFile, 'utf-8');
        }
        catch (err) {
            if (isMissing(err))
                return initAuthCreds();
            throw err;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw, BufferJSON.reviver);
        }
        catch {
            parsed = undefined;
        }
        if (parsed && typeof parsed === 'object')
            return parsed;
        const quarantined = await fs_1.promises.mkdtemp(path.join(folder, `corrupt-${Date.now()}-`));
        for (const entry of await fs_1.promises.readdir(folder)) {
            const from = path.join(folder, entry);
            if (!entry.startsWith('corrupt-') && from !== credsFile)
                await fs_1.promises.rename(from, path.join(quarantined, entry));
        }
        await fs_1.promises.rename(credsFile, path.join(quarantined, 'creds.json'));
        logger.error(`Stored Baileys credentials could not be parsed; moved them to ${quarantined}. The session needs a new QR link.`);
        return initAuthCreds();
    });
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readKey(`${type}-${id}.json`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        const entries = data[category] ?? {};
                        for (const id in entries) {
                            const value = entries[id];
                            const file = `${category}-${id}.json`;
                            tasks.push(value ? writeData(value, file) : removeData(file));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => writeData(creds, 'creds.json'),
    };
}
//# sourceMappingURL=baileys-auth-store.js.map