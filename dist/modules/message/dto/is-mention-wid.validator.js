"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsMentionWidConstraint = void 0;
exports.isMentionWid = isMentionWid;
const class_validator_1 = require("class-validator");
const wa_id_1 = require("../../../engine/identity/wa-id");
function isMentionWid(value) {
    if (typeof value !== 'string')
        return false;
    return (0, wa_id_1.isIndividualWid)(value);
}
let IsMentionWidConstraint = class IsMentionWidConstraint {
    validate(value) {
        return isMentionWid(value);
    }
    defaultMessage() {
        return 'each mentions entry must be an individual WID — <phone>@c.us or <lid>@lid';
    }
};
exports.IsMentionWidConstraint = IsMentionWidConstraint;
exports.IsMentionWidConstraint = IsMentionWidConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isMentionWid', async: false })
], IsMentionWidConstraint);
//# sourceMappingURL=is-mention-wid.validator.js.map