"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRunningWebBuild = reportRunningWebBuild;
function readRunningWebBuild() {
    return window.Debug?.VERSION;
}
function numericBuild(version) {
    return /^\d+(?:\.\d+)*/.exec(version.trim())?.[0] ?? null;
}
async function reportRunningWebBuild(page, logger, sessionId, pinnedVersion) {
    if (!page)
        return;
    let runningVersion;
    try {
        runningVersion = await page.evaluate(readRunningWebBuild);
    }
    catch {
        return;
    }
    if (typeof runningVersion !== 'string' || runningVersion === '')
        return;
    const pinned = pinnedVersion ? numericBuild(pinnedVersion) : null;
    const running = numericBuild(runningVersion);
    if (pinned && running && pinned !== running) {
        logger.warn(`WhatsApp Web build ${runningVersion} is running on this session's page, not the pinned build ` +
            `${pinnedVersion}: the pin did not take effect for this page load. See docs/12-troubleshooting-faq.md.`, { sessionId, action: 'web_version_pin_not_applied', runningVersion, pinnedVersion });
        return;
    }
    logger.log(`WhatsApp Web build ${runningVersion} is running on this session's page`, {
        sessionId,
        action: 'web_version_running',
        runningVersion,
        pinnedVersion: pinnedVersion ?? null,
    });
}
//# sourceMappingURL=wwebjs-running-build.js.map