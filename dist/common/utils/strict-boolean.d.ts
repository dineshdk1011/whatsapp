import { TransformFnParams } from 'class-transformer';
export declare function coerceStrictBoolean({ obj, key }: Pick<TransformFnParams, 'obj' | 'key'>): unknown;
export declare const ToStrictBoolean: () => PropertyDecorator;
export declare function coerceStrictNumber({ obj, key }: Pick<TransformFnParams, 'obj' | 'key'>): unknown;
export declare const ToStrictNumber: () => PropertyDecorator;
export declare function coerceStrictString({ obj, key }: Pick<TransformFnParams, 'obj' | 'key'>): unknown;
export declare const ToStrictString: () => PropertyDecorator;
export declare function coerceStrictArray({ value, obj, key }: Pick<TransformFnParams, 'value' | 'obj' | 'key'>): unknown;
export declare const ToStrictArray: () => PropertyDecorator;
