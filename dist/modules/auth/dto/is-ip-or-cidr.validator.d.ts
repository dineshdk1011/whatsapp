import { ValidatorConstraintInterface } from 'class-validator';
export declare function isIpOrCidr(value: unknown): boolean;
export declare class IsIpOrCidrConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
