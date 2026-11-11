"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_CONTAINS_WINDOW = exports.SEARCH_CONTAINS_TERMS_MAX_LENGTH = exports.SEARCH_CONTAINS_MIN_TERM_LENGTH = exports.SEARCH_MATCH_MODES = exports.SEARCH_TERMS_MAX = exports.SEARCH_QUERY_MAX_LENGTH = exports.SEARCH_DEFAULT_LIMIT = exports.SEARCH_OFFSET_MAX = exports.SEARCH_LIMIT_MAX = void 0;
const configuration_1 = require("../../config/configuration");
exports.SEARCH_LIMIT_MAX = (0, configuration_1.resolveNonNegativeIntEnv)(process.env.SEARCH_LIMIT_MAX, 100) || 100;
exports.SEARCH_OFFSET_MAX = 100_000;
exports.SEARCH_DEFAULT_LIMIT = 50;
exports.SEARCH_QUERY_MAX_LENGTH = 1000;
exports.SEARCH_TERMS_MAX = 32;
exports.SEARCH_MATCH_MODES = ['word', 'contains'];
exports.SEARCH_CONTAINS_MIN_TERM_LENGTH = 3;
exports.SEARCH_CONTAINS_TERMS_MAX_LENGTH = 64;
exports.SEARCH_CONTAINS_WINDOW = 1000;
//# sourceMappingURL=search.constants.js.map