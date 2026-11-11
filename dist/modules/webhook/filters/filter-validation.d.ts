import { ValidationOptions } from 'class-validator';
export declare function collectFilterErrors(value: unknown): string[];
export declare function IsValidWebhookFilters(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
