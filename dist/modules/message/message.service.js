"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = exports.DEFAULT_PIN_DURATION_SECONDS = exports.DEFAULT_MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES = exports.DEFAULT_TEMPLATE_RENDER_MAX_CHARS = void 0;
exports.resolveMessageListInlineMediaBudgetBytes = resolveMessageListInlineMediaBudgetBytes;
exports.omitInlineMedia = omitInlineMedia;
exports.createInlineMediaSpender = createInlineMediaSpender;
exports.spendInlineMediaBudget = spendInlineMediaBudget;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stream_1 = require("stream");
const engine_registry_service_1 = require("../../engine/engine-registry.service");
const message_projector_service_1 = require("../session/message-projector.service");
const message_entity_1 = require("./entities/message.entity");
const hooks_1 = require("../../core/hooks");
const send_pacing_service_1 = require("./send-pacing.service");
const logger_service_1 = require("../../common/services/logger.service");
const jid_candidates_1 = require("../../engine/identity/jid-candidates");
const wa_id_1 = require("../../engine/identity/wa-id");
const lid_mapping_store_service_1 = require("../../engine/identity/lid-mapping-store.service");
const chat_media_archive_service_1 = require("../chat-media/chat-media-archive.service");
const storage_service_1 = require("../../common/storage/storage.service");
const message_send_service_1 = require("./message-send.service");
const message_window_1 = require("./message-window");
var message_send_service_2 = require("./message-send.service");
Object.defineProperty(exports, "DEFAULT_TEMPLATE_RENDER_MAX_CHARS", { enumerable: true, get: function () { return message_send_service_2.DEFAULT_TEMPLATE_RENDER_MAX_CHARS; } });
exports.DEFAULT_MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES = 8 * 1024 * 1024;
function resolveMessageListInlineMediaBudgetBytes() {
    const parsed = Number.parseInt(process.env.MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES ?? '', 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : exports.DEFAULT_MESSAGE_LIST_INLINE_MEDIA_BUDGET_BYTES;
}
const MEDIA_URL_POINTER = /^https?:\/\//i;
function omitInlineMedia(media) {
    const { data, ...withoutPayload } = media;
    return {
        ...withoutPayload,
        omitted: true,
        sizeBytes: media.sizeBytes ?? Buffer.byteLength(data, 'base64'),
    };
}
function createInlineMediaSpender(budgetBytes) {
    let spent = 0;
    return message => {
        const metadata = message.metadata;
        if (!metadata || typeof metadata !== 'object')
            return;
        if (message.type === 'revoked') {
            delete metadata.media;
            return;
        }
        const media = metadata.media;
        if (!media || typeof media.data !== 'string' || MEDIA_URL_POINTER.test(media.data))
            return;
        const encoded = Buffer.byteLength(media.data, 'utf8');
        const allowanceApplies = spent === 0 && budgetBytes > 0;
        if (spent + encoded <= budgetBytes || allowanceApplies) {
            spent += encoded;
            return;
        }
        metadata.media = omitInlineMedia({ ...media, data: media.data });
    };
}
function spendInlineMediaBudget(messages, budgetBytes) {
    messages.forEach(createInlineMediaSpender(budgetBytes));
    return messages;
}
const MESSAGE_LIST_READ_CHUNK_MIN_BYTES = 1024 * 1024;
function bareUserDigits(id) {
    const { kind, userPart } = (0, wa_id_1.parseWaId)(id);
    return kind === 'user' && /^\d+$/.test(userPart) ? [userPart] : [];
}
exports.DEFAULT_PIN_DURATION_SECONDS = 86400;
const INERT_MEDIA_MIMETYPE = /^(image\/(jpeg|png|gif|webp|bmp)|video\/(mp4|webm|quicktime|3gpp)|audio\/(mpeg|mp4|ogg|aac|wav|webm))$/;
function inertMimetype(mimetype) {
    const essence = mimetype.split(';')[0].trim().toLowerCase();
    return INERT_MEDIA_MIMETYPE.test(essence) ? essence : 'application/octet-stream';
}
let MessageService = class MessageService {
    static { MessageService_1 = this; }
    messageRepository;
    engines;
    messageProjector;
    hookManager;
    lidMappingStore;
    pacing;
    sender;
    chatMediaArchive;
    storageService;
    logger = (0, logger_service_1.createLogger)('MessageService');
    constructor(messageRepository, engines, messageProjector, hookManager, lidMappingStore, pacing, sender, chatMediaArchive, storageService) {
        this.messageRepository = messageRepository;
        this.engines = engines;
        this.messageProjector = messageProjector;
        this.hookManager = hookManager;
        this.lidMappingStore = lidMappingStore;
        this.pacing = pacing;
        this.sender = sender;
        this.chatMediaArchive = chatMediaArchive;
        this.storageService = storageService;
    }
    get orderTiebreak() {
        return this.messageRepository.manager?.connection?.options?.type === 'postgres' ? 'id' : 'rowid';
    }
    byPrimaryKey(predicate) {
        return this.orderTiebreak === 'rowid'
            ? predicate.replace(/\bmessage\.(?!id\b)(\w+)/g, '+"message"."$1"')
            : predicate;
    }
    sendText(sessionId, dto) {
        return this.sender.sendText(sessionId, dto);
    }
    sendTemplate(sessionId, dto) {
        return this.sender.sendTemplate(sessionId, dto);
    }
    sendImage(sessionId, dto) {
        return this.sender.sendImage(sessionId, dto);
    }
    sendVideo(sessionId, dto) {
        return this.sender.sendVideo(sessionId, dto);
    }
    sendAudio(sessionId, dto) {
        return this.sender.sendAudio(sessionId, dto);
    }
    sendDocument(sessionId, dto) {
        return this.sender.sendDocument(sessionId, dto);
    }
    sendLocation(sessionId, dto) {
        return this.sender.sendLocation(sessionId, dto);
    }
    sendContact(sessionId, dto) {
        return this.sender.sendContact(sessionId, dto);
    }
    sendPoll(sessionId, dto) {
        return this.sender.sendPoll(sessionId, dto);
    }
    sendSticker(sessionId, dto) {
        return this.sender.sendSticker(sessionId, dto);
    }
    reply(sessionId, dto) {
        return this.sender.reply(sessionId, dto);
    }
    clickButton(sessionId, dto) {
        return this.sender.clickButton(sessionId, dto);
    }
    forward(sessionId, dto) {
        return this.sender.forward(sessionId, dto);
    }
    saveOutgoingMessage(sessionId, data, lifetime) {
        return this.sender.saveOutgoingMessage(sessionId, data, lifetime);
    }
    async getMessages(sessionId, options = {}) {
        const { chatId, from, after, inlineMedia } = options;
        (0, message_window_1.validateMessageWindow)(options);
        const messageTimeOrder = options.orderBy === 'timestamp';
        const rawLimit = options.limit;
        const rawOffset = options.offset;
        const limit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 50;
        const offset = typeof rawOffset === 'number' && Number.isFinite(rawOffset)
            ? Math.min(Math.max(Math.trunc(rawOffset), 0), Number.MAX_SAFE_INTEGER)
            : 0;
        const tiebreak = messageTimeOrder ? 'id' : this.orderTiebreak;
        const chatIds = chatId ? await this.resolveJidCandidates(chatId) : undefined;
        const orderColumn = messageTimeOrder ? 'timestamp' : 'createdAt';
        const orderKey = this.orderTiebreak === 'rowid' && chatIds !== undefined && chatIds.length > 1
            ? `+message.${orderColumn}`
            : `message.${orderColumn}`;
        const query = this.messageRepository
            .createQueryBuilder('message')
            .where('message.sessionId = :sessionId', { sessionId })
            .orderBy(orderKey, 'DESC')
            .addOrderBy(`message.${tiebreak}`, 'DESC')
            .take(limit);
        if (after === undefined) {
            query.skip(offset);
        }
        const rowFilters = [];
        const narrow = (clause, parameters) => {
            query.andWhere(clause, parameters);
            rowFilters.push([clause, parameters]);
        };
        if (chatIds) {
            narrow('message.chatId IN (:...chatIds)', { chatIds });
        }
        if (options.direction !== undefined) {
            narrow('message.direction = :direction', { direction: options.direction });
        }
        if (options.type !== undefined)
            narrow('message.type = :messageType', { messageType: options.type });
        if (from) {
            const candidates = await this.resolveJidCandidates(from);
            const froms = [...new Set([...candidates, ...candidates.flatMap(bareUserDigits)])];
            narrow('(message.from IN (:...froms) OR message.author IN (:...authorFroms))', {
                froms,
                authorFroms: froms,
            });
        }
        if (options.messageId !== undefined) {
            narrow('message.waMessageId = :messageId', { messageId: options.messageId });
        }
        const hasTimeSelection = messageTimeOrder || options.since !== undefined || options.until !== undefined;
        const unknownTimestampTotal = hasTimeSelection
            ? await query.clone().andWhere('message.timestamp IS NULL').getCount()
            : undefined;
        if (messageTimeOrder)
            narrow('message.timestamp IS NOT NULL');
        if (options.since !== undefined) {
            narrow('message.timestamp >= :since', { since: (0, message_window_1.messageTimeBoundarySeconds)(options.since) });
        }
        if (options.until !== undefined) {
            narrow('message.timestamp < :until', { until: (0, message_window_1.messageTimeBoundarySeconds)(options.until) });
        }
        const inlineMediaBudget = inlineMedia === false ? 0 : resolveMessageListInlineMediaBudgetBytes();
        const total = await query.clone().getCount();
        if (after !== undefined) {
            if ((messageTimeOrder ||
                options.since !== undefined ||
                options.until !== undefined ||
                options.direction !== undefined ||
                options.type !== undefined ||
                options.messageId !== undefined) &&
                !(await query.clone().andWhere('message.id = :cursorId', { cursorId: after }).getCount())) {
                throw new common_1.BadRequestException('Unknown cursor for this message selection');
            }
            query.andWhere(`(message.${orderColumn}, message.${tiebreak}) < ` +
                `(SELECT anchor."${orderColumn}", anchor."${tiebreak}" FROM messages anchor ` +
                'WHERE anchor."id" = :after AND anchor."sessionId" = :sessionId)', { after, sessionId });
        }
        const pageIds = (await query.select('message.id', 'id').getRawMany()).map(r => r.id);
        const page = await this.readMetadataSizes(sessionId, pageIds);
        if (after !== undefined &&
            page.length === 0 &&
            !(await this.messageRepository.exists({ where: { id: after, sessionId } }))) {
            throw new common_1.BadRequestException(`Unknown cursor '${after}' for this session`);
        }
        return {
            messages: await this.readPageSpendingBudget(sessionId, rowFilters, page, inlineMediaBudget),
            total,
            ...(unknownTimestampTotal !== undefined ? { unknownTimestampTotal } : {}),
        };
    }
    async readMetadataSizes(sessionId, pageIds) {
        if (pageIds.length === 0)
            return [];
        const sizes = await this.messageRepository
            .createQueryBuilder('message')
            .select('message.id', 'id')
            .addSelect('OCTET_LENGTH(message.metadata)', 'metadataLength')
            .where('message.id IN (:...pageIds)', { pageIds })
            .andWhere(`${this.byPrimaryKey('message.sessionId')} = :sessionId`, { sessionId })
            .getRawMany();
        const sizeById = new Map(sizes.map(r => [r.id, r.metadataLength]));
        return pageIds.map(id => ({ id, metadataLength: sizeById.get(id) ?? null }));
    }
    async readPageSpendingBudget(sessionId, filters, page, budgetBytes) {
        const spend = createInlineMediaSpender(budgetBytes);
        const chunkLimit = Math.max(budgetBytes, MESSAGE_LIST_READ_CHUNK_MIN_BYTES);
        const messages = [];
        let chunk = [];
        let chunkBytes = 0;
        const flush = async () => {
            const query = this.messageRepository
                .createQueryBuilder('message')
                .select('message')
                .where(`${this.byPrimaryKey('message.sessionId')} = :sessionId`, { sessionId })
                .andWhere('message.id IN (:...chunkIds)', { chunkIds: chunk });
            for (const [clause, parameters] of filters)
                query.andWhere(this.byPrimaryKey(clause), parameters);
            const rows = await query.getMany();
            const byId = new Map(rows.map(row => [row.id, row]));
            for (const id of chunk) {
                const row = byId.get(id);
                if (!row)
                    continue;
                spend(row);
                messages.push(row);
            }
            chunk = [];
            chunkBytes = 0;
        };
        for (const { id, metadataLength } of page) {
            const bytes = Number(metadataLength) || 0;
            if (chunk.length > 0 && chunkBytes + bytes > chunkLimit)
                await flush();
            chunk.push(id);
            chunkBytes += bytes;
        }
        if (chunk.length > 0)
            await flush();
        return messages;
    }
    async resolveJidCandidates(value) {
        const expanded = await (0, jid_candidates_1.resolveJidCandidates)(value, {
            resolveLid: lid => this.lidMappingStore.findPhoneForLid(lid),
            lidsForPhone: phone => this.lidMappingStore.findLidsForPhone(phone),
        });
        return [...new Set([value, ...expanded])];
    }
    async reactToMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.reactToMessage(dto.chatId, dto.messageId, dto.emoji);
    }
    async getMessageReactions(sessionId, chatId, messageId) {
        const engine = this.getEngine(sessionId);
        return engine.getMessageReactions(chatId, messageId);
    }
    async getChatMedia(sessionId, chatId, messageId) {
        const chatIds = await this.resolveJidCandidates(chatId);
        const media = await this.chatMediaArchive?.getMedia(sessionId, chatIds, messageId);
        if (media && this.storageService) {
            try {
                const { stream, size } = await this.storageService.openFile(media.path);
                return { stream, size, mimetype: inertMimetype(media.mimetype) };
            }
            catch (error) {
                if (!(0, storage_service_1.isMissingObjectError)(error)) {
                    throw error;
                }
            }
        }
        const row = await this.messageRepository.findOne({
            where: { sessionId, chatId: (0, typeorm_2.In)(chatIds), waMessageId: messageId },
        });
        const inline = row?.metadata?.media;
        if (row?.type === 'revoked' ||
            !inline ||
            inline.omitted ||
            typeof inline.data !== 'string' ||
            !inline.data ||
            typeof inline.mimetype !== 'string' ||
            !inline.mimetype ||
            /^https?:\/\//i.test(inline.data)) {
            throw new common_1.NotFoundException('No media stored for this message');
        }
        const bytes = Buffer.from(inline.data, 'base64');
        return { stream: stream_1.Readable.from([bytes]), size: bytes.length, mimetype: inertMimetype(inline.mimetype) };
    }
    static MAX_CHAT_HISTORY_LIMIT = 100;
    static MAX_DEEP_CHAT_HISTORY_LIMIT = 2000;
    async getChatHistory(sessionId, chatId, limit = 50, includeMedia = false, deep = false, signal) {
        const engine = this.getEngine(sessionId);
        const ceiling = deep ? MessageService_1.MAX_DEEP_CHAT_HISTORY_LIMIT : MessageService_1.MAX_CHAT_HISTORY_LIMIT;
        const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), ceiling) : 50;
        const media = deep ? false : includeMedia;
        return signal
            ? engine.getChatHistory(chatId, safeLimit, media, undefined, signal)
            : engine.getChatHistory(chatId, safeLimit, media);
    }
    async pinMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.pinMessage(dto.chatId, dto.messageId, dto.durationSeconds ?? exports.DEFAULT_PIN_DURATION_SECONDS);
        return { success: true };
    }
    async unpinMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.unpinMessage(dto.chatId, dto.messageId);
        return { success: true };
    }
    async starMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.starMessage(dto.chatId, dto.messageId, dto.star);
        return { success: true };
    }
    async votePoll(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.votePoll(dto.chatId, dto.pollMessageId, dto.options);
        return { success: true };
    }
    async deleteMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        await engine.deleteMessage(dto.chatId, dto.messageId, dto.forEveryone ?? true);
        await this.messageProjector.recordRevoke(sessionId, dto.messageId, { kind: 'revoke', chatId: dto.chatId });
    }
    async editMessage(sessionId, dto) {
        const engine = this.getEngine(sessionId);
        const finalDto = await this.applySendingGate(sessionId, 'edit', dto);
        const result = finalDto.mentions?.length
            ? await engine.editMessage(finalDto.chatId, finalDto.messageId, finalDto.body, finalDto.mentions)
            : await engine.editMessage(finalDto.chatId, finalDto.messageId, finalDto.body);
        await this.messageProjector.recordOutboundMessageEdit(sessionId, finalDto.messageId, finalDto.body, {
            kind: 'edit',
            chatId: finalDto.chatId,
            fromMe: true,
        });
        return { messageId: result.id, timestamp: result.timestamp };
    }
    async applySendingGate(sessionId, type, input) {
        const target = input;
        await this.pacing.assertSendAllowed(sessionId, target.chatId ?? target.toChatId, { hold: false });
        return (0, hooks_1.applySendingGate)(this.hookManager, sessionId, type, input, 'MessageService');
    }
    getEngine(sessionId) {
        return this.engines.require(sessionId, () => new common_1.BadRequestException(`Session '${sessionId}' is not active. Start the session first.`));
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message, 'data')),
    __param(7, (0, common_1.Optional)()),
    __param(8, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        engine_registry_service_1.EngineRegistry,
        message_projector_service_1.MessageProjector,
        hooks_1.HookManager,
        lid_mapping_store_service_1.LidMappingStoreService,
        send_pacing_service_1.SendPacingService,
        message_send_service_1.MessageSendService,
        chat_media_archive_service_1.ChatMediaArchiveService,
        storage_service_1.StorageService])
], MessageService);
//# sourceMappingURL=message.service.js.map