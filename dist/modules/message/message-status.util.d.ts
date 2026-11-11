import { MessageStatus } from './entities/message.entity';
import { DeliveryStatus } from '../../engine/interfaces/whatsapp-engine.interface';
export declare function deliveryStatusToMessageStatus(status: DeliveryStatus): MessageStatus | null;
export declare function deliveryStatusToAck(status: DeliveryStatus): number;
export declare function ackStatusTransitionFrom(target: MessageStatus): MessageStatus[];
