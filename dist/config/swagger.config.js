"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_RESPONSE_SCHEMA = exports.PUBLIC_PATHS = exports.METRICS_BEARER_SCHEME = exports.API_KEY_SECURITY_SCHEME = void 0;
exports.dropUnexpressibleOperations = dropUnexpressibleOperations;
exports.exemptPublicOperations = exemptPublicOperations;
exports.documentErrorResponses = documentErrorResponses;
exports.createSwaggerConfig = createSwaggerConfig;
const swagger_1 = require("@nestjs/swagger");
exports.API_KEY_SECURITY_SCHEME = 'X-API-Key';
exports.METRICS_BEARER_SCHEME = 'metrics-bearer';
exports.PUBLIC_PATHS = [
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
    '/api/infra/health',
    '/api/ingress/{pluginId}/{instanceId}/{path}',
];
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace', 'search'];
const OPENAPI_3_PATH_ITEM_FIELDS = new Set([
    '$ref',
    'summary',
    'description',
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
    'servers',
    'parameters',
]);
function dropUnexpressibleOperations(document) {
    for (const item of Object.values(document.paths ?? {})) {
        for (const field of Object.keys(item)) {
            if (!OPENAPI_3_PATH_ITEM_FIELDS.has(field) && !field.startsWith('x-')) {
                delete item[field];
            }
        }
    }
    return document;
}
function exemptPublicOperations(document) {
    for (const path of exports.PUBLIC_PATHS) {
        const item = document.paths?.[path];
        if (!item)
            continue;
        for (const method of HTTP_METHODS) {
            const op = item[method];
            if (op)
                op.security = [];
        }
    }
    return document;
}
exports.ERROR_RESPONSE_SCHEMA = 'ErrorResponse';
const ERROR_RESPONSE = {
    type: 'object',
    required: ['statusCode', 'message'],
    properties: {
        statusCode: { type: 'integer', description: 'The HTTP status, mirrored from the status line.' },
        message: {
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
            description: 'What went wrong. A detailed validation 400 carries one string per rejected field.',
        },
        error: {
            type: 'string',
            description: 'The status reason phrase, e.g. "Not Found". Not always present: a body built from a bare message ' +
                'omits it, including an unexpected 500, an oversized-body 413, the throttler 429, ' +
                'a production validation 400, and some errors raised with a plain message, such as the session start 504.',
        },
        code: {
            type: 'string',
            description: 'A stable machine-readable reason, on some errors only: SESSION_NAME_TEARDOWN_PENDING (409), ' +
                'SESSION_STOP_INCOMPLETE, SESSION_LOGOUT_INCOMPLETE and SESSION_FORCE_KILL_INCOMPLETE (502), ' +
                'SEND_PACING_LIMITED (429), ' +
                'ENGINE_PAGE_ERROR (500, whatsapp-web.js: WhatsApp Web threw inside the page during a send or status post), ' +
                'IMPORT_ALREADY_RUNNING, EXPORT_IN_PROGRESS, IMPORT_WOULD_ORPHAN_ENGINES and IMPORT_NESTED_TRANSACTION (409), ' +
                'IDEMPOTENCY_KEY_INVALID (400), IDEMPOTENCY_KEY_REUSED (422), ' +
                'IDEMPOTENCY_KEY_IN_PROGRESS and IDEMPOTENCY_OUTCOME_UNKNOWN (409), ' +
                'POLL_OPTION_NOT_FOUND (400, whatsapp-web.js vote-poll).',
        },
        retryAfterSeconds: {
            type: 'integer',
            description: 'With SEND_PACING_LIMITED: seconds until the session accepts sends again.',
        },
        validOptions: {
            type: 'array',
            items: { type: 'string' },
            description: 'With POLL_OPTION_NOT_FOUND: the option texts the poll offers.',
        },
        pageError: {
            type: 'object',
            required: ['name', 'message'],
            properties: { name: { type: 'string' }, message: { type: 'string' } },
            description: 'With ENGINE_PAGE_ERROR: the name and message WhatsApp Web threw.',
        },
        build: {
            type: 'string',
            description: 'With ENGINE_PAGE_ERROR, when the page could read it: the running WhatsApp Web build.',
        },
    },
};
const AUTH_FORBIDDEN = "API key's role, session or chat scope, or IP allow-list does not allow this operation";
function documentErrorResponses(document) {
    document.components ??= {};
    document.components.schemas ??= {};
    document.components.schemas[exports.ERROR_RESPONSE_SCHEMA] = ERROR_RESPONSE;
    for (const item of Object.values(document.paths ?? {})) {
        for (const method of HTTP_METHODS) {
            const op = item[method];
            if (!op || op.security !== undefined)
                continue;
            op.responses['401'] ??= { description: 'The API key is missing, unknown, revoked, or expired' };
            if (op.requestBody) {
                op.responses['400'] ??= {
                    description: 'The body is malformed, fails validation, or carries a field the DTO does not declare',
                };
            }
            const forbidden = op.responses['403'];
            if (!forbidden) {
                op.responses['403'] = { description: `The ${AUTH_FORBIDDEN}` };
            }
            else if (!('$ref' in forbidden) && !forbidden.description.includes(AUTH_FORBIDDEN)) {
                forbidden.description = `${forbidden.description.replace(/\.?$/, '.')} Also returned when the ${AUTH_FORBIDDEN}.`;
            }
            for (const [status, response] of Object.entries(op.responses)) {
                if (Number(status) >= 400 && !('$ref' in response) && !response.content) {
                    response.content = {
                        'application/json': { schema: { $ref: `#/components/schemas/${exports.ERROR_RESPONSE_SCHEMA}` } },
                    };
                }
            }
        }
    }
    return document;
}
function createSwaggerConfig() {
    const { version } = require('../../package.json');
    return (new swagger_1.DocumentBuilder()
        .setTitle('OpenWA API')
        .setDescription('Open Source WhatsApp API Gateway - Free, Self-Hosted HTTP API\n\n' +
        '**Gateway-wide responses.** Three statuses are returned by middleware before routing, ' +
        'so any operation can emit them:\n\n' +
        '- `415 Unsupported Media Type` — the request body carries a `Content-Encoding` other ' +
        'than `identity`. The aggregate in-flight body cap counts wire bytes, so a compressed ' +
        'body would be admitted on its compressed size and then inflated past the memory it is ' +
        'meant to bound. Send the body uncompressed.\n' +
        '- `413 Payload Too Large`: the declared `Content-Length` is more than the gateway could ' +
        'hold in flight for this caller even when idle. The body is not read; retrying it unchanged ' +
        'cannot succeed.\n' +
        '- `503 Service Unavailable` with `Retry-After` — the gateway already has too much ' +
        'request body data in flight (the body is not read; retry after the given delay), or, without ' +
        '`Retry-After`, shutdown teardown has begun: every route except `/api/health` and ' +
        '`/api/health/*` then answers it with `Connection: close`.\n\n' +
        'Every operation that takes an API key can also answer `429 Too Many Requests` (the per-IP ' +
        'rate-limit windows; with send pacing on, a send can also be refused with `code: ' +
        'SEND_PACING_LIMITED` and `retryAfterSeconds`) and `500 Internal Server Error` (an ' +
        'unexpected failure, or `code: ENGINE_PAGE_ERROR` when WhatsApp Web threw inside the page ' +
        'during a whatsapp-web.js send or status post). Error bodies follow the `ErrorResponse` schema.')
        .setVersion(version)
        .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, exports.API_KEY_SECURITY_SCHEME)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'opaque',
        description: 'METRICS_TOKEN for the GET /api/metrics scrape endpoint',
    }, exports.METRICS_BEARER_SCHEME)
        .addSecurityRequirements(exports.API_KEY_SECURITY_SCHEME)
        .setContact('OpenWA', 'https://github.com/rmyndharis/OpenWA', 'yudhi@rmyndharis.com')
        .addTag('sessions', 'WhatsApp session management')
        .addTag('messages', 'Send and manage messages')
        .addTag('webhooks', 'Webhook configuration')
        .addTag('contacts', 'Contact management')
        .addTag('groups', 'Group management')
        .addTag('labels', 'Label management (WhatsApp Business)')
        .addTag('channels', 'Channel/Newsletter management')
        .addTag('catalog', 'Product catalog (WhatsApp Business)')
        .addTag('status', 'Status/Stories')
        .addTag('calls', 'Call handling')
        .addTag('profile', 'Own profile management')
        .addTag('search', 'Global message search')
        .addTag('statistics', 'Usage statistics')
        .addTag('templates', 'Message templates')
        .addTag('plugins', 'Plugin management')
        .addTag('settings', 'Application settings')
        .addTag('infrastructure', 'Infrastructure & datastore management')
        .addTag('integration', 'Integration Fabric (provider webhooks & instances)')
        .addTag('auth', 'API key management')
        .addTag('audit', 'Audit log')
        .addTag('metrics', 'Prometheus metrics')
        .addTag('health', 'Health check endpoints')
        .addServer('/', 'This instance (the origin serving these docs)')
        .addServer('http://{host}:{port}', 'Another instance (set host and port)', {
        host: { default: 'localhost' },
        port: { default: '2785', description: 'PORT env var' },
    })
        .build());
}
//# sourceMappingURL=swagger.config.js.map