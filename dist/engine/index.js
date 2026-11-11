"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboundMediaTimeoutMs = exports.inboundMediaMaxBytes = exports.inboundMediaConcurrency = exports.BaileysStoredMessage = void 0;
var baileys_stored_message_entity_1 = require("./adapters/baileys-stored-message.entity");
Object.defineProperty(exports, "BaileysStoredMessage", { enumerable: true, get: function () { return baileys_stored_message_entity_1.BaileysStoredMessage; } });
var inbound_media_cap_1 = require("./adapters/inbound-media-cap");
Object.defineProperty(exports, "inboundMediaConcurrency", { enumerable: true, get: function () { return inbound_media_cap_1.inboundMediaConcurrency; } });
Object.defineProperty(exports, "inboundMediaMaxBytes", { enumerable: true, get: function () { return inbound_media_cap_1.inboundMediaMaxBytes; } });
Object.defineProperty(exports, "inboundMediaTimeoutMs", { enumerable: true, get: function () { return inbound_media_cap_1.inboundMediaTimeoutMs; } });
//# sourceMappingURL=index.js.map