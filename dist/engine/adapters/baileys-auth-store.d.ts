import type * as BaileysLib from '@whiskeysockets/baileys';
import type { AuthenticationState } from '@whiskeysockets/baileys';
import { type createLogger } from '../../common/services/logger.service';
export type BaileysAuthLib = Pick<typeof BaileysLib, 'initAuthCreds' | 'BufferJSON' | 'proto'>;
export declare function useAtomicMultiFileAuthState(folder: string, lib: BaileysAuthLib, logger: Pick<ReturnType<typeof createLogger>, 'warn' | 'error'>): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
