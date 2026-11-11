"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSecretFile = writeSecretFile;
const fs_1 = require("fs");
const logger_service_1 = require("../services/logger.service");
const logger = (0, logger_service_1.createLogger)('SecretFile');
function writeSecretFile(filePath, content, warn = message => logger.warn(message)) {
    try {
        (0, fs_1.chmodSync)(filePath, 0o600);
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            warn(`pre-write chmod 0o600 failed for ${filePath}: ${error.message}`);
        }
    }
    (0, fs_1.writeFileSync)(filePath, content, { mode: 0o600 });
    try {
        (0, fs_1.chmodSync)(filePath, 0o600);
    }
    catch (error) {
        warn(`post-write chmod 0o600 failed for ${filePath}: ${error.message}`);
    }
}
//# sourceMappingURL=secret-file.js.map