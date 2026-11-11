import type { SessionService } from '../../../modules/session/session.service';
import type { MessageService } from '../../../modules/message/message.service';
import type { ContactService } from '../../../modules/contact/contact.service';
import type { GroupService } from '../../../modules/group/group.service';
import type { WebhookService } from '../../../modules/webhook/webhook.service';
import type { LabelService } from '../../../modules/label/label.service';
import type { AutomationRulesService } from '../../../modules/automation/automation-rules.service';
import type { SearchService } from '../../../modules/search/search.service';
import type { AnyToolDescriptor } from '../tool-descriptor';
export interface AgentToolDeps {
    session: SessionService;
    message: MessageService;
    contact: ContactService;
    group: GroupService;
    webhook: WebhookService;
    labels: LabelService;
    automation: AutomationRulesService;
    search?: SearchService;
    searchContainsEnabled?: boolean;
}
export declare function allAgentTools(deps: AgentToolDeps): AnyToolDescriptor[];
