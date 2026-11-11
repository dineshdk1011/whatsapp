"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecognisedSessionConfigConstraint = void 0;
exports.normaliseSessionConfig = normaliseSessionConfig;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const session_config_dto_1 = require("./session-config.dto");
const RECOGNISED_KEYS = ['autoRejectCalls', 'maxReconnectAttempts', 'reconnectBaseDelay'];
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
function recognisedKeys(config) {
    const sent = Object.fromEntries(RECOGNISED_KEYS.filter(key => key in config).map(key => [key, config[key]]));
    return (0, class_transformer_1.plainToInstance)(session_config_dto_1.UpdateSessionConfigDto, sent);
}
function normaliseSessionConfig(value) {
    if (!isRecord(value))
        return value;
    const coerced = recognisedKeys(value);
    const normalised = { ...value };
    for (const key of RECOGNISED_KEYS)
        if (key in value)
            normalised[key] = coerced[key];
    return normalised;
}
function configErrors(value) {
    if (!isRecord(value))
        return [];
    return (0, class_validator_1.validateSync)(recognisedKeys(value))
        .flatMap(error => Object.values(error.constraints ?? {}))
        .map(message => `config.${message}`);
}
let RecognisedSessionConfigConstraint = class RecognisedSessionConfigConstraint {
    validate(value) {
        return configErrors(value).length === 0;
    }
    defaultMessage(args) {
        return configErrors(args.value).join('; ');
    }
};
exports.RecognisedSessionConfigConstraint = RecognisedSessionConfigConstraint;
exports.RecognisedSessionConfigConstraint = RecognisedSessionConfigConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isRecognisedSessionConfig', async: false })
], RecognisedSessionConfigConstraint);
//# sourceMappingURL=recognised-session-config.validator.js.map