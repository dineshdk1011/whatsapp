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
exports.ImportDataDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const table_importers_1 = require("../table-importers");
const TABLE_PROPERTIES = Object.fromEntries(table_importers_1.TABLE_IMPORTERS.map((importer) => [importer.key, { type: 'array' }]));
class ImportDataDto {
    tables;
    force;
    stopOrphans;
    exportedAt;
    dataDbType;
    counts;
    skippedTables;
    omittedInlineMedia;
}
exports.ImportDataDto = ImportDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'object',
        description: `Every one of the ${table_importers_1.TABLE_IMPORTERS.length} migration tables is emptied before the restore runs, so a key omitted here is restored EMPTY rather than left untouched. Post the whole GET /api/infra/export-data payload, not a hand-built subset.`,
        properties: TABLE_PROPERTIES,
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "tables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Allow the replace to proceed even while engines are running for sessions the backup does not contain (they keep running until restart; see restartRequired). Prefer stopOrphans, which closes that window inside this request instead.',
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportDataDto.prototype, "force", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Stop the running engines for sessions the backup does not contain, inside this request and before the replace runs. Supersedes force for the orphan case: with stopOrphans the engines no longer need a process restart to reconcile, so restartRequired stays false on the success path.',
    }),
    (0, strict_boolean_1.ToStrictBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportDataDto.prototype, "stopOrphans", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'string', description: 'Ignored. Present so the export file posts back unmodified.' }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "exportedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'string', description: 'Ignored. Present so the export file posts back unmodified.' }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "dataDbType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'object',
        additionalProperties: { type: 'number' },
        description: 'Ignored. Present so the export file posts back unmodified.',
    }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "counts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'array',
        items: { type: 'string' },
        description: 'Ignored. Present so the export file posts back unmodified.',
    }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "skippedTables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: 'object',
        additionalProperties: { type: 'number' },
        description: 'Ignored. Present so the export file posts back unmodified.',
    }),
    (0, class_validator_1.Allow)(),
    __metadata("design:type", Object)
], ImportDataDto.prototype, "omittedInlineMedia", void 0);
//# sourceMappingURL=import-data.dto.js.map