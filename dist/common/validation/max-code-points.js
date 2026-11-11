"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxCodePoints = MaxCodePoints;
const class_validator_1 = require("class-validator");
function MaxCodePoints(max, options) {
    return (0, class_validator_1.Matches)(new RegExp(`^[\\s\\S]{0,${max}}$`, 'u'), {
        message: `$property must be shorter than or equal to ${max} characters`,
        ...options,
    });
}
//# sourceMappingURL=max-code-points.js.map