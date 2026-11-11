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
exports.PluginCatalogEntryDto = exports.PluginHealthResponseDto = exports.PluginActionResponseDto = exports.InstallFromUrlDto = exports.PluginSessionsDto = exports.PluginConfigDto = exports.PluginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const plugins_1 = require("../../../core/plugins");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class PluginDto {
    id;
    name;
    version;
    type;
    description;
    author;
    status;
    config;
    builtIn;
    provides;
    ingressCapable;
    sessionScoped;
    activeSessions;
    configSchema;
    configUi;
    i18n;
    sessionConfig;
    loadedAt;
    enabledAt;
    error;
}
exports.PluginDto = PluginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin ID' }),
    __metadata("design:type", String)
], PluginDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin name' }),
    __metadata("design:type", String)
], PluginDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin version' }),
    __metadata("design:type", String)
], PluginDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plugins_1.PluginType, description: 'Plugin type' }),
    __metadata("design:type", String)
], PluginDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plugin description' }),
    __metadata("design:type", String)
], PluginDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Plugin author' }),
    __metadata("design:type", String)
], PluginDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plugins_1.PluginStatus, description: 'Plugin status' }),
    __metadata("design:type", String)
], PluginDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin configuration' }),
    __metadata("design:type", Object)
], PluginDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this is a built-in plugin' }),
    __metadata("design:type", Boolean)
], PluginDto.prototype, "builtIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Features provided by this plugin' }),
    __metadata("design:type", Array)
], PluginDto.prototype, "provides", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this plugin can host provisioned ingress instances' }),
    __metadata("design:type", Boolean)
], PluginDto.prototype, "ingressCapable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the plugin is scoped to specific sessions (false = global)' }),
    __metadata("design:type", Boolean)
], PluginDto.prototype, "sessionScoped", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Sessions this plugin is activated for; ['*'] = all numbers" }),
    __metadata("design:type", Array)
], PluginDto.prototype, "activeSessions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Configuration schema' }),
    __metadata("design:type", Object)
], PluginDto.prototype, "configSchema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sandboxed-iframe config editor (entry HTML + optional height)' }),
    __metadata("design:type", Object)
], PluginDto.prototype, "configUi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Localized dashboard text (name/description/config titles) per locale code' }),
    __metadata("design:type", Object)
], PluginDto.prototype, "i18n", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Per-session config overrides, keyed by sessionId (secrets redacted)' }),
    __metadata("design:type", Object)
], PluginDto.prototype, "sessionConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'When the plugin was loaded' }),
    __metadata("design:type", String)
], PluginDto.prototype, "loadedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'When the plugin was enabled' }),
    __metadata("design:type", String)
], PluginDto.prototype, "enabledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Error message if plugin is in error state' }),
    __metadata("design:type", String)
], PluginDto.prototype, "error", void 0);
class PluginConfigDto {
    config;
}
exports.PluginConfigDto = PluginConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plugin configuration object' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PluginConfigDto.prototype, "config", void 0);
class PluginSessionsDto {
    sessions;
}
exports.PluginSessionsDto = PluginSessionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Sessions to activate the plugin for; ['*'] = all numbers, [] = none",
        example: ['*'],
        type: [String],
    }),
    (0, strict_boolean_1.ToStrictArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PluginSessionsDto.prototype, "sessions", void 0);
class InstallFromUrlDto {
    url;
}
exports.InstallFromUrlDto = InstallFromUrlDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL of the plugin .zip to download and install (SSRF-guarded; private-network hosts remain ' +
            'subject to the guard). https:// is accepted without a pin, except that NODE_ENV=production (the ' +
            'Docker image default) requires the `#sha256=` pin described below on every URL unless ' +
            'PLUGIN_INSTALL_REQUIRE_PIN=false, and PLUGIN_INSTALL_REQUIRE_PIN=true requires it everywhere. ' +
            'Plain http:// is only accepted when the URL ' +
            'pins the package content — append `#sha256=<64 hex>` (fragment — never sent to the server; query ' +
            'params are ignored) — because the package is executable code and must be integrity-protected in ' +
            'transit. A pinned digest that does not match the downloaded archive fails the install.',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'], require_protocol: true, require_tld: false, allow_underscores: true }, { message: 'url must be an absolute http(s) URL' }),
    __metadata("design:type", String)
], InstallFromUrlDto.prototype, "url", void 0);
class PluginActionResponseDto {
    success;
    message;
}
exports.PluginActionResponseDto = PluginActionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the change was applied; a refusal is carried in `message`.', example: true }),
    __metadata("design:type", Boolean)
], PluginActionResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable outcome.', example: 'Plugin echo configuration updated' }),
    __metadata("design:type", String)
], PluginActionResponseDto.prototype, "message", void 0);
class PluginHealthResponseDto {
    healthy;
    message;
}
exports.PluginHealthResponseDto = PluginHealthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the plugin reports healthy.', example: true }),
    __metadata("design:type", Boolean)
], PluginHealthResponseDto.prototype, "healthy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Failure detail when unhealthy.', example: 'worker did not answer in time' }),
    __metadata("design:type", String)
], PluginHealthResponseDto.prototype, "message", void 0);
class PluginCatalogEntryDto {
    id;
    name;
    version;
    type;
    status;
    description;
    author;
    license;
    keywords;
    minOpenWAVersion;
    testedOpenWAVersion;
    releasedAt;
    repoUrl;
    homepage;
    download;
    installed;
    installedVersion;
    updateAvailable;
}
exports.PluginCatalogEntryDto = PluginCatalogEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'echo' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Echo Bot' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.2.0' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'utility' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'stable' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MIT' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "license", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], PluginCatalogEntryDto.prototype, "keywords", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0.18.0' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "minOpenWAVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0.18.0' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "testedOpenWAVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-01' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "releasedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://github.com/example/echo-plugin' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "repoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "homepage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Download URL of the plugin package.' }),
    __metadata("design:type", String)
], PluginCatalogEntryDto.prototype, "download", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this instance has the plugin installed.', example: false }),
    __metadata("design:type", Boolean)
], PluginCatalogEntryDto.prototype, "installed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'The installed version, or null when not installed.',
        example: null,
    }),
    __metadata("design:type", Object)
], PluginCatalogEntryDto.prototype, "installedVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True when installed and the catalog version is strictly newer.', example: false }),
    __metadata("design:type", Boolean)
], PluginCatalogEntryDto.prototype, "updateAvailable", void 0);
//# sourceMappingURL=plugin.dto.js.map