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
var McpModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const tool_registry_service_1 = require("../../core/agent-tools/tool-registry.service");
const auth_service_1 = require("../auth/auth.service");
const audit_service_1 = require("../audit/audit.service");
const chat_scope_service_1 = require("../auth/chat-scope.service");
const mcp_rate_limit_1 = require("./mcp-rate-limit");
const mcp_server_1 = require("./mcp.server");
let _moduleOptions = {};
let McpModule = McpModule_1 = class McpModule {
    registry;
    authService;
    httpAdapterHost;
    auditService;
    chatScope;
    constructor(registry, authService, httpAdapterHost, auditService, chatScope) {
        this.registry = registry;
        this.authService = authService;
        this.httpAdapterHost = httpAdapterHost;
        this.auditService = auditService;
        this.chatScope = chatScope;
    }
    static forRoot(options = {}) {
        _moduleOptions = options;
        return {
            module: McpModule_1,
            global: false,
            providers: [],
            exports: [],
        };
    }
    configure(_consumer) {
        const httpAdapter = this.httpAdapterHost.httpAdapter;
        if (!httpAdapter) {
            throw new Error('McpModule: HttpAdapterHost.httpAdapter is not available.');
        }
        const { basePath, serverInfo } = _moduleOptions;
        const { max, windowMs } = (0, mcp_rate_limit_1.readRateLimitConfig)();
        const rateLimiter = new mcp_rate_limit_1.KeyRateLimiter(max, windowMs);
        const ipCfg = (0, mcp_rate_limit_1.readIpRateLimitConfig)();
        const ipRateLimiter = new mcp_rate_limit_1.KeyRateLimiter(ipCfg.max, ipCfg.windowMs);
        (0, mcp_server_1.mountMcpServer)(httpAdapter, this.registry, this.authService, rateLimiter, ipRateLimiter, { basePath, serverInfo }, this.auditService, this.chatScope);
    }
};
exports.McpModule = McpModule;
exports.McpModule = McpModule = McpModule_1 = __decorate([
    (0, common_1.Module)({}),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistryService,
        auth_service_1.AuthService,
        core_1.HttpAdapterHost,
        audit_service_1.AuditService,
        chat_scope_service_1.ChatScopeService])
], McpModule);
//# sourceMappingURL=mcp.module.js.map