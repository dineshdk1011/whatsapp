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
exports.UpsertContactDto = exports.ADDRESSBOOK_NAME_MAX_LENGTH = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
exports.ADDRESSBOOK_NAME_MAX_LENGTH = 100;
class UpsertContactDto {
    firstName;
    lastName;
}
exports.UpsertContactDto = UpsertContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "The contact's first name.", minLength: 1, maxLength: exports.ADDRESSBOOK_NAME_MAX_LENGTH }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(exports.ADDRESSBOOK_NAME_MAX_LENGTH),
    __metadata("design:type", String)
], UpsertContactDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "The contact's last name. Omit for a single-name contact — WhatsApp allows those.",
        maxLength: exports.ADDRESSBOOK_NAME_MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.ADDRESSBOOK_NAME_MAX_LENGTH),
    __metadata("design:type", String)
], UpsertContactDto.prototype, "lastName", void 0);
//# sourceMappingURL=upsert-contact.dto.js.map