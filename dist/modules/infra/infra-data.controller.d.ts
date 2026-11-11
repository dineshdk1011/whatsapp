import { ImportDataDto } from './dto/import-data.dto';
import { InfraDataService, InfraExportDataResult, InfraImportDataResult } from './infra-data.service';
export declare class InfraDataController {
    private readonly infraData;
    constructor(infraData: InfraDataService);
    exportData(): Promise<InfraExportDataResult>;
    importData(data: ImportDataDto): Promise<InfraImportDataResult>;
}
