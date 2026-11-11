"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsIpOrCidrConstraint = void 0;
exports.isIpOrCidr = isIpOrCidr;
const class_validator_1 = require("class-validator");
const net_1 = require("net");
function isIpOrCidr(value) {
    if (typeof value !== 'string')
        return false;
    const slash = value.indexOf('/');
    if (slash === -1)
        return (0, net_1.isIP)(value) === 4;
    if ((0, net_1.isIP)(value.slice(0, slash)) !== 4)
        return false;
    const bits = value.slice(slash + 1);
    return /^\d{1,2}$/.test(bits) && Number(bits) <= 32;
}
let IsIpOrCidrConstraint = class IsIpOrCidrConstraint {
    validate(value) {
        return isIpOrCidr(value);
    }
    defaultMessage() {
        return 'each allowedIps entry must be a valid IPv4 address or IPv4 CIDR range (e.g. 10.0.0.0/8)';
    }
};
exports.IsIpOrCidrConstraint = IsIpOrCidrConstraint;
exports.IsIpOrCidrConstraint = IsIpOrCidrConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isIpOrCidr', async: false })
], IsIpOrCidrConstraint);
//# sourceMappingURL=is-ip-or-cidr.validator.js.map