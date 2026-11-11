import { ValidatorConstraintInterface } from 'class-validator';
export declare function isChatId(value: unknown): boolean;
export declare class IsChatIdConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
