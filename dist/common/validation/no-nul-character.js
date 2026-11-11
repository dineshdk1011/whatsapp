"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsNul = exports.NoNulCharacter = void 0;
const class_validator_1 = require("class-validator");
const NoNulCharacter = () => (0, class_validator_1.NotContains)('\u0000', { message: '$property must not contain a NUL character' });
exports.NoNulCharacter = NoNulCharacter;
const containsNul = (value) => typeof value === 'string'
    ? value.includes('\u0000')
    : typeof value === 'object' && value !== null && Object.values(value).some(exports.containsNul);
exports.containsNul = containsNul;
//# sourceMappingURL=no-nul-character.js.map