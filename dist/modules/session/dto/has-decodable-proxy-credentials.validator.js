"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasDecodableProxyCredentialsConstraint = void 0;
exports.hasDecodableProxyCredentials = hasDecodableProxyCredentials;
const class_validator_1 = require("class-validator");
function hasDecodableProxyCredentials(value) {
    if (typeof value !== 'string' || value === '')
        return true;
    let url;
    try {
        url = new URL(value);
    }
    catch {
        return true;
    }
    try {
        decodeURIComponent(url.username);
        decodeURIComponent(url.password);
        return true;
    }
    catch {
        return false;
    }
}
let HasDecodableProxyCredentialsConstraint = class HasDecodableProxyCredentialsConstraint {
    validate(value) {
        return hasDecodableProxyCredentials(value);
    }
    defaultMessage() {
        return 'proxyUrl credentials contain an invalid percent-escape; write a literal % as %25';
    }
};
exports.HasDecodableProxyCredentialsConstraint = HasDecodableProxyCredentialsConstraint;
exports.HasDecodableProxyCredentialsConstraint = HasDecodableProxyCredentialsConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'hasDecodableProxyCredentials', async: false })
], HasDecodableProxyCredentialsConstraint);
//# sourceMappingURL=has-decodable-proxy-credentials.validator.js.map