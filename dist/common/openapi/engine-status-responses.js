"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDIA_URL_PROXY_503 = exports.BULK_MEDIA_TOO_LARGE_413 = exports.MEDIA_TOO_LARGE_413 = exports.CHANNEL_MEDIA_501 = exports.ENGINE_NOT_SUPPORTED_501 = exports.LABEL_NOT_FOUND_404 = exports.GROUP_NOT_FOUND_404 = exports.PREVIEW_IMAGE_PROXY_503 = exports.PREVIEW_IMAGE_TOO_LARGE_413 = exports.CUSTOM_LINK_PREVIEW_501 = exports.CHANNEL_INVITE_NOT_FOUND_404 = exports.CHANNEL_NOT_FOUND_404 = exports.QUOTED_MESSAGE_NOT_FOUND_404 = exports.MESSAGE_NOT_FOUND_404 = exports.STATUS_POST_503 = exports.SEND_503 = exports.RECIPIENT_LOOKUP_503 = exports.ENGINE_REFUSED_403 = exports.RECIPIENT_UNREACHABLE_400 = exports.SESSION_NOT_STARTED_404 = exports.PAIRING_TRANSPORT_503 = exports.PAIRING_NOT_READY_409 = exports.SESSION_NOT_STARTED_400 = exports.ENGINE_NOT_READY_409 = void 0;
exports.ENGINE_NOT_READY_409 = 'The session is not connected: an engine exists for it but is not `ready`, meaning disconnected, ' +
    'reconnecting, or still initializing, so the request never reached WhatsApp. Wait for `ready` and ' +
    'retry. A session that was never started answers `400` instead, and the session lifecycle routes ' +
    'answer `409` for a conflicting state rather than this. One window answers this while the session ' +
    'still reads `ready`: WhatsApp Web periodically reloads its own page and the engine re-injects ' +
    'into it, and for those few seconds the answer is a `409` naming the reload; retry shortly.';
exports.SESSION_NOT_STARTED_400 = 'The session is not started: no engine is running for it (never started, stopped, or logged out). ' +
    'Start the session and retry.';
exports.PAIRING_NOT_READY_409 = 'The session is not waiting to be linked: the engine is still connecting, or reconnecting after a ' +
    'drop, so the request never reached WhatsApp. Wait for `status` to read `qr_ready` and retry. Once a ' +
    'code has been accepted the session moves through `authenticating` and `initializing` to `ready` and ' +
    'answers this until then; wait for `ready` in that case. A session that reads `ready` is already ' +
    'linked and answers `400` instead. One window answers this while the session still reads ' +
    '`qr_ready`: on the Baileys engine a socket that has begun closing stops accepting a pairing ' +
    'request before the status catches up, which on a silently dropped connection takes until the ' +
    "WebSocket's close timeout (30 s); retry, and the status follows shortly.";
exports.PAIRING_TRANSPORT_503 = 'The pairing code could not be generated: the gateway stopped waiting after its attempt budget, ' +
    'usually because WhatsApp Web kept reloading its QR page. The condition is transient and the ' +
    "request is worth retrying; the last attempt's reason is carried in the message. An attempt that " +
    'timed out may still have reached WhatsApp, and a retry starts the linking flow again, with the ' +
    'same risk of unlinking an already-linked device that this route carries generally. The Baileys ' +
    'engine does not answer this, having no page to reload.';
exports.SESSION_NOT_STARTED_404 = 'No session is running under that id — it was never started, was stopped, or does not exist. These ' +
    'routes report an unstarted session as `404`, where the message and group routes report it as `400`.';
exports.RECIPIENT_UNREACHABLE_400 = 'Baileys rejects a phone number reported as unregistered. ' +
    'The request was rejected before anything was sent. Among the causes: the recipient could not be ' +
    'addressed — WhatsApp reports no deliverable id for that `chatId`, which is how it says the number ' +
    'is not on WhatsApp — as well as body validation and a session that is not active.';
exports.ENGINE_REFUSED_403 = 'WhatsApp refused the operation. The request was well formed — the refusal happened WhatsApp-side, ' +
    'most often because the account lacks the admin rights the operation requires.';
exports.RECIPIENT_LOOKUP_503 = 'Baileys could not complete the recipient lookup within the request budget. On send routes, ' +
    'no message was handed to WhatsApp for this lookup failure.';
const SEND_REFUSAL_503 = 'On Baileys, also when WhatsApp rate-limits the request (code 429: nothing was sent, and a keyed send frees ' +
    'its `Idempotency-Key`), times out a query it awaits (code 408: the outcome is not proven, and a keyed ' +
    'send keeps its `Idempotency-Key` taken), or the connection closes before the message is written (nothing ' +
    'was sent, and a keyed send frees its `Idempotency-Key`).';
exports.SEND_503 = `${exports.RECIPIENT_LOOKUP_503} ${SEND_REFUSAL_503}`;
exports.STATUS_POST_503 = 'On Baileys, WhatsApp can answer the post with a 503: it rate-limited the request (code 429: nothing was ' +
    'posted) or timed out a query the post awaits (code 408: the outcome is not proven, so the post may have ' +
    'been published). The post also answers 503 when the connection closes before it is written (nothing was ' +
    'posted).';
exports.MESSAGE_NOT_FOUND_404 = "No such message: the id is outside the engine's lookup window (roughly the last hundred messages " +
    'of the chat, or absent from the Baileys store) or the message was revoked.';
exports.QUOTED_MESSAGE_NOT_FOUND_404 = 'The `quotedMessageId` could not be resolved: the whatsapp-web.js page does not hold it, or the ' +
    'Baileys store does not (it was never received or sent by this session, or it was evicted or deleted). ' +
    'On whatsapp-web.js a message that resolves but cannot be replied to is sent without the quote.';
exports.CHANNEL_NOT_FOUND_404 = "No such channel — the id is not among the session's subscribed channels, either because it is " +
    'wrong or because the channel has not synced into the local collection yet.';
exports.CHANNEL_INVITE_NOT_FOUND_404 = 'The invite code does not resolve to a channel — it is wrong, expired, or revoked. This route takes ' +
    'an invite code rather than a channel id.';
exports.CUSTOM_LINK_PREVIEW_501 = 'A caller-supplied `customLinkPreview` is not supported by the whatsapp-web.js engine — only ' +
    'Baileys can attach one. The send itself is supported on both; omit the field, or use `linkPreview`.';
exports.PREVIEW_IMAGE_TOO_LARGE_413 = 'The `customLinkPreview` image, as decoded `thumbnailBase64` or as downloaded from `thumbnailUrl`, ' +
    'exceeds 5 MiB (or `MEDIA_DOWNLOAD_MAX_BYTES`, if that is lower).';
exports.PREVIEW_IMAGE_PROXY_503 = 'The session routes its URL fetches through an egress proxy, and the `customLinkPreview.thumbnailUrl` ' +
    'fetch failed or timed out before any response arrived, so nothing was sent. The proxy or the target ' +
    'behind it may be at fault; the gateway cannot tell which. Without a session proxy the same failure ' +
    'answers `400`.';
exports.GROUP_NOT_FOUND_404 = 'No such group — the id is unknown.';
exports.LABEL_NOT_FOUND_404 = 'No such label — it was never created, or the account is not a WhatsApp Business one and holds no ' +
    'labels at all. Both are the same answer to the caller.';
exports.ENGINE_NOT_SUPPORTED_501 = 'The active engine cannot serve this operation. It is part of the engine contract, but the engine ' +
    'currently running has no implementation for it.';
exports.CHANNEL_MEDIA_501 = 'Sending media to a channel (`<id>@newsletter`) is not supported by the whatsapp-web.js engine — ' +
    'the page method it needs was removed by a WhatsApp Web update. Text to a channel still works.';
exports.MEDIA_TOO_LARGE_413 = 'The decoded base64 media, or the media downloaded from `url`, exceeds the media byte cap ' +
    '(`MEDIA_DOWNLOAD_MAX_BYTES`, 50 MiB by default). A whole request is separately bounded by `BODY_SIZE_LIMIT` (25 mb by default), and ' +
    'base64 inflates by about a third, so a large send usually meets that coarser limit first: the ' +
    'body parser rejects the request before this check runs.';
exports.BULK_MEDIA_TOO_LARGE_413 = "An item's decoded base64 media exceeds the media byte cap (`MEDIA_DOWNLOAD_MAX_BYTES`, 50 MiB by " +
    'default). A `url` item is fetched after the `202`; one over the cap fails that item in the batch ' +
    'results (`GET /messages/batch/{batchId}`) instead. The whole request is separately bounded by ' +
    '`BODY_SIZE_LIMIT` (25 mb by default).';
exports.MEDIA_URL_PROXY_503 = 'The session routes its `url` fetches through an egress proxy, and the fetch failed or timed out ' +
    'before any response arrived, so the request was not carried out. The proxy or the target behind it ' +
    'may be at fault; the gateway cannot tell which. Retryable, but a `503` that persists while the proxy ' +
    'works points at the `url`. Without a session proxy the same failure answers `400`.';
//# sourceMappingURL=engine-status-responses.js.map