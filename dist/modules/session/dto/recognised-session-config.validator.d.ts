import { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare function normaliseSessionConfig(value: unknown): unknown;
export declare class RecognisedSessionConfigConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean;
    defaultMessage(args: ValidationArguments): string;
}
