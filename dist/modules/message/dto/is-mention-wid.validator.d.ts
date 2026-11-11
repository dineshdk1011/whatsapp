import { ValidatorConstraintInterface } from 'class-validator';
export declare function isMentionWid(value: unknown): boolean;
export declare class IsMentionWidConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
