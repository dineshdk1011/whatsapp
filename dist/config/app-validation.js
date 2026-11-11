"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NulBodyPipe = exports.GLOBAL_VALIDATION_OPTIONS = void 0;
exports.applyGlobalValidation = applyGlobalValidation;
const common_1 = require("@nestjs/common");
const bootstrap_security_1 = require("./bootstrap-security");
const no_nul_character_1 = require("../common/validation/no-nul-character");
const import_data_dto_1 = require("../modules/infra/dto/import-data.dto");
exports.GLOBAL_VALIDATION_OPTIONS = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
};
class NulBodyPipe {
    transform(value, { type, metatype }) {
        if (type === 'body' && metatype !== import_data_dto_1.ImportDataDto && (0, no_nul_character_1.containsNul)(value)) {
            throw new common_1.BadRequestException('Request body must not contain a NUL character');
        }
        return value;
    }
}
exports.NulBodyPipe = NulBodyPipe;
function applyGlobalValidation(app) {
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        ...exports.GLOBAL_VALIDATION_OPTIONS,
        disableErrorMessages: !(0, bootstrap_security_1.isValidationErrorDetailEnabled)(process.env.VALIDATION_ERROR_DETAIL, process.env.NODE_ENV),
    }), new NulBodyPipe());
}
//# sourceMappingURL=app-validation.js.map