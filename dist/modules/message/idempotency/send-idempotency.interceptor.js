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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendIdempotencyInterceptor = exports.IDEMPOTENT_REPLAYED_HEADER = exports.IDEMPOTENCY_KEY_HEADER = void 0;
exports.sendFailureProvesNothingSent = sendFailureProvesNothingSent;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const logger_service_1 = require("../../../common/services/logger.service");
const engine_send_failure_1 = require("../../../common/errors/engine-send-failure");
const engine_not_sent_error_1 = require("../../../common/errors/engine-not-sent.error");
const engine_throttled_error_1 = require("../../../common/errors/engine-throttled.error");
const send_idempotency_service_1 = require("./send-idempotency.service");
exports.IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
exports.IDEMPOTENT_REPLAYED_HEADER = 'idempotent-replayed';
const CLAIMABLE_SESSION_ID_MAX_LENGTH = 255;
function sendFailureProvesNothingSent(error) {
    if ((0, engine_not_sent_error_1.provesNothingSent)(error) || error instanceof engine_throttled_error_1.EngineThrottledError)
        return true;
    if ((0, engine_send_failure_1.isEngineSendFailure)(error) || !(error instanceof common_1.HttpException))
        return false;
    const status = error.getStatus();
    const notImplemented = common_1.HttpStatus.NOT_IMPLEMENTED;
    return status < 500 || status === notImplemented;
}
let SendIdempotencyInterceptor = class SendIdempotencyInterceptor {
    store;
    logger = (0, logger_service_1.createLogger)('SendIdempotency');
    constructor(store) {
        this.store = store;
    }
    async intercept(context, next) {
        if (context.getType() !== 'http')
            return next.handle();
        const request = context.switchToHttp().getRequest();
        const raw = request.headers[exports.IDEMPOTENCY_KEY_HEADER];
        if (raw === undefined)
            return next.handle();
        const key = Array.isArray(raw) ? undefined : raw;
        if (key === undefined || !(0, send_idempotency_service_1.isValidIdempotencyKey)(key)) {
            throw new common_1.BadRequestException({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Idempotency-Key must be one value of 1-255 visible ASCII characters.',
                code: 'IDEMPOTENCY_KEY_INVALID',
            });
        }
        const sessionId = String(request.params.sessionId ?? '');
        if (sessionId.length > CLAIMABLE_SESSION_ID_MAX_LENGTH)
            return next.handle();
        const route = context.getHandler().name;
        const claim = await this.store.claim({
            sessionId,
            key,
            route,
            requestHash: (0, send_idempotency_service_1.hashSendRequest)(route, request.body),
        });
        switch (claim.kind) {
            case 'replay':
                context.switchToHttp().getResponse().setHeader(exports.IDEMPOTENT_REPLAYED_HEADER, 'true');
                return (0, rxjs_1.of)(claim.body);
            case 'mismatch':
                throw new common_1.UnprocessableEntityException({
                    statusCode: 422,
                    error: 'Unprocessable Entity',
                    message: 'This Idempotency-Key was already used for a different request. Use a new key.',
                    code: 'IDEMPOTENCY_KEY_REUSED',
                });
            case 'in_progress':
                throw new common_1.ConflictException({
                    statusCode: 409,
                    error: 'Conflict',
                    message: 'A request with this Idempotency-Key is still running. Retry after it finishes.',
                    code: 'IDEMPOTENCY_KEY_IN_PROGRESS',
                });
            case 'outcome_unknown':
                throw new common_1.ConflictException({
                    statusCode: 409,
                    error: 'Conflict',
                    message: 'An earlier request with this Idempotency-Key failed and the message may have been sent. ' +
                        'Check the chat; to send again, use a new key.',
                    code: 'IDEMPOTENCY_OUTCOME_UNKNOWN',
                });
            case 'claimed':
                return (0, rxjs_1.from)(this.runClaimed(claim.id, next));
        }
    }
    async runClaimed(id, next) {
        let body;
        try {
            body = await (0, rxjs_1.lastValueFrom)(next.handle());
        }
        catch (error) {
            await this.settle(id, sendFailureProvesNothingSent(error) ? 'release' : 'fail');
            throw error;
        }
        await this.settle(id, 'complete', body);
        return body;
    }
    async settle(id, outcome, body) {
        try {
            if (outcome === 'complete')
                await this.store.complete(id, body);
            else if (outcome === 'release')
                await this.store.release(id);
            else
                await this.store.markFailed(id);
        }
        catch (error) {
            this.logger.warn('Could not record the outcome of an idempotent send', {
                claimId: id,
                outcome,
                error: error instanceof Error ? error.message : String(error),
                action: 'send_idempotency_settle_failed',
            });
        }
    }
};
exports.SendIdempotencyInterceptor = SendIdempotencyInterceptor;
exports.SendIdempotencyInterceptor = SendIdempotencyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [send_idempotency_service_1.SendIdempotencyService])
], SendIdempotencyInterceptor);
//# sourceMappingURL=send-idempotency.interceptor.js.map