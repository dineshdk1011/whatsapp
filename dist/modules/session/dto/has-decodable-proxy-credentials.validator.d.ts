import { ValidatorConstraintInterface } from 'class-validator';
export declare function hasDecodableProxyCredentials(value: unknown): boolean;
export declare class HasDecodableProxyCredentialsConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(): string;
}
