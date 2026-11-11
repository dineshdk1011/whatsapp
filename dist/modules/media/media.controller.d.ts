import { MediaConversionService } from './media-conversion.service';
import { ConvertMediaDto } from './dto/convert-media.dto';
export declare class MediaController {
    private readonly mediaConversion;
    constructor(mediaConversion: MediaConversionService);
    conversionStatus(): Promise<{
        available: boolean;
    }>;
    convertVoice(sessionId: string, dto: ConvertMediaDto): Promise<import("./media-conversion.service").ConvertedMedia>;
    convertVideo(sessionId: string, dto: ConvertMediaDto): Promise<import("./media-conversion.service").ConvertedMedia>;
}
