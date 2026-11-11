"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tool_registry_service_1 = require("./tool-registry.service");
const session_module_1 = require("../../modules/session/session.module");
const message_module_1 = require("../../modules/message/message.module");
const contact_module_1 = require("../../modules/contact/contact.module");
const group_module_1 = require("../../modules/group/group.module");
const webhook_module_1 = require("../../modules/webhook/webhook.module");
const label_module_1 = require("../../modules/label/label.module");
const automation_module_1 = require("../../modules/automation/automation.module");
const session_service_1 = require("../../modules/session/session.service");
const message_service_1 = require("../../modules/message/message.service");
const contact_service_1 = require("../../modules/contact/contact.service");
const group_service_1 = require("../../modules/group/group.service");
const webhook_service_1 = require("../../modules/webhook/webhook.service");
const label_service_1 = require("../../modules/label/label.service");
const automation_rules_service_1 = require("../../modules/automation/automation-rules.service");
const search_service_1 = require("../../modules/search/search.service");
const tools_1 = require("./tools");
let AgentToolsModule = class AgentToolsModule {
};
exports.AgentToolsModule = AgentToolsModule;
exports.AgentToolsModule = AgentToolsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, message_module_1.MessageModule, contact_module_1.ContactModule, group_module_1.GroupModule, webhook_module_1.WebhookModule, label_module_1.LabelModule, automation_module_1.AutomationModule],
        providers: [
            {
                provide: tool_registry_service_1.ToolRegistryService,
                inject: [
                    session_service_1.SessionService,
                    message_service_1.MessageService,
                    contact_service_1.ContactService,
                    group_service_1.GroupService,
                    webhook_service_1.WebhookService,
                    label_service_1.LabelService,
                    automation_rules_service_1.AutomationRulesService,
                    { token: search_service_1.SearchService, optional: true },
                    config_1.ConfigService,
                ],
                useFactory: (session, message, contact, group, webhook, labels, automation, search, config) => new tool_registry_service_1.ToolRegistryService((0, tools_1.allAgentTools)({
                    session,
                    message,
                    contact,
                    group,
                    webhook,
                    labels,
                    automation,
                    search,
                    searchContainsEnabled: config.get('search.containsEnabled') === true,
                })),
            },
        ],
        exports: [tool_registry_service_1.ToolRegistryService],
    })
], AgentToolsModule);
//# sourceMappingURL=agent-tools.module.js.map