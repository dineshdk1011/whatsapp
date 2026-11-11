"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageImportResponseDto = exports.StorageExportResponseDto = exports.StorageFileCountResponseDto = exports.InfraImportDataResponseDto = exports.InfraExportDataResponseDto = exports.OmittedInlineMediaDto = exports.TableCountsDto = exports.MigrationTablesDto = exports.InfraRestartResponseDto = exports.InfraConfigSaveResponseDto = exports.InfraConfigResponseDto = exports.InfraConfigEngineDto = exports.InfraConfigStorageDto = exports.InfraConfigQueueDto = exports.InfraConfigRedisDto = exports.InfraConfigDatabaseDto = exports.InfraUpdateCheckResponseDto = exports.InfraCurrentEngineResponseDto = exports.AvailableEngineDto = exports.EngineLibraryDto = exports.InfraHealthResponseDto = exports.InfraStatusResponseDto = exports.InfraEngineStatusDto = exports.InfraStorageStatusDto = exports.InfraQueueStatusDto = exports.InfraQueueDepthDto = exports.InfraRedisStatusDto = exports.InfraDatabaseStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InfraDatabaseStatusDto {
    connected;
    type;
    host;
    builtIn;
    running;
}
exports.InfraDatabaseStatusDto = InfraDatabaseStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a `SELECT 1` probe succeeded just now.', example: true }),
    __metadata("design:type", Boolean)
], InfraDatabaseStatusDto.prototype, "connected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Configured driver.', example: 'postgres' }),
    __metadata("design:type", String)
], InfraDatabaseStatusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Host the app is configured to reach.', example: 'openwa-postgres' }),
    __metadata("design:type", String)
], InfraDatabaseStatusDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Whether OpenWA's own bundled container is actually running and backing this service, " +
            'detected live from the labelled container rather than read from the saved intent. When Docker is ' +
            "unavailable it falls back to the saved flag (the environment's first) beside a host that reaches the " +
            'bundled container: neither a host name nor the flag alone proves it.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], InfraDatabaseStatusDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether a bundled PostgreSQL container OpenWA created is running, whether or not this service uses it, beside ' +
            "this instance's built-in flag (the environment's first). False for one Docker Compose created, or with the " +
            'flag not set; absent when Docker is unreachable, where nothing can be seen or stopped.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], InfraDatabaseStatusDto.prototype, "running", void 0);
class InfraRedisStatusDto {
    enabled;
    connected;
    host;
    port;
    builtIn;
    running;
}
exports.InfraRedisStatusDto = InfraRedisStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether Redis is switched on in configuration.', example: true }),
    __metadata("design:type", Boolean)
], InfraRedisStatusDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a live probe reached it.', example: true }),
    __metadata("design:type", Boolean)
], InfraRedisStatusDto.prototype, "connected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'openwa-redis' }),
    __metadata("design:type", String)
], InfraRedisStatusDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6379 }),
    __metadata("design:type", Number)
], InfraRedisStatusDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Whether OpenWA's bundled Redis container is backing this.", example: true }),
    __metadata("design:type", Boolean)
], InfraRedisStatusDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether a bundled Redis container OpenWA created is running, whether or not this service uses it, beside ' +
            "this instance's built-in flag (the environment's first). False for one Docker Compose created, or with the " +
            'flag not set; absent when Docker is unreachable, where nothing can be seen or stopped.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], InfraRedisStatusDto.prototype, "running", void 0);
class InfraQueueDepthDto {
    pending;
    completed;
    failed;
}
exports.InfraQueueDepthDto = InfraQueueDepthDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Jobs waiting to be delivered.', example: 0 }),
    __metadata("design:type", Number)
], InfraQueueDepthDto.prototype, "pending", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Jobs delivered successfully.', example: 128 }),
    __metadata("design:type", Number)
], InfraQueueDepthDto.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Jobs that exhausted their retries.', example: 2 }),
    __metadata("design:type", Number)
], InfraQueueDepthDto.prototype, "failed", void 0);
class InfraQueueStatusDto {
    enabled;
    webhooks;
}
exports.InfraQueueStatusDto = InfraQueueStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether queue processing is switched on.', example: true }),
    __metadata("design:type", Boolean)
], InfraQueueStatusDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraQueueDepthDto, description: 'Webhook queue depths.' }),
    __metadata("design:type", InfraQueueDepthDto)
], InfraQueueStatusDto.prototype, "webhooks", void 0);
class InfraStorageStatusDto {
    type;
    path;
    bucket;
    endpoint;
    builtIn;
    running;
    s3Available;
}
exports.InfraStorageStatusDto = InfraStorageStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['local', 's3'], example: 'local' }),
    __metadata("design:type", String)
], InfraStorageStatusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Local storage root. Also reported for `s3`, where it is the fallback directory used while the bucket ' +
            'is unreachable.',
        example: './data/media',
    }),
    __metadata("design:type", String)
], InfraStorageStatusDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bucket name. Present only for `s3`.', example: 'openwa-media' }),
    __metadata("design:type", String)
], InfraStorageStatusDto.prototype, "bucket", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'S3 endpoint the app is configured to reach. Present only for `s3` with an endpoint set; absent for the ' +
            'default AWS endpoint.',
        example: 'http://minio:9000',
    }),
    __metadata("design:type", String)
], InfraStorageStatusDto.prototype, "endpoint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Whether OpenWA's bundled MinIO container is backing this.", example: false }),
    __metadata("design:type", Boolean)
], InfraStorageStatusDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether a bundled MinIO container OpenWA created is running, whether or not this service uses it, beside ' +
            "this instance's built-in flag (the environment's first). False for one Docker Compose created, or with the " +
            'flag not set; absent when Docker is unreachable, where nothing can be seen or stopped.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], InfraStorageStatusDto.prototype, "running", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the S3 endpoint answered a probe. Present only for `s3`.' }),
    __metadata("design:type", Boolean)
], InfraStorageStatusDto.prototype, "s3Available", void 0);
class InfraEngineStatusDto {
    type;
    headless;
    sessionDataPath;
    browserArgs;
    webVersion;
    webVersionSource;
}
exports.InfraEngineStatusDto = InfraEngineStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Active engine.', example: 'baileys' }),
    __metadata("design:type", String)
], InfraEngineStatusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether Chromium runs headless. Meaningful for whatsapp-web.js only.', example: true }),
    __metadata("design:type", Boolean)
], InfraEngineStatusDto.prototype, "headless", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: './data/sessions' }),
    __metadata("design:type", String)
], InfraEngineStatusDto.prototype, "sessionDataPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Effective Chromium launch arguments: PUPPETEER_ARGS or the defaults, with --lang=en-US appended unless a ' +
            '--lang flag is already present.',
        example: '--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --lang=en-US',
    }),
    __metadata("design:type", String)
], InfraEngineStatusDto.prototype, "browserArgs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        nullable: true,
        description: 'whatsapp-web.js only: the WhatsApp Web build sessions request as their pin, which is distinct from the ' +
            'library version. A page can still run another build; each session logs the one it runs when it reaches ' +
            'ready. Omitted for other engines.',
        example: '2.3000.1234567890',
    }),
    __metadata("design:type", Object)
], InfraEngineStatusDto.prototype, "webVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['pinned', 'auto', 'native'],
        description: 'How that build was chosen. Omitted for other engines.',
        example: 'pinned',
    }),
    __metadata("design:type", String)
], InfraEngineStatusDto.prototype, "webVersionSource", void 0);
class InfraStatusResponseDto {
    database;
    redis;
    queue;
    storage;
    engine;
    envPinned;
}
exports.InfraStatusResponseDto = InfraStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraDatabaseStatusDto }),
    __metadata("design:type", InfraDatabaseStatusDto)
], InfraStatusResponseDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraRedisStatusDto }),
    __metadata("design:type", InfraRedisStatusDto)
], InfraStatusResponseDto.prototype, "redis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraQueueStatusDto }),
    __metadata("design:type", InfraQueueStatusDto)
], InfraStatusResponseDto.prototype, "queue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraStorageStatusDto }),
    __metadata("design:type", InfraStorageStatusDto)
], InfraStatusResponseDto.prototype, "storage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraEngineStatusDto }),
    __metadata("design:type", InfraEngineStatusDto)
], InfraStatusResponseDto.prototype, "engine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Which dashboard-editable settings are supplied by a layer ABOVE ' +
            '`data/.env.generated` — the container environment or a project `.env` — and so cannot be ' +
            'changed from the dashboard until that layer is. Reported, not inferred from a running-vs-saved ' +
            'mismatch: a save that has not been restarted yet looks identical and needs the opposite advice.',
        example: ['ENGINE_TYPE'],
    }),
    __metadata("design:type", Array)
], InfraStatusResponseDto.prototype, "envPinned", void 0);
class InfraHealthResponseDto {
    status;
    timestamp;
}
exports.InfraHealthResponseDto = InfraHealthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Liveness marker. This route does not probe dependencies.', example: 'ok' }),
    __metadata("design:type", String)
], InfraHealthResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp of the reply.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], InfraHealthResponseDto.prototype, "timestamp", void 0);
class EngineLibraryDto {
    name;
    version;
}
exports.EngineLibraryDto = EngineLibraryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The underlying library, distinct from the engine plugin's own manifest name.",
        example: 'whatsapp-web.js',
    }),
    __metadata("design:type", String)
], EngineLibraryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Library version actually loaded.', example: '1.34.7' }),
    __metadata("design:type", String)
], EngineLibraryDto.prototype, "version", void 0);
class AvailableEngineDto {
    id;
    name;
    enabled;
    features;
    library;
}
exports.AvailableEngineDto = AvailableEngineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Engine plugin id — the value ENGINE_TYPE takes.', example: 'baileys' }),
    __metadata("design:type", String)
], AvailableEngineDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display name from the plugin manifest.', example: 'Baileys' }),
    __metadata("design:type", String)
], AvailableEngineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the plugin is enabled. Disabled engines are still listed.', example: true }),
    __metadata("design:type", Boolean)
], AvailableEngineDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Capabilities the engine declares.',
        example: ['text-messages', 'media-messages', 'group-management'],
    }),
    __metadata("design:type", Array)
], AvailableEngineDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: EngineLibraryDto,
        description: 'Absent when the plugin does not report a library. Built-in engines report it whether or not they are enabled.',
    }),
    __metadata("design:type", EngineLibraryDto)
], AvailableEngineDto.prototype, "library", void 0);
class InfraCurrentEngineResponseDto {
    engineType;
}
exports.InfraCurrentEngineResponseDto = InfraCurrentEngineResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Engine the process resolved at boot.', example: 'baileys' }),
    __metadata("design:type", String)
], InfraCurrentEngineResponseDto.prototype, "engineType", void 0);
class InfraUpdateCheckResponseDto {
    current;
    latest;
    updateAvailable;
    releaseUrl;
}
exports.InfraUpdateCheckResponseDto = InfraUpdateCheckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Version of the running code.', example: '0.23.5' }),
    __metadata("design:type", String)
], InfraUpdateCheckResponseDto.prototype, "current", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'Latest published release, or null when the check is off or GitHub has not been reached yet. A ' +
            'later failed check keeps the last known release.',
        example: '0.23.6',
    }),
    __metadata("design:type", Object)
], InfraUpdateCheckResponseDto.prototype, "latest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether `latest` is newer than `current`.', example: true }),
    __metadata("design:type", Boolean)
], InfraUpdateCheckResponseDto.prototype, "updateAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'Release notes page for `latest`.',
        example: 'https://github.com/rmyndharis/OpenWA/releases/tag/v0.23.6',
    }),
    __metadata("design:type", Object)
], InfraUpdateCheckResponseDto.prototype, "releaseUrl", void 0);
const BUILT_IN_SET_DESCRIPTION = 'Whether the saved configuration states the built-in mode of this service. False when a host pinned by the ' +
    'environment decides it (builtIn then reports the pin: true for the bundled host), when the saved file does not ' +
    'select the service (the first boot writes every flag as false next to a service that is not in use), when the ' +
    'file holds the bundled host with the flag not true (the next boot dials the container, builtIn is true), and ' +
    'when nothing is saved. When false, read what runs from /infra/status.';
class InfraConfigDatabaseDto {
    type;
    builtIn;
    builtInSet;
    host;
    port;
    username;
    database;
    schema;
    poolSize;
    sslEnabled;
    sslRejectUnauthorized;
    passwordSet;
}
exports.InfraConfigDatabaseDto = InfraConfigDatabaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['sqlite', 'postgres'], example: 'postgres' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigDatabaseDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: BUILT_IN_SET_DESCRIPTION, example: true }),
    __metadata("design:type", Boolean)
], InfraConfigDatabaseDto.prototype, "builtInSet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'openwa-postgres' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Kept as a string: it is echoed back from the saved env verbatim.', example: '5432' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'openwa' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Database name under PostgreSQL; empty under SQLite.', example: 'openwa' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'public' }),
    __metadata("design:type", String)
], InfraConfigDatabaseDto.prototype, "schema", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], InfraConfigDatabaseDto.prototype, "poolSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], InfraConfigDatabaseDto.prototype, "sslEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigDatabaseDto.prototype, "sslRejectUnauthorized", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a password is stored. The secret itself is never returned.', example: true }),
    __metadata("design:type", Boolean)
], InfraConfigDatabaseDto.prototype, "passwordSet", void 0);
class InfraConfigRedisDto {
    enabled;
    builtIn;
    builtInSet;
    host;
    port;
    passwordSet;
}
exports.InfraConfigRedisDto = InfraConfigRedisDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigRedisDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigRedisDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: BUILT_IN_SET_DESCRIPTION, example: true }),
    __metadata("design:type", Boolean)
], InfraConfigRedisDto.prototype, "builtInSet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'openwa-redis' }),
    __metadata("design:type", String)
], InfraConfigRedisDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Echoed from the saved env verbatim.', example: '6379' }),
    __metadata("design:type", String)
], InfraConfigRedisDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a password is stored. The secret itself is never returned.', example: false }),
    __metadata("design:type", Boolean)
], InfraConfigRedisDto.prototype, "passwordSet", void 0);
class InfraConfigQueueDto {
    enabled;
}
exports.InfraConfigQueueDto = InfraConfigQueueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigQueueDto.prototype, "enabled", void 0);
class InfraConfigStorageDto {
    type;
    builtIn;
    builtInSet;
    localPath;
    s3Bucket;
    s3Region;
    s3Endpoint;
    s3CredentialsSet;
}
exports.InfraConfigStorageDto = InfraConfigStorageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['local', 's3'], example: 'local' }),
    __metadata("design:type", String)
], InfraConfigStorageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], InfraConfigStorageDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: BUILT_IN_SET_DESCRIPTION, example: true }),
    __metadata("design:type", Boolean)
], InfraConfigStorageDto.prototype, "builtInSet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: './data/media' }),
    __metadata("design:type", String)
], InfraConfigStorageDto.prototype, "localPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '' }),
    __metadata("design:type", String)
], InfraConfigStorageDto.prototype, "s3Bucket", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '' }),
    __metadata("design:type", String)
], InfraConfigStorageDto.prototype, "s3Region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '' }),
    __metadata("design:type", String)
], InfraConfigStorageDto.prototype, "s3Endpoint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether both an access key id and a secret are stored. Neither is ever returned.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], InfraConfigStorageDto.prototype, "s3CredentialsSet", void 0);
class InfraConfigEngineDto {
    type;
    headless;
    sessionDataPath;
    browserArgs;
}
exports.InfraConfigEngineDto = InfraConfigEngineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'whatsapp-web.js' }),
    __metadata("design:type", String)
], InfraConfigEngineDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraConfigEngineDto.prototype, "headless", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: './data/sessions' }),
    __metadata("design:type", String)
], InfraConfigEngineDto.prototype, "sessionDataPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '' }),
    __metadata("design:type", String)
], InfraConfigEngineDto.prototype, "browserArgs", void 0);
class InfraConfigResponseDto {
    database;
    redis;
    queue;
    storage;
    engine;
}
exports.InfraConfigResponseDto = InfraConfigResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraConfigDatabaseDto }),
    __metadata("design:type", InfraConfigDatabaseDto)
], InfraConfigResponseDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraConfigRedisDto }),
    __metadata("design:type", InfraConfigRedisDto)
], InfraConfigResponseDto.prototype, "redis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraConfigQueueDto }),
    __metadata("design:type", InfraConfigQueueDto)
], InfraConfigResponseDto.prototype, "queue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraConfigStorageDto }),
    __metadata("design:type", InfraConfigStorageDto)
], InfraConfigResponseDto.prototype, "storage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfraConfigEngineDto }),
    __metadata("design:type", InfraConfigEngineDto)
], InfraConfigResponseDto.prototype, "engine", void 0);
class InfraConfigSaveResponseDto {
    message;
    saved;
    envPath;
    profiles;
}
exports.InfraConfigSaveResponseDto = InfraConfigSaveResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Configuration saved successfully. Server restart required to apply changes.' }),
    __metadata("design:type", String)
], InfraConfigSaveResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'False when the write failed. This route answers 200 either way, so a client must read this ' +
            'flag rather than the status code.',
        example: true,
    }),
    __metadata("design:type", Boolean)
], InfraConfigSaveResponseDto.prototype, "saved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Path of the env file written, relative to the working directory so the host layout is not disclosed.',
        example: 'data/.env.generated',
    }),
    __metadata("design:type", String)
], InfraConfigSaveResponseDto.prototype, "envPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Docker profiles the saved selection requires.', example: ['postgres'] }),
    __metadata("design:type", Array)
], InfraConfigSaveResponseDto.prototype, "profiles", void 0);
class InfraRestartResponseDto {
    message;
    restarting;
    profiles;
    profilesToRemove;
    estimatedTime;
    orchestration;
    removal;
}
exports.InfraRestartResponseDto = InfraRestartResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Restart scheduled.' }),
    __metadata("design:type", String)
], InfraRestartResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether a restart was actually scheduled.', example: true }),
    __metadata("design:type", Boolean)
], InfraRestartResponseDto.prototype, "restarting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Docker profiles to bring up.', example: ['postgres'] }),
    __metadata("design:type", Array)
], InfraRestartResponseDto.prototype, "profiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Profiles to tear down. Teardown is stop-only: containers are stopped and retained for ' +
            're-enable, never deleted.',
        example: [],
    }),
    __metadata("design:type", Array)
], InfraRestartResponseDto.prototype, "profilesToRemove", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rough seconds before the process is expected back.', example: 15 }),
    __metadata("design:type", Number)
], InfraRestartResponseDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Object,
        description: 'Raw per-service orchestration outcome, present only when profiles were started.',
    }),
    __metadata("design:type", Object)
], InfraRestartResponseDto.prototype, "orchestration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Object,
        description: 'Raw per-service stop outcome, present only when profiles were torn down.',
    }),
    __metadata("design:type", Object)
], InfraRestartResponseDto.prototype, "removal", void 0);
class MigrationTablesDto {
    sessions;
    webhooks;
    messages;
    messageBatches;
    templates;
    baileysStoredMessages;
    lidMappings;
    chatStates;
    pluginInstances;
    conversationMappings;
    ingressEvents;
    webhookDeliveryFailures;
    webhookOutboxEvents;
    integrationDeliveryFailures;
    statusUpdates;
    automationRules;
}
exports.MigrationTablesDto = MigrationTablesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "webhooks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "messageBatches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "templates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "baileysStoredMessages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "lidMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "chatStates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "pluginInstances", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "conversationMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "ingressEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "webhookDeliveryFailures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "webhookOutboxEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "integrationDeliveryFailures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "statusUpdates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MigrationTablesDto.prototype, "automationRules", void 0);
class TableCountsDto {
    sessions;
    webhooks;
    messages;
    messageBatches;
    templates;
    baileysStoredMessages;
    lidMappings;
    chatStates;
    pluginInstances;
    conversationMappings;
    ingressEvents;
    webhookDeliveryFailures;
    webhookOutboxEvents;
    integrationDeliveryFailures;
    statusUpdates;
    automationRules;
}
exports.TableCountsDto = TableCountsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "webhooks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1024 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "messageBatches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "templates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 512 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "baileysStoredMessages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 64 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "lidMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "chatStates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "pluginInstances", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "conversationMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "ingressEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "webhookDeliveryFailures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "webhookOutboxEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "integrationDeliveryFailures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "statusUpdates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], TableCountsDto.prototype, "automationRules", void 0);
class OmittedInlineMediaDto {
    messages;
    messageBatches;
}
exports.OmittedInlineMediaDto = OmittedInlineMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message attachments replaced with an omitted marker.', example: 0 }),
    __metadata("design:type", Number)
], OmittedInlineMediaDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch attachments replaced with an omitted marker.', example: 0 }),
    __metadata("design:type", Number)
], OmittedInlineMediaDto.prototype, "messageBatches", void 0);
class InfraExportDataResponseDto {
    exportedAt;
    dataDbType;
    tables;
    counts;
    skippedTables;
    omittedInlineMedia;
}
exports.InfraExportDataResponseDto = InfraExportDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO-8601 timestamp the export was taken.', example: '2026-08-07T12:00:00.000Z' }),
    __metadata("design:type", String)
], InfraExportDataResponseDto.prototype, "exportedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Driver the data came from.', example: 'postgres' }),
    __metadata("design:type", String)
], InfraExportDataResponseDto.prototype, "dataDbType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: MigrationTablesDto }),
    __metadata("design:type", MigrationTablesDto)
], InfraExportDataResponseDto.prototype, "tables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TableCountsDto, description: 'Row counts, so a truncated restore is detectable.' }),
    __metadata("design:type", TableCountsDto)
], InfraExportDataResponseDto.prototype, "counts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Tables the running database does not have, which were skipped rather than exported. A restore ' +
            'from this file will not repopulate them.',
        example: [],
    }),
    __metadata("design:type", Array)
], InfraExportDataResponseDto.prototype, "skippedTables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: OmittedInlineMediaDto,
        description: 'Inline media dropped for exceeding the export budget. Non-zero means the archive is TRUNCATED — ' +
            'the rows are present but their attachments are replaced with an omitted marker.',
    }),
    __metadata("design:type", OmittedInlineMediaDto)
], InfraExportDataResponseDto.prototype, "omittedInlineMedia", void 0);
class InfraImportDataResponseDto {
    imported;
    counts;
    warnings;
    notices;
    restartRequired;
    orphanedEngines;
    stoppedOrphanEngines;
    failedOrphanEngines;
}
exports.InfraImportDataResponseDto = InfraImportDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], InfraImportDataResponseDto.prototype, "imported", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TableCountsDto, description: 'Rows written per table.' }),
    __metadata("design:type", TableCountsDto)
], InfraImportDataResponseDto.prototype, "counts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Why the restore was rolled back (per-row failures, a failed session ownership restore, chat-state re-key ' +
            'or restored-row cleanup, a failed trim of the send idempotency claims, or a backup with no rows). Non-empty ' +
            'only when `imported` is false; non-fatal ' +
            'messages are in `notices`.',
        example: [],
    }),
    __metadata("design:type", Array)
], InfraImportDataResponseDto.prototype, "warnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Informational messages about what the import did.', example: [] }),
    __metadata("design:type", Array)
], InfraImportDataResponseDto.prototype, "notices", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'True when an engine may still be writing into the restored tables (orphans left running by `force`, a ' +
            'failed `stopOrphans` teardown, sessions held by another node; restart to reconcile), or when plugin ' +
            'instance bindings could not be re-synced after the commit (a restart does not repair this; follow the ' +
            'manual check named in `notices`). Can be true even when `imported` is false.',
        example: false,
    }),
    __metadata("design:type", Boolean)
], InfraImportDataResponseDto.prototype, "restartRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Sessions running here that the imported set does not contain — they were about to be deleted.',
        example: [],
    }),
    __metadata("design:type", Array)
], InfraImportDataResponseDto.prototype, "orphanedEngines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Of those, the ones successfully stopped.', example: [] }),
    __metadata("design:type", Array)
], InfraImportDataResponseDto.prototype, "stoppedOrphanEngines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Of those, the ones that could not be stopped.', example: [] }),
    __metadata("design:type", Array)
], InfraImportDataResponseDto.prototype, "failedOrphanEngines", void 0);
class StorageFileCountResponseDto {
    storageType;
    count;
    sizeBytes;
    sizeMB;
}
exports.StorageFileCountResponseDto = StorageFileCountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['local', 's3'], example: 'local' }),
    __metadata("design:type", String)
], StorageFileCountResponseDto.prototype, "storageType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of stored objects.', example: 128 }),
    __metadata("design:type", Number)
], StorageFileCountResponseDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total size in bytes.', example: 10485760 }),
    __metadata("design:type", Number)
], StorageFileCountResponseDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The same size in MB, pre-rendered to two decimals.', example: '10.00' }),
    __metadata("design:type", String)
], StorageFileCountResponseDto.prototype, "sizeMB", void 0);
class StorageExportResponseDto {
    message;
    download;
}
exports.StorageExportResponseDto = StorageExportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Storage export completed' }),
    __metadata("design:type", String)
], StorageExportResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Server-side path of the archive, relative to the gateway working directory. Not a download URL: ' +
            'pass it as `filePath` to POST /api/infra/storage/import.',
        example: 'data/exports/storage-export-1750000000000-abc.tar.gz',
    }),
    __metadata("design:type", String)
], StorageExportResponseDto.prototype, "download", void 0);
class StorageImportResponseDto {
    imported;
    count;
    failed;
    storageType;
}
exports.StorageImportResponseDto = StorageImportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], StorageImportResponseDto.prototype, "imported", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Objects written.', example: 128 }),
    __metadata("design:type", Number)
], StorageImportResponseDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Archive entries the store refused to write. `imported` is false when entries failed and none was written.',
        example: 0,
    }),
    __metadata("design:type", Number)
], StorageImportResponseDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['local', 's3'], example: 'local' }),
    __metadata("design:type", String)
], StorageImportResponseDto.prototype, "storageType", void 0);
//# sourceMappingURL=infra-response.dto.js.map