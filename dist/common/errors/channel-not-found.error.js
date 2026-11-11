"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelNotFoundError = void 0;
const common_1 = require("@nestjs/common");
class ChannelNotFoundError extends common_1.NotFoundException {
    constructor(channelId) {
        super(`Channel ${channelId} not found`);
    }
}
exports.ChannelNotFoundError = ChannelNotFoundError;
//# sourceMappingURL=channel-not-found.error.js.map