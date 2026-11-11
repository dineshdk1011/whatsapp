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
exports.CreateCallLinkDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
const MAX_DATE_MS = 8_640_000_000_000_000;
class CreateCallLinkDto {
    type;
    startTime;
}
exports.CreateCallLinkDto = CreateCallLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Which kind of call the link opens. WhatsApp's own URL path for `audio` is `/voice/`.",
        enum: ['audio', 'video'],
        example: 'video',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['audio', 'video']),
    __metadata("design:type", String)
], CreateCallLinkDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Absolute epoch-MILLISECONDS timestamp the call is scheduled to start at. Required: ' +
            'whatsapp-web.js generates an event-linked call and has no notion of "no start time", so a ' +
            'link for right now is `Date.now()` rather than an omitted field.',
        example: 1800000000000,
        type: 'integer',
        minimum: 1,
        maximum: MAX_DATE_MS,
    }),
    (0, strict_boolean_1.ToStrictNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(MAX_DATE_MS),
    __metadata("design:type", Number)
], CreateCallLinkDto.prototype, "startTime", void 0);
//# sourceMappingURL=create-call-link.dto.js.map