"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryMainConnection = exports.SQLITE_BUSY_TIMEOUT_MS = exports.MainSchemaMismatchError = void 0;
exports.mainConnectionOptions = mainConnectionOptions;
exports.createMainDataSource = createMainDataSource;
const path_1 = require("path");
const typeorm_1 = require("typeorm");
class MainSchemaMismatchError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MainSchemaMismatchError';
    }
}
exports.MainSchemaMismatchError = MainSchemaMismatchError;
exports.SQLITE_BUSY_TIMEOUT_MS = 30_000;
const retryMainConnection = (err) => !(err instanceof MainSchemaMismatchError);
exports.retryMainConnection = retryMainConnection;
function mainConnectionOptions(configService) {
    return {
        name: 'main',
        type: 'better-sqlite3',
        database: configService.get('database.database', './data/main.sqlite'),
        timeout: exports.SQLITE_BUSY_TIMEOUT_MS,
        entities: [
            (0, path_1.join)(__dirname, '..', 'modules/auth/**/*.entity{.ts,.js}'),
            (0, path_1.join)(__dirname, '..', 'modules/audit/**/*.entity{.ts,.js}'),
        ],
        migrations: [(0, path_1.join)(__dirname, 'migrations-main/*{.ts,.js}')],
        synchronize: configService.get('database.synchronize', false),
        logging: configService.get('database.logging', false),
        toRetry: exports.retryMainConnection,
    };
}
async function createMainDataSource(options) {
    const opts = options;
    const ds = new typeorm_1.DataSource({ ...opts, synchronize: false, migrationsRun: false });
    await ds.initialize();
    try {
        const shipped = new Set(ds.migrations.map(m => m.name));
        const unknown = (await new typeorm_1.MigrationExecutor(ds).getExecutedMigrations())
            .map(m => m.name)
            .filter(name => !shipped.has(name));
        if (unknown.length) {
            throw new MainSchemaMismatchError(`${String(opts.database)} records migration(s) this release does not ship (${unknown.join(', ')}): a ` +
                'newer OpenWA release has upgraded it. Run that release, or restore the file from the backup taken ' +
                'before the upgrade (docs/14-migration-guide.md, section 14.6).');
        }
        await ds.runMigrations({ transaction: 'all' });
        const missing = [];
        for (const metadata of ds.entityMetadatas) {
            const rows = await ds.query(`PRAGMA table_info("${metadata.tableName}")`);
            const present = new Set(rows.map(r => r.name));
            for (const column of metadata.columns) {
                if (!present.has(column.databaseName))
                    missing.push(`${metadata.tableName}.${column.databaseName}`);
            }
        }
        if (missing.length) {
            throw new MainSchemaMismatchError(`${String(opts.database)} lacks ${missing.join(', ')} after every shipped migrations-main migration ` +
                'ran. Either an older OpenWA release has rebuilt the table and the values it held are gone (restore ' +
                'the file from the backup taken before the downgrade, docs/14-migration-guide.md, section 14.6; ' +
                'without a backup, docs/05-database-design.md section 5.6 re-creates the column empty, and each ' +
                "key's chat scope must then be re-applied), or " +
                'an entity declares a column that no migrations-main migration creates yet (add one: ' +
                'MAIN_DATABASE_SYNCHRONIZE=true does not add columns the chain lacks).');
        }
        if (opts.synchronize)
            await ds.synchronize();
        return ds;
    }
    catch (err) {
        await ds.destroy().catch(() => undefined);
        throw err;
    }
}
//# sourceMappingURL=main-connection.js.map