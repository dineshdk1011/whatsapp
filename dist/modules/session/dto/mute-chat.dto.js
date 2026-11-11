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
exports.MuteChatDto = exports.MUTE_UNTIL_MAX = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const send_message_dto_1 = require("../../message/dto/send-message.dto");
const strict_boolean_1 = require("../../../common/utils/strict-boolean");
exports.MUTE_UNTIL_MAX = Number.MAX_SAFE_INTEGER;
class MuteChatDto {
    chatId;
    muteUntil;
}
exports.MuteChatDto = MuteChatDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        maxLength: send_message_dto_1.CHAT_ID_MAX_LENGTH,
        description: 'Chat ID in the neutral form the gateway returns, on either engine (e.g. 1234567890-123@g.us)',
        example: '1234567890-123@g.us',
    }),
    (0, strict_boolean_1.ToStrictString)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(send_message_dto_1.CHAT_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(/^[^\s@]+@[^\s@]+$/, {
        message: 'chatId must be a valid chat JID in the form localpart@host',
    }),
    __metadata("design:type", String)
], MuteChatDto.prototype, "chatId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Absolute epoch-MILLISECONDS timestamp at which the mute expires, or `null` to unmute now. ' +
            'Required — omitting it is rejected rather than guessed, because the two plausible readings ' +
            '(unmute vs mute forever) are opposites. To mute indefinitely, send a far-future timestamp, no later ' +
            'than 9007199254740991 (Number.MAX_SAFE_INTEGER, the largest integer a JSON number carries exactly). ' +
            'Milliseconds, not seconds: a seconds-scale value is an instant in 1970, so the mute expires ' +
            'immediately while the request still answers 200.',
        example: 1800000000000,
        type: 'integer',
        nullable: true,
        minimum: 1,
        maximum: exports.MUTE_UNTIL_MAX,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.muteUntil !== null),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(exports.MUTE_UNTIL_MAX),
    __metadata("design:type", Object)
], MuteChatDto.prototype, "muteUntil", void 0);
//# sourceMappingURL=mute-chat.dto.js.map