import { ArgumentMetadata, INestApplication, PipeTransform, ValidationPipeOptions } from '@nestjs/common';
export declare const GLOBAL_VALIDATION_OPTIONS: ValidationPipeOptions;
export declare class NulBodyPipe implements PipeTransform {
    transform(value: unknown, { type, metatype }: ArgumentMetadata): unknown;
}
export declare function applyGlobalValidation(app: INestApplication): void;
