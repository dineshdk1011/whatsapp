"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsSessionIdConstraint = void 0;
exports.isSessionId = isSessionId;
const class_validator_1 = require("class-validator");
function isSessionId(value) {
    return typeof value === 'string' && value.trim() === value && value.length > 0 && !value.includes(',');
}
let IsSessionIdConstraint = class IsSessionIdConstraint {
    validate(value) {
        return isSessionId(value);
    }
    defaultMessage() {
        return 'each allowedSessions entry must be a non-empty session id with no surrounding whitespace and no comma';
    }
};
exports.IsSessionIdConstraint = IsSessionIdConstraint;
exports.IsSessionIdConstraint = IsSessionIdConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isSessionId', async: false })
], IsSessionIdConstraint);
//# sourceMappingURL=is-session-id.validator.js.map