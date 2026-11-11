import { ValidatorConstraintInterface } from 'class-validator';
export declare function isSessionId(value: unknown): boolean;
export declare class IsSessionIdConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
