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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const infra_response_dto_1 = require("./dto/infra-response.dto");
const import_data_dto_1 = require("./dto/import-data.dto");
const auth_decorators_1 = require("../auth/decorators/auth.decorators");
const api_key_entity_1 = require("../auth/entities/api-key.entity");
const infra_data_service_1 = require("./infra-data.service");
let InfraDataController = class InfraDataController {
    infraData;
    constructor(infraData) {
        this.infraData = infraData;
    }
    async exportData() {
        return this.infraData.exportData();
    }
    async importData(data) {
        return this.infraData.importData(data);
    }
};
exports.InfraDataController = InfraDataController;
__decorate([
    (0, common_1.Get)('export-data'),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Export all data from Data DB for migration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exported data as JSON', type: infra_response_dto_1.InfraExportDataResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Refused with code IMPORT_ALREADY_RUNNING: a data import is running; export after it finishes.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InfraDataController.prototype, "exportData", null);
__decorate([
    (0, common_1.Post)('import-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorators_1.RequireRole)(api_key_entity_1.ApiKeyRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Import data to Data DB (replaces existing data)' }),
    (0, swagger_1.ApiBody)({ description: 'Exported data from export-data endpoint', type: import_data_dto_1.ImportDataDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data imported successfully', type: infra_response_dto_1.InfraImportDataResponseDto }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Body rejected before the restore ran: `tables` absent or not an object, a table whose value is not an array of rows, a row that is not an object (`null`, a bare string, a nested array), a flag spelled as anything but a boolean or exact `true`/`false`, or a property this route does not accept. Nothing was written. Field-level detail is suppressed in production unless VALIDATION_ERROR_DETAIL=true.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Refused, with the reason in `code`. IMPORT_ALREADY_RUNNING: another import is running — wait for it. EXPORT_IN_PROGRESS: a data export is running; wait for it. IMPORT_NESTED_TRANSACTION: another database transaction holds this connection, so a restore could not be made durable — retry with nothing else in flight. IMPORT_WOULD_ORPHAN_ENGINES: sessions the backup would remove are running, starting or waiting to relaunch here — retry with stopOrphans=true to stop them in-request, or force=true to proceed and restart after. Only the last of these is retryable with stopOrphans; the others leave nothing to decide',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_data_dto_1.ImportDataDto]),
    __metadata("design:returntype", Promise)
], InfraDataController.prototype, "importData", null);
exports.InfraDataController = InfraDataController = __decorate([
    (0, swagger_1.ApiTags)('infrastructure'),
    (0, common_1.Controller)('infra'),
    (0, auth_decorators_1.RequireUnscopedKey)(),
    __metadata("design:paramtypes", [infra_data_service_1.InfraDataService])
], InfraDataController);
//# sourceMappingURL=infra-data.controller.js.map