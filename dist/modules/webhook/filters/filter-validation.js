"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFilterErrors = collectFilterErrors;
exports.IsValidWebhookFilters = IsValidWebhookFilters;
const class_validator_1 = require("class-validator");
const filter_types_1 = require("./filter-types");
const OPERATORS = ['is', 'isNot', 'contains', 'equals'];
const CONDITION_KEYS = ['field', 'operator', 'value', 'caseSensitive'];
function validateCondition(condition, index) {
    const where = `conditions[${index}]`;
    if (typeof condition !== 'object' || condition === null)
        return `${where} must be an object`;
    const unknown = Object.keys(condition).filter(k => !CONDITION_KEYS.includes(k));
    if (unknown.length)
        return `${where} has unknown key(s): ${unknown.join(', ')}`;
    const { field, operator, value, caseSensitive } = condition;
    if (typeof field !== 'string')
        return `${where}.field must be a string`;
    const def = (0, filter_types_1.findFieldDefinition)(field);
    if (!def)
        return `${where}.field "${field}" is not a recognized filter field`;
    if (typeof operator !== 'string' || !OPERATORS.includes(operator)) {
        return `${where}.operator "${String(operator)}" is invalid`;
    }
    if (!def.operators.includes(operator)) {
        return `${where}.operator "${operator}" is not allowed for field "${field}"`;
    }
    if (caseSensitive !== undefined && typeof caseSensitive !== 'boolean') {
        return `${where}.caseSensitive must be a boolean`;
    }
    switch (def.kind) {
        case 'boolean':
            if (typeof value !== 'boolean')
                return `${where}.value must be a boolean for "${field}"`;
            return null;
        case 'text': {
            if (typeof value !== 'string')
                return `${where}.value must be a string for "${field}"`;
            if (value.length > filter_types_1.MAX_TEXT_VALUE_LENGTH)
                return `${where}.value exceeds ${filter_types_1.MAX_TEXT_VALUE_LENGTH} chars`;
            return null;
        }
        case 'id':
        case 'idArray':
        case 'enum': {
            if (!Array.isArray(value) || value.length === 0) {
                return `${where}.value must be a non-empty array for "${field}"`;
            }
            if (value.length > filter_types_1.MAX_VALUES_PER_CONDITION) {
                return `${where}.value exceeds ${filter_types_1.MAX_VALUES_PER_CONDITION} entries`;
            }
            for (const v of value) {
                if (typeof v !== 'string' || v.length === 0)
                    return `${where}.value entries must be non-empty strings`;
                if (def.kind === 'enum' && def.enumValues && !def.enumValues.includes(v)) {
                    return `${where}.value "${v}" is not a valid ${field}`;
                }
            }
            return null;
        }
        default:
            return `${where} has an unsupported field kind`;
    }
}
function collectFilterErrors(value) {
    if (value === null || value === undefined)
        return [];
    if (typeof value !== 'object')
        return ['filters must be an object'];
    const extra = Object.keys(value).filter(k => k !== 'conditions');
    if (extra.length)
        return [`filters has unknown key(s): ${extra.join(', ')}`];
    const conditions = value.conditions;
    if (!Array.isArray(conditions))
        return ['filters.conditions must be an array'];
    if (conditions.length > filter_types_1.MAX_CONDITIONS)
        return [`filters.conditions exceeds ${filter_types_1.MAX_CONDITIONS} entries`];
    const errors = [];
    conditions.forEach((condition, index) => {
        const error = validateCondition(condition, index);
        if (error)
            errors.push(error);
    });
    return errors;
}
let IsValidWebhookFiltersConstraint = class IsValidWebhookFiltersConstraint {
    validate(value) {
        return collectFilterErrors(value).length === 0;
    }
    defaultMessage(args) {
        return collectFilterErrors(args.value).join('; ') || 'Invalid webhook filters';
    }
};
IsValidWebhookFiltersConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isValidWebhookFilters', async: false })
], IsValidWebhookFiltersConstraint);
function IsValidWebhookFilters(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidWebhookFiltersConstraint,
        });
    };
}
//# sourceMappingURL=filter-validation.js.map