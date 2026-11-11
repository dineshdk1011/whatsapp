"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConversationSendFacade = buildConversationSendFacade;
const plugin_interfaces_1 = require("./plugin.interfaces");
const MEDIA_TYPES = ['image', 'file', 'audio', 'video', 'voice'];
const isMediaType = (type) => MEDIA_TYPES.includes(type);
const isValidLatitude = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90;
const isValidLongitude = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180;
const MESSAGE_HOOK_EVENTS = ['message:sending'];
function buildConversationSendFacade(deps) {
    return {
        async send(env) {
            deps.assertPermission(deps.manifest, plugin_interfaces_1.PluginCapabilityPermission.CONVERSATION_SEND);
            const sessionId = env.sessionId;
            if (!sessionId)
                throw new plugin_interfaces_1.PluginCapabilityError('conversation.send: sessionId is required');
            deps.assertSessionActive(sessionId);
            const chatId = env.chatId ?? (await deps.resolveChatId(env));
            return deps.runGuarded(MESSAGE_HOOK_EVENTS, async () => {
                if (env.type === 'location') {
                    if (env.replyTo) {
                        throw new plugin_interfaces_1.PluginCapabilityError('conversation.send: replyTo is not supported for location messages');
                    }
                    if (!isValidLatitude(env.latitude) || !isValidLongitude(env.longitude)) {
                        throw new plugin_interfaces_1.PluginCapabilityError('conversation.send: type location requires latitude (-90..90) and longitude (-180..180)');
                    }
                    return deps.sendLocation(sessionId, {
                        chatId,
                        latitude: env.latitude,
                        longitude: env.longitude,
                        description: env.text,
                    });
                }
                if (isMediaType(env.type) && env.mediaUrl) {
                    if (env.replyTo) {
                        throw new plugin_interfaces_1.PluginCapabilityError('conversation.send: replyTo is not supported for media messages');
                    }
                    return deps.sendMedia(sessionId, { chatId, url: env.mediaUrl, type: env.type, caption: env.text });
                }
                if (env.replyTo) {
                    return deps.reply(sessionId, { chatId, quotedMessageId: env.replyTo, text: env.text ?? '' });
                }
                return deps.sendText(sessionId, {
                    chatId,
                    text: env.text ?? '',
                    ...(env.linkPreview === undefined ? {} : { linkPreview: env.linkPreview }),
                });
            });
        },
    };
}
//# sourceMappingURL=conversation-send-facade.js.map