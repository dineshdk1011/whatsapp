"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sweepOrphanedFiles = sweepOrphanedFiles;
async function sweepOrphanedFiles(options) {
    const { storage, prefix, graceMs, now, firstSeenAt, referencedAmong, onDeleteFailed } = options;
    let removed = 0;
    const stillOrphaned = new Set();
    let chunk = [];
    const flush = async () => {
        if (chunk.length === 0)
            return;
        const referenced = await referencedAmong(chunk);
        for (const file of chunk) {
            if (referenced.has(file)) {
                firstSeenAt.delete(file);
                continue;
            }
            stillOrphaned.add(file);
            const firstSeen = firstSeenAt.get(file) ?? now;
            firstSeenAt.set(file, firstSeen);
            if (now - firstSeen < graceMs)
                continue;
            try {
                await storage.deleteFile(file);
                firstSeenAt.delete(file);
                stillOrphaned.delete(file);
                removed += 1;
            }
            catch (err) {
                onDeleteFailed(file, err);
            }
        }
        chunk = [];
    };
    for await (const file of storage.iterateFiles(prefix, { skipUnreadable: true })) {
        if (!file.startsWith(prefix))
            continue;
        chunk.push(file);
        if (options.chunkSize !== undefined && chunk.length >= options.chunkSize)
            await flush();
    }
    await flush();
    for (const key of [...firstSeenAt.keys()]) {
        if (!stillOrphaned.has(key))
            firstSeenAt.delete(key);
    }
    return removed;
}
//# sourceMappingURL=orphan-sweep.js.map