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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginInstanceService = exports.InstanceExistsError = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plugin_instance_entity_1 = require("./entities/plugin-instance.entity");
const conversation_mapping_entity_1 = require("./entities/conversation-mapping.entity");
const db_errors_1 = require("../../common/utils/db-errors");
const shared_connection_1 = require("../../common/utils/shared-connection");
const plugin_activation_1 = require("../../core/plugins/plugin-activation");
const redact_config_1 = require("../plugins/redact-config");
function normalizeSecret(supplied) {
    if (supplied === undefined)
        return (0, node_crypto_1.randomBytes)(32).toString('hex');
    const s = supplied.trim();
    if (s.length < 16) {
        throw new common_1.BadRequestException('instance secret must be a non-empty string of at least 16 characters');
    }
    return s;
}
class InstanceExistsError extends Error {
    constructor(pluginId, instanceId) {
        super(`instance ${instanceId} already exists for plugin ${pluginId}`);
        this.name = 'InstanceExistsError';
    }
}
exports.InstanceExistsError = InstanceExistsError;
let PluginInstanceService = class PluginInstanceService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async mint(pluginId, instanceId, opts) {
        const existing = await this.resolve(pluginId, instanceId);
        if (existing)
            return existing;
        return ((await this.insert(pluginId, instanceId, opts)) ?? (await this.resolve(pluginId, instanceId)));
    }
    async insert(pluginId, instanceId, opts) {
        const inst = this.repo.create({
            id: `${pluginId}:${instanceId}`,
            pluginId,
            instanceId,
            sessionScope: opts.sessionScope || null,
            secret: normalizeSecret(opts.secret),
            verifyToken: opts.verifyToken || (0, node_crypto_1.randomBytes)(16).toString('hex'),
            config: opts.config ?? null,
            enabled: true,
        });
        try {
            await this.repo.insert(inst);
        }
        catch (err) {
            if ((0, db_errors_1.isUniqueViolation)(err))
                return null;
            throw err;
        }
        return inst;
    }
    resolve(pluginId, instanceId) {
        return this.repo.findOne({ where: { id: `${pluginId}:${instanceId}` } });
    }
    maskedView(instance, schema) {
        return {
            ...instance,
            secret: redact_config_1.SECRET_SENTINEL,
            config: instance.config == null ? instance.config : (0, redact_config_1.redactSecretConfig)(instance.config, schema),
        };
    }
    async create(pluginId, instanceId, opts) {
        if (await this.resolve(pluginId, instanceId))
            throw new InstanceExistsError(pluginId, instanceId);
        const inst = await this.insert(pluginId, instanceId, opts);
        if (!inst)
            throw new InstanceExistsError(pluginId, instanceId);
        return inst;
    }
    list(pluginId) {
        return this.repo.find({ where: { pluginId } });
    }
    listAll() {
        return this.repo.find();
    }
    async regenerateSecret(pluginId, instanceId) {
        const inst = await this.resolve(pluginId, instanceId);
        const secret = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const written = inst ? (await this.repo.update({ id: inst.id }, { secret })).affected : 0;
        return written ? this.resolve(pluginId, instanceId) : null;
    }
    async update(pluginId, instanceId, patch, schema, layer) {
        const inst = await this.resolve(pluginId, instanceId);
        if (!inst)
            return null;
        const changes = {};
        if (patch.enabled !== undefined)
            changes.enabled = patch.enabled;
        if (patch.sessionScope !== undefined)
            changes.sessionScope = patch.sessionScope || null;
        if (patch.config !== undefined) {
            const stored = (0, plugin_activation_1.restorableConfig)(inst.config ?? undefined, patch.config, { configSchema: schema, net: layer?.net }, layer?.beneath);
            changes.config = (0, redact_config_1.restoreSecretConfig)(patch.config, stored, schema);
        }
        if (Object.keys(changes).length === 0)
            return inst;
        const { affected } = await this.repo.update({ id: inst.id }, changes);
        return affected ? this.resolve(pluginId, instanceId) : null;
    }
    async remove(pluginId, instanceId) {
        if (!(await (0, shared_connection_1.awaitNoOpenTransaction)(this.repo.manager.dataSource))) {
            throw new common_1.ServiceUnavailableException(`Instance ${instanceId} was not deleted: another database transaction stayed open. Retry the delete.`);
        }
        return this.repo.manager.transaction(async (manager) => {
            const result = await manager.delete(plugin_instance_entity_1.PluginInstance, { id: `${pluginId}:${instanceId}` });
            await manager.update(conversation_mapping_entity_1.ConversationMapping, { pluginId, instanceId, handoverState: (0, typeorm_2.In)(['human', 'closed']) }, { handoverState: 'bot' });
            return (result.affected ?? 0) > 0;
        });
    }
};
exports.PluginInstanceService = PluginInstanceService;
exports.PluginInstanceService = PluginInstanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plugin_instance_entity_1.PluginInstance, 'data')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PluginInstanceService);
//# sourceMappingURL=plugin-instance.service.js.map