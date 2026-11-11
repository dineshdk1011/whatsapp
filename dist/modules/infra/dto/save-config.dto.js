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
exports.SaveConfigDto = exports.EngineConfigDto = exports.StorageConfigDto = exports.QueueConfigDto = exports.RedisConfigDto = exports.DatabaseConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class DatabaseConfigDto {
    type;
    builtIn;
    host;
    port;
    username;
    password;
    database;
    schema;
    poolSize;
    sslEnabled;
    sslRejectUnauthorized;
}
exports.DatabaseConfigDto = DatabaseConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['sqlite', 'postgres'],
        description: 'Absent keeps the stored selection, which the rest of the section then applies to. While the environment pins ' +
            'another selection than the stored one, a section without it writes nothing.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['sqlite', 'postgres']),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DatabaseConfigDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DatabaseConfigDto.prototype, "schema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DatabaseConfigDto.prototype, "poolSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DatabaseConfigDto.prototype, "sslEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DatabaseConfigDto.prototype, "sslRejectUnauthorized", void 0);
class RedisConfigDto {
    enabled;
    builtIn;
    host;
    port;
    password;
}
exports.RedisConfigDto = RedisConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RedisConfigDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RedisConfigDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedisConfigDto.prototype, "host", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedisConfigDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedisConfigDto.prototype, "password", void 0);
class QueueConfigDto {
    enabled;
}
exports.QueueConfigDto = QueueConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueueConfigDto.prototype, "enabled", void 0);
class StorageConfigDto {
    type;
    builtIn;
    localPath;
    s3Bucket;
    s3Region;
    s3AccessKey;
    s3SecretKey;
    s3Endpoint;
}
exports.StorageConfigDto = StorageConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['local', 's3'],
        description: 'Absent keeps the stored selection, which the rest of the section then applies to. While the environment pins ' +
            'another selection than the stored one, a section without it writes nothing.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['local', 's3']),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StorageConfigDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "localPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "s3Bucket", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "s3Region", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "s3AccessKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "s3SecretKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StorageConfigDto.prototype, "s3Endpoint", void 0);
class EngineConfigDto {
    type;
    headless;
    sessionDataPath;
    browserArgs;
}
exports.EngineConfigDto = EngineConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EngineConfigDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], EngineConfigDto.prototype, "headless", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EngineConfigDto.prototype, "sessionDataPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EngineConfigDto.prototype, "browserArgs", void 0);
class SaveConfigDto {
    database;
    redis;
    queue;
    storage;
    engine;
}
exports.SaveConfigDto = SaveConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => DatabaseConfigDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DatabaseConfigDto),
    __metadata("design:type", DatabaseConfigDto)
], SaveConfigDto.prototype, "database", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => RedisConfigDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RedisConfigDto),
    __metadata("design:type", RedisConfigDto)
], SaveConfigDto.prototype, "redis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => QueueConfigDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QueueConfigDto),
    __metadata("design:type", QueueConfigDto)
], SaveConfigDto.prototype, "queue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => StorageConfigDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StorageConfigDto),
    __metadata("design:type", StorageConfigDto)
], SaveConfigDto.prototype, "storage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => EngineConfigDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EngineConfigDto),
    __metadata("design:type", EngineConfigDto)
], SaveConfigDto.prototype, "engine", void 0);
//# sourceMappingURL=save-config.dto.js.map