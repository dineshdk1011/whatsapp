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
exports.postgresDataSourceOptions = void 0;
exports.buildPostgresDataSourceOptions = buildPostgresDataSourceOptions;
const typeorm_1 = require("typeorm");
const path = __importStar(require("path"));
const load_cli_env_1 = require("./load-cli-env");
const postgres_utc_1 = require("./postgres-utc");
const env_validation_1 = require("../config/env.validation");
(0, load_cli_env_1.loadCliEnv)();
const rawDbType = process.env.DATABASE_TYPE;
if (rawDbType?.trim() && rawDbType !== 'sqlite' && rawDbType !== 'postgres') {
    throw new Error(`DATABASE_TYPE must be "sqlite" or "postgres" (got ${JSON.stringify(rawDbType)})`);
}
const sqlitePathCollision = (0, env_validation_1.sqliteDataMainPathCollision)(process.env);
if (sqlitePathCollision) {
    throw new Error(sqlitePathCollision);
}
const dbType = process.env.DATABASE_TYPE || 'sqlite';
const pgSchemaError = dbType === 'postgres' && process.env.POSTGRES_SCHEMA ? (0, env_validation_1.postgresSchemaError)(process.env.POSTGRES_SCHEMA) : null;
if (pgSchemaError) {
    throw new Error(pgSchemaError);
}
const sourceGlob = (...segments) => path.join(__dirname, ...segments).replace(/\\/g, '/');
const dataEntities = [
    sourceGlob('..', 'modules', 'session', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'webhook', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'message', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'template', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'engine', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'integration', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'status-store', '**', '*.entity{.ts,.js}'),
    sourceGlob('..', 'modules', 'automation', '**', '*.entity{.ts,.js}'),
];
const dataMigrations = [sourceGlob('migrations', '*{.ts,.js}')];
const sqliteDataSourceOptions = {
    type: 'better-sqlite3',
    database: process.env.DATABASE_NAME || './data/openwa.sqlite',
    entities: dataEntities,
    migrations: dataMigrations,
    synchronize: false,
    logging: process.env.DATABASE_LOGGING === 'true',
};
function buildPostgresDataSourceOptions(env = process.env) {
    const schema = env.POSTGRES_SCHEMA || 'public';
    const useCustomSearchPath = schema !== 'public';
    const connectionTimeoutMillis = parseInt(env.DATABASE_CONNECTION_TIMEOUT_MS || '10000', 10);
    return {
        type: 'postgres',
        schema,
        host: env.DATABASE_HOST || 'localhost',
        port: parseInt(env.DATABASE_PORT || '5432', 10),
        username: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        database: env.DATABASE_NAME || 'openwa',
        entities: dataEntities,
        migrations: dataMigrations,
        synchronize: false,
        logging: env.DATABASE_LOGGING === 'true',
        ssl: env.DATABASE_SSL === 'true'
            ? {
                rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
            }
            : false,
        extra: {
            ...(0, postgres_utc_1.postgresUtcExtra)(connectionTimeoutMillis, useCustomSearchPath ? { searchPath: `${schema},public` } : {}),
            max: parseInt(env.DATABASE_POOL_SIZE || '10', 10),
            idleTimeoutMillis: parseInt(env.DATABASE_IDLE_TIMEOUT_MS || '30000', 10),
            connectionTimeoutMillis,
        },
    };
}
exports.postgresDataSourceOptions = buildPostgresDataSourceOptions();
exports.default = new typeorm_1.DataSource(dbType === 'postgres' ? exports.postgresDataSourceOptions : sqliteDataSourceOptions);
//# sourceMappingURL=data-source.js.map