import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { Template } from './entities/template.entity';
export declare class TemplateController {
    private readonly templateService;
    constructor(templateService: TemplateService);
    create(sessionId: string, dto: CreateTemplateDto): Promise<Template>;
    findBySession(sessionId: string): Promise<Template[]>;
    findOne(sessionId: string, id: string): Promise<Template>;
    update(sessionId: string, id: string, dto: UpdateTemplateDto): Promise<Template>;
    delete(sessionId: string, id: string): Promise<void>;
}
