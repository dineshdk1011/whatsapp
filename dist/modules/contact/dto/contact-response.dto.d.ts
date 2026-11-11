export declare class ContactDto {
    id: string;
    name?: string;
    pushName?: string;
    number: string;
    isMyContact: boolean;
    isBlocked: boolean;
    profilePicUrl?: string;
}
export declare class ProfilePictureResponseDto {
    url: string | null;
}
export declare class ProfilePicturesResponseDto {
    pictures: {
        [contactId: string]: string | null;
    };
}
export declare class NumberCheckResponseDto {
    number: string;
    exists: boolean;
    whatsappId: string | null;
}
export declare class ResolvedPhoneResponseDto {
    contactId: string;
    phone: string | null;
}
export declare class ContactAckResponseDto {
    success: boolean;
    message: string;
}
