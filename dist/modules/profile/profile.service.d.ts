import { EngineRegistry } from '../../engine/engine-registry.service';
import { SetProfilePictureDto } from './dto/profile.dto';
export declare class ProfileService {
    private readonly engines;
    constructor(engines: EngineRegistry);
    private getEngine;
    setProfileName(sessionId: string, name: string): Promise<void>;
    setProfileStatus(sessionId: string, status: string): Promise<void>;
    deleteProfilePicture(sessionId: string): Promise<void>;
    setProfilePicture(sessionId: string, dto: SetProfilePictureDto): Promise<void>;
}
