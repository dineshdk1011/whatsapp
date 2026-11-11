"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMediaNotSupportedError = void 0;
const common_1 = require("@nestjs/common");
class ChannelMediaNotSupportedError extends common_1.NotImplementedException {
    constructor(message = 'Sending media to channels (@newsletter) is not supported by the whatsapp-web.js engine.') {
        super(message);
    }
}
exports.ChannelMediaNotSupportedError = ChannelMediaNotSupportedError;
//# sourceMappingURL=channel-media-not-supported.error.js.map