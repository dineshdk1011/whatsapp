"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryStatusToMessageStatus = deliveryStatusToMessageStatus;
exports.deliveryStatusToAck = deliveryStatusToAck;
exports.ackStatusTransitionFrom = ackStatusTransitionFrom;
const message_entity_1 = require("./entities/message.entity");
function deliveryStatusToMessageStatus(status) {
    switch (status) {
        case 'failed':
            return message_entity_1.MessageStatus.FAILED;
        case 'read':
            return message_entity_1.MessageStatus.READ;
        case 'delivered':
            return message_entity_1.MessageStatus.DELIVERED;
        default:
            return null;
    }
}
function deliveryStatusToAck(status) {
    switch (status) {
        case 'failed':
            return -1;
        case 'read':
            return 3;
        case 'delivered':
            return 2;
        case 'sent':
            return 1;
        default:
            return 0;
    }
}
function ackStatusTransitionFrom(target) {
    switch (target) {
        case message_entity_1.MessageStatus.DELIVERED:
            return [message_entity_1.MessageStatus.PENDING, message_entity_1.MessageStatus.SENT];
        case message_entity_1.MessageStatus.READ:
            return [message_entity_1.MessageStatus.PENDING, message_entity_1.MessageStatus.SENT, message_entity_1.MessageStatus.DELIVERED];
        case message_entity_1.MessageStatus.FAILED:
            return [message_entity_1.MessageStatus.PENDING, message_entity_1.MessageStatus.SENT];
        default:
            return [];
    }
}
//# sourceMappingURL=message-status.util.js.map