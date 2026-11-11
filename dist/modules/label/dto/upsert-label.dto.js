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
exports.UpsertLabelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
class UpsertLabelDto {
    name;
    color;
}
exports.UpsertLabelDto = UpsertLabelDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Label name. The write replaces the whole label, so an omitted name is not preserved.',
        example: 'VIP customer',
        minLength: 1,
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpsertLabelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "WhatsApp's colour INDEX (0-19), not a hex value — the read path's `hexColor` cannot be " +
            'translated back, because neither engine exposes the mapping. An omitted colour is not preserved.',
        example: 3,
        minimum: 0,
        maximum: 19,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(19),
    __metadata("design:type", Number)
], UpsertLabelDto.prototype, "color", void 0);
//# sourceMappingURL=upsert-label.dto.js.map