"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsChatIdConstraint = void 0;
exports.isChatId = isChatId;
const class_validator_1 = require("class-validator");
const BARE_NUMBER = /^\d{5,}$/;
const GROUP_USER_PART = /^\d+(?:-\d+)?$/;
const PLAIN_DIGITS = /^\d{5,}$/;
function isChatId(value) {
    if (typeof value !== 'string')
        return false;
    const trimmed = value.trim();
    if (trimmed === '' || trimmed !== value || trimmed.includes(','))
        return false;
    if (BARE_NUMBER.test(trimmed))
        return true;
    const at = trimmed.lastIndexOf('@');
    if (at === -1)
        return false;
    const user = trimmed.slice(0, at).split(':')[0];
    const domain = trimmed.slice(at + 1).toLowerCase();
    if (domain === 'g.us')
        return GROUP_USER_PART.test(user);
    if (domain === 'c.us' || domain === 's.whatsapp.net' || domain === 'lid')
        return PLAIN_DIGITS.test(user);
    return false;
}
let IsChatIdConstraint = class IsChatIdConstraint {
    validate(value) {
        return isChatId(value);
    }
    defaultMessage() {
        return 'each allowedChats entry must be a chat id (a group "<id>@g.us", a contact "<phone>@c.us" / "<lid>@lid", or a bare phone number) with no surrounding whitespace and no comma';
    }
};
exports.IsChatIdConstraint = IsChatIdConstraint;
exports.IsChatIdConstraint = IsChatIdConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isChatId', async: false })
], IsChatIdConstraint);
//# sourceMappingURL=is-chat-id.validator.js.map