"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMcpAuthFailure = auditMcpAuthFailure;
exports.createIpThrottle = createIpThrottle;
exports.createKeyGate = createKeyGate;
exports.resolveMcpReadOnly = resolveMcpReadOnly;
exports.mountMcpServer = mountMcpServer;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const express_1 = __importDefault(require("express"));
const tool_invoker_1 = require("../../core/agent-tools/tool-invoker");
const auth_service_1 = require("../auth/auth.service");
const auth_failure_audit_limiter_1 = require("../audit/auth-failure-audit-limiter");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const tool_result_1 = require("./tool-result");
const ip_1 = require("../../common/utils/ip");
const bootstrap_security_1 = require("../../config/bootstrap-security");
const bearer_token_1 = require("../../common/security/bearer-token");
const logger = (0, logger_service_1.createLogger)('McpServer');
function extractApiKey(headers = {}) {
    return (0, bearer_token_1.presentedApiKey)(headers);
}
function auditMcpAuthFailure(auditService, error, reqContext) {
    if (!auditService)
        return;
    if (error instanceof auth_service_1.UnresolvedApiKeyException && !(0, auth_failure_audit_limiter_1.allowUnauthenticatedAuditRow)(reqContext.ipAddress ?? '')) {
        return;
    }
    if (error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException) {
        void auditService.logWarn(audit_log_entity_1.AuditAction.API_KEY_AUTH_FAILED, {
            ipAddress: reqContext.ipAddress,
            method: reqContext.method,
            path: reqContext.path,
            errorMessage: error instanceof Error ? error.message : String(error),
        });
    }
}
function readTrustedProxies() {
    return (0, ip_1.parseTrustedProxies)(process.env.TRUSTED_PROXIES);
}
function resolveReqContext(req) {
    return {
        ipAddress: (0, ip_1.resolveClientIp)(req, readTrustedProxies()),
        method: req.method,
        path: req.path,
    };
}
function buildServer(registry, authService, rateLimiter, readOnly, serverInfo, auditService, reqContext, chatScope) {
    const server = new mcp_js_1.McpServer({ name: serverInfo.name, version: serverInfo.version }, { capabilities: { tools: {}, logging: {} } });
    const tools = registry.list({ readOnly });
    for (const tool of tools) {
        server.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: {
                readOnlyHint: tool.tier === 'read',
                destructiveHint: tool.destructive ?? false,
                idempotentHint: tool.idempotent ?? tool.tier === 'read',
            },
        }, async (input, extra) => {
            const rawKey = extra.authInfo?.token ?? extractApiKey(extra.requestInfo?.headers);
            try {
                const result = await (0, tool_invoker_1.invokeTool)(tool, input, rawKey, authService, id => rateLimiter.check(id), error => auditMcpAuthFailure(auditService, error, reqContext), chatScope, extra.signal);
                return (0, tool_result_1.smartToolResult)(result);
            }
            catch (error) {
                return (0, tool_result_1.handleToolError)(error);
            }
        });
    }
    return server;
}
function createIpThrottle(ipRateLimiter) {
    return (req, res, next) => {
        const ip = (0, ip_1.limiterKeyForIp)((0, ip_1.resolveClientIp)(req, readTrustedProxies()));
        const messages = Array.isArray(req.body) ? Math.max(1, req.body.length) : 1;
        try {
            for (let i = 0; i < messages; i++)
                ipRateLimiter.check(ip);
            next();
        }
        catch (err) {
            const status = err instanceof common_1.HttpException ? err.getStatus() : 429;
            res.status(status).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: err instanceof Error ? err.message : 'MCP rate limit exceeded' },
                id: null,
            });
        }
    };
}
function createKeyGate(authService, auditService) {
    return async (req, res, next) => {
        try {
            const rawKey = extractApiKey(req.headers);
            if (!rawKey)
                throw new auth_service_1.UnresolvedApiKeyException('Missing API key');
            await authService.validateApiKey(rawKey, undefined, undefined, { recordUsage: false });
            req.auth = { token: rawKey, clientId: 'api-key', scopes: [] };
        }
        catch (err) {
            if (err instanceof common_1.HttpException) {
                auditMcpAuthFailure(auditService, err, resolveReqContext(req));
                const status = err.getStatus();
                if (status === 401)
                    res.set('WWW-Authenticate', 'Bearer');
                res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message: err.message }, id: null });
                return;
            }
            logger.error('Error authenticating MCP request', err instanceof Error ? err.stack : String(err));
            res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
            return;
        }
        next();
    };
}
function resolveMcpReadOnly(optionsReadOnly) {
    return optionsReadOnly ?? process.env.MCP_READONLY !== 'false';
}
function mountMcpServer(httpAdapter, registry, authService, rateLimiter, ipRateLimiter, options = {}, auditService, chatScope) {
    const basePath = (options.basePath ?? '/mcp').replace(/\/$/, '') || '/mcp';
    const serverInfo = options.serverInfo ?? { name: 'openwa', version: '0.0.0' };
    const readOnly = resolveMcpReadOnly(options.readOnly);
    const tools = registry.list({ readOnly });
    logger.log(`MCP server mounted at POST ${basePath} (${tools.length} tools, readOnly=${readOnly})`);
    const handler = async (req, res) => {
        const server = buildServer(registry, authService, rateLimiter, readOnly, serverInfo, auditService, resolveReqContext(req), chatScope);
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        try {
            res.on('close', () => {
                void transport.close();
                void server.close();
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
            logger.error('Error handling MCP request', error instanceof Error ? error.stack : String(error));
            if (!res.headersSent) {
                res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
            }
        }
    };
    const adapter = httpAdapter;
    const bodyLimit = (0, bootstrap_security_1.resolveBodyLimit)(process.env.BODY_SIZE_LIMIT);
    adapter.post(basePath, express_1.default.json({ limit: bodyLimit, inflate: false }), createIpThrottle(ipRateLimiter), createKeyGate(authService, auditService), handler);
    const methodNotAllowed = (_req, res) => {
        res
            .status(405)
            .set('Allow', 'POST')
            .json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    };
    adapter.get(basePath, methodNotAllowed);
    adapter.delete(basePath, methodNotAllowed);
}
//# sourceMappingURL=mcp.server.js.map