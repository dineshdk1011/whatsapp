"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HookManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookManager = void 0;
exports.normalizeHookPriority = normalizeHookPriority;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const node_async_hooks_1 = require("node:async_hooks");
const node_util_1 = require("node:util");
function normalizeHookPriority(priority) {
    return typeof priority === 'number' && Number.isFinite(priority) ? priority : 100;
}
let HookManager = HookManager_1 = class HookManager {
    logger = (0, logger_service_1.createLogger)(HookManager_1.name);
    hooks = new Map();
    pluginHooks = new Map();
    inFlightEvents = new node_async_hooks_1.AsyncLocalStorage();
    nextHookId = 0;
    register(pluginId, event, handler, priority = 100) {
        const id = `${pluginId}:${event}:${this.nextHookId++}`;
        const registration = {
            id,
            pluginId,
            event,
            handler,
            priority: normalizeHookPriority(priority),
        };
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        this.hooks.get(event).push(registration);
        this.hooks.get(event).sort((a, b) => a.priority - b.priority);
        if (!this.pluginHooks.has(pluginId)) {
            this.pluginHooks.set(pluginId, new Set());
        }
        this.pluginHooks.get(pluginId).add(id);
        this.logger.debug(`Hook registered: ${event} by ${pluginId} (priority: ${registration.priority})`);
        return id;
    }
    unregister(hookId) {
        for (const registrations of this.hooks.values()) {
            const index = registrations.findIndex(r => r.id === hookId);
            if (index !== -1) {
                const registration = registrations[index];
                registrations.splice(index, 1);
                const pluginHookIds = this.pluginHooks.get(registration.pluginId);
                if (pluginHookIds) {
                    pluginHookIds.delete(hookId);
                }
                this.logger.debug(`Hook unregistered: ${hookId}`);
                return;
            }
        }
    }
    setPriority(hookId, priority) {
        for (const registrations of this.hooks.values()) {
            const registration = registrations.find(r => r.id === hookId);
            if (!registration)
                continue;
            registration.priority = normalizeHookPriority(priority);
            registrations.sort((a, b) => a.priority - b.priority);
            return;
        }
    }
    unregisterPlugin(pluginId) {
        const hookIds = this.pluginHooks.get(pluginId);
        if (!hookIds)
            return;
        for (const [eventKey, registrations] of this.hooks.entries()) {
            const filtered = registrations.filter(r => r.pluginId !== pluginId);
            this.hooks.set(eventKey, filtered);
        }
        this.pluginHooks.delete(pluginId);
        this.logger.debug(`Unregistered all hooks for plugin: ${pluginId}`);
    }
    async execute(event, data, options) {
        if (this.isInFlight(event)) {
            this.logger.warn(`Hook re-entrancy blocked: ${event} re-fired by a handler of the same event (source: ${options.source})`);
            return { continue: true, data };
        }
        return this.runInFlight([event], () => this.runHandlers(event, data, options));
    }
    runInFlight(events, fn) {
        const scope = new Set(events);
        const scopes = [...(this.inFlightEvents.getStore() ?? []).filter(parent => parent.size > 0), scope];
        return this.inFlightEvents.run(scopes, () => {
            let result;
            try {
                result = fn();
            }
            catch (error) {
                scope.clear();
                throw error;
            }
            if (node_util_1.types.isPromise(result)) {
                void Promise.prototype.then.call(result, () => scope.clear(), () => scope.clear());
            }
            else {
                scope.clear();
            }
            return result;
        });
    }
    isInFlight(event) {
        return this.inFlightEvents.getStore()?.some(scope => scope.has(event)) ?? false;
    }
    currentInFlight() {
        return [...new Set((this.inFlightEvents.getStore() ?? []).flatMap(scope => [...scope]))];
    }
    async runHandlers(event, data, options) {
        const registrations = [...(this.hooks.get(event) ?? [])];
        if (registrations.length === 0) {
            return { continue: true, data };
        }
        let currentData = data;
        const ctx = {
            event,
            data: currentData,
            sessionId: options.sessionId,
            timestamp: new Date(),
            source: options.source,
        };
        for (const registration of registrations) {
            try {
                ctx.data = currentData;
                const result = await registration.handler(ctx);
                if (result.error === undefined && result.data !== undefined) {
                    if (options.accept && !options.accept(result.data)) {
                        this.logger.warn(`Hook result from ${registration.pluginId} for ${event} is not usable; keeping the previous data`);
                    }
                    else {
                        currentData = result.data;
                    }
                }
                if (!result.continue) {
                    this.logger.debug(`Hook chain stopped by ${registration.pluginId} at event ${event}`);
                    return { continue: false, data: currentData };
                }
                if (result.error) {
                    throw result.error;
                }
            }
            catch (error) {
                this.logger.error(`Hook error in ${registration.pluginId} for ${event}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return { continue: true, data: currentData };
    }
    hasHooks(event) {
        const registrations = this.hooks.get(event);
        return registrations !== undefined && registrations.length > 0;
    }
    getHookCount(event) {
        return this.hooks.get(event)?.length || 0;
    }
    getRegisteredHooks() {
        const result = {};
        for (const [event, registrations] of this.hooks.entries()) {
            result[event] = registrations.map(r => ({
                pluginId: r.pluginId,
                priority: r.priority,
            }));
        }
        return result;
    }
    getPluginEvents(pluginId) {
        const events = [];
        for (const [event, registrations] of this.hooks.entries()) {
            if (registrations.some(r => r.pluginId === pluginId)) {
                events.push(event);
            }
        }
        return events;
    }
};
exports.HookManager = HookManager;
exports.HookManager = HookManager = HookManager_1 = __decorate([
    (0, common_1.Injectable)()
], HookManager);
//# sourceMappingURL=hook-manager.service.js.map