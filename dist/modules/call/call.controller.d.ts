import { CreateCallLinkDto } from './dto/create-call-link.dto';
import { CallLinkResponseDto } from './dto/call-link-response.dto';
import { CallService } from './call.service';
export declare class CallController {
    private readonly callService;
    constructor(callService: CallService);
    createLink(sessionId: string, dto: CreateCallLinkDto): Promise<CallLinkResponseDto>;
    reject(sessionId: string, callId: string): Promise<{
        success: boolean;
    }>;
}
