"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const load_cli_env_1 = require("./load-cli-env");
const env_validation_1 = require("../config/env.validation");
(0, load_cli_env_1.loadCliEnv)();
const sqlitePathCollision = (0, env_validation_1.sqliteDataMainPathCollision)(process.env);
if (sqlitePathCollision) {
    throw new Error(sqlitePathCollision);
}
const mainDataSource = new typeorm_1.DataSource({
    type: 'better-sqlite3',
    database: process.env.MAIN_DATABASE_NAME || './data/main.sqlite',
    entities: [__dirname + '/../modules/auth/**/*.entity{.ts,.js}', __dirname + '/../modules/audit/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations-main/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.DATABASE_LOGGING === 'true',
});
exports.default = mainDataSource;
//# sourceMappingURL=data-source-main.js.map