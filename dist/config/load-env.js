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
exports.loadEnvironment = loadEnvironment;
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_service_1 = require("../common/services/logger.service");
const secret_file_1 = require("../common/utils/secret-file");
const env_precedence_1 = require("./env-precedence");
const logger = (0, logger_service_1.createLogger)('Bootstrap');
function loadEnvironment() {
    const lines = [];
    try {
        mergeEnvironment(lines);
    }
    finally {
        (0, logger_service_1.applyLogLevelFromEnv)();
        const requestedFormat = process.env.LOG_FORMAT?.trim();
        const writtenFormat = (0, logger_service_1.logFormatFromEnv)();
        if (requestedFormat && requestedFormat.toLowerCase() !== writtenFormat) {
            lines.push({
                level: 'warn',
                message: `LOG_FORMAT=${JSON.stringify(requestedFormat)} is not json or pretty; writing ${writtenFormat}, the NODE_ENV default`,
            });
        }
        for (const { level, message } of lines)
            logger[level](message);
    }
}
function mergeEnvironment(lines) {
    const generatedEnvPath = path.resolve(process.cwd(), 'data', '.env.generated');
    const userEnvPath = path.resolve(process.cwd(), '.env');
    const dataDir = path.dirname(generatedEnvPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    for (const secret of [generatedEnvPath, path.resolve(dataDir, '.api-key')]) {
        if (fs.existsSync(secret)) {
            try {
                fs.chmodSync(secret, 0o600);
            }
            catch {
            }
        }
    }
    (0, env_precedence_1.clearBlankEnv)(process.env, env_precedence_1.BLANK_SHADOWED_ENV_KEYS);
    (0, env_precedence_1.recordOsEnvKeys)(process.env);
    if (fs.existsSync(userEnvPath)) {
        lines.push({ level: 'log', message: `Loading .env from: ${userEnvPath}` });
        dotenv.config({ path: userEnvPath, override: false, quiet: true });
    }
    (0, env_precedence_1.recordPinnedEnvKeys)(process.env);
    if (fs.existsSync(generatedEnvPath)) {
        lines.push({ level: 'log', message: `Loading saved configuration from: ${generatedEnvPath}` });
        const { parsed = {} } = dotenv.config({ path: generatedEnvPath, override: false, quiet: true });
        for (const key of ['DATABASE_SSL', 'DATABASE_SSL_REJECT_UNAUTHORIZED']) {
            if (parsed[key] !== undefined && process.env[key] !== parsed[key]) {
                lines.push({
                    level: 'warn',
                    message: `${key}=${process.env[key]} from the environment or .env overrides ${key}=${parsed[key]} ` +
                        'saved in data/.env.generated (Dashboard > Infrastructure)',
                });
            }
        }
    }
    else {
        lines.push({ level: 'log', message: 'First run detected, creating default configuration...' });
        const minimalConfig = `# OpenWA Configuration
# Generated automatically on first run
# Edit via Dashboard > Infrastructure or modify this file directly.
# Note: values in process env or project .env take precedence over this file.

# Database (SQLite - no external service required)
DATABASE_TYPE=sqlite
POSTGRES_BUILTIN=false

# Redis & Queue (disabled by default)
REDIS_ENABLED=false
REDIS_BUILTIN=false
QUEUE_ENABLED=false

# Storage (Local filesystem)
STORAGE_TYPE=local
MINIO_BUILTIN=false
STORAGE_LOCAL_PATH=./data/media

# Docker Profiles: none (minimal setup)
`;
        (0, secret_file_1.writeSecretFile)(generatedEnvPath, minimalConfig, message => lines.push({ level: 'warn', message }));
        lines.push({ level: 'log', message: `Created default configuration at: ${generatedEnvPath}` });
        dotenv.config({ path: generatedEnvPath, override: false, quiet: true });
    }
}
loadEnvironment();
//# sourceMappingURL=load-env.js.map