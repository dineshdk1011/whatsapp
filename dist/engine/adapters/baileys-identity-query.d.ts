import type * as BaileysLib from '@whiskeysockets/baileys';
import type { WASocket } from '@whiskeysockets/baileys';
export declare function queryLidPhone(socket: WASocket, library: typeof BaileysLib, phone: string, lid: string, budgetMs: number): Promise<boolean>;
