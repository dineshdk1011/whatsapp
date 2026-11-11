import { ApiKey } from './entities/api-key.entity';
import { EngineFactory } from '../../engine/engine.factory';
export declare class AuthValidateController {
    private readonly engineFactory;
    constructor(engineFactory: EngineFactory);
    validate(apiKey?: ApiKey): {
        valid: boolean;
        role?: string;
        engineType?: string;
        scoped?: boolean;
    };
}
