import { MessageType } from '../../../engine/interfaces/whatsapp-engine.interface';
import { type ChatKind } from '../../../engine/identity/wa-id';
export type FilterOperator = 'is' | 'isNot' | 'contains' | 'equals';
export type FieldKind = 'id' | 'idArray' | 'text' | 'enum' | 'boolean';
export interface WebhookFilterCondition {
    field: string;
    operator: FilterOperator;
    value: string | string[] | boolean;
    caseSensitive?: boolean;
}
export interface WebhookFilters {
    conditions: WebhookFilterCondition[];
}
export interface FieldDefinition {
    field: string;
    kind: FieldKind;
    operators: FilterOperator[];
    resolve: (data: Record<string, unknown>) => unknown;
    enumValues?: readonly string[];
}
export declare const MESSAGE_TYPES: readonly MessageType[];
export declare const CHAT_KINDS: readonly ChatKind[];
export declare const MAX_CONDITIONS = 20;
export declare const MAX_VALUES_PER_CONDITION = 100;
export declare const MAX_TEXT_VALUE_LENGTH = 1000;
export declare const FILTER_FIELDS: Record<string, FieldDefinition[]>;
export declare function eventFamily(event: string): string;
export declare function getFieldDefinition(family: string, field: string): FieldDefinition | undefined;
export declare function findFieldDefinition(field: string): FieldDefinition | undefined;
