import { ProfileService } from './profile.service';
import { SetProfileNameDto, SetProfileStatusDto, SetProfilePictureDto } from './dto/profile.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    setName(sessionId: string, dto: SetProfileNameDto): Promise<{
        success: boolean;
        message: string;
    }>;
    setStatus(sessionId: string, dto: SetProfileStatusDto): Promise<{
        success: boolean;
        message: string;
    }>;
    setPicture(sessionId: string, dto: SetProfilePictureDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deletePicture(sessionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
