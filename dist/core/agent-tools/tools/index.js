"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allAgentTools = allAgentTools;
const session_tools_1 = require("./session.tools");
const message_tools_1 = require("./message.tools");
const contact_tools_1 = require("./contact.tools");
const group_tools_1 = require("./group.tools");
const webhook_tools_1 = require("./webhook.tools");
const label_tools_1 = require("./label.tools");
const automation_tools_1 = require("./automation.tools");
const search_tools_1 = require("./search.tools");
function allAgentTools(deps) {
    return [
        ...(0, session_tools_1.sessionTools)(deps.session),
        ...(0, message_tools_1.messageTools)(deps.message),
        ...(0, contact_tools_1.contactTools)(deps.contact),
        ...(0, group_tools_1.groupTools)(deps.group),
        ...(0, webhook_tools_1.webhookTools)(deps.webhook),
        ...(0, label_tools_1.labelTools)(deps.labels),
        ...(0, automation_tools_1.automationTools)(deps.automation),
        ...(0, search_tools_1.searchTools)(deps.search, deps.searchContainsEnabled),
    ];
}
//# sourceMappingURL=index.js.map