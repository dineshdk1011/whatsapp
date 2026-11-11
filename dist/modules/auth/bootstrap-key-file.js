"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapKeyFilePath = bootstrapKeyFilePath;
exports.readBootstrapKey = readBootstrapKey;
exports.writeBootstrapKey = writeBootstrapKey;
exports.removeBootstrapKey = removeBootstrapKey;
const fs_1 = require("fs");
const path_1 = require("path");
const secret_file_1 = require("../../common/utils/secret-file");
function bootstrapKeyFilePath() {
    return process.env.BOOTSTRAP_KEY_FILE || (0, path_1.join)(process.cwd(), 'data', '.api-key');
}
function readBootstrapKey(logger) {
    const file = bootstrapKeyFilePath();
    if (!(0, fs_1.existsSync)(file))
        return null;
    try {
        return (0, fs_1.readFileSync)(file, 'utf-8').trim() || null;
    }
    catch (error) {
        logger.warn(`Failed to read API key file: ${file}`, { error: String(error) });
        return null;
    }
}
function writeBootstrapKey(displayKey) {
    (0, secret_file_1.writeSecretFile)(bootstrapKeyFilePath(), displayKey);
}
function removeBootstrapKey(reason, logger) {
    const file = bootstrapKeyFilePath();
    try {
        (0, fs_1.unlinkSync)(file);
        logger.log(`Removed stale bootstrap API key file (${reason}): ${file}`);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return;
        logger.warn(`Failed to remove stale API key file: ${file}`, { error: String(error) });
    }
}
//# sourceMappingURL=bootstrap-key-file.js.map