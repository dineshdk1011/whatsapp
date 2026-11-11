export declare const MEDIA_URL_MESSAGE = "url must be an absolute http(s) URL";
export declare const isMediaUrl: (value: unknown) => boolean;
export declare const IsMediaUrl: <T extends object>(options?: {
    ignoreWhen?: (object: T) => boolean;
}) => PropertyDecorator;
