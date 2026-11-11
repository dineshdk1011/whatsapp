"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DockerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = exports.MANAGED_DOCKER_PROFILES = void 0;
exports.datastoreInUse = datastoreInUse;
exports.hostPinnedElsewhere = hostPinnedElsewhere;
exports.prestartBuiltinDatabase = prestartBuiltinDatabase;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/services/logger.service");
const dockerode_1 = __importDefault(require("dockerode"));
const env_precedence_1 = require("../../config/env-precedence");
const generated_env_1 = require("../infra/generated-env");
const bundled_host_1 = require("./bundled-host");
exports.MANAGED_DOCKER_PROFILES = ['postgres', 'redis', 'minio'];
function datastoreInUse(profile, read) {
    if (profile === 'postgres')
        return read('DATABASE_TYPE') === 'postgres';
    if (profile === 'minio')
        return read('STORAGE_TYPE') === 's3';
    return ['REDIS_ENABLED', 'QUEUE_ENABLED', 'CACHE_ENABLED'].some(key => read(key) === 'true');
}
function hostPinnedElsewhere(profile, env = process.env) {
    const [key] = bundled_host_1.BUNDLED_SERVICE_ENV[profile] ?? [];
    return key !== undefined && (0, env_precedence_1.isEnvPinned)(key) && !(0, bundled_host_1.namesBundledContainer)(profile, env[key]);
}
const DOCKER_CALL_TIMEOUT_MS = 10_000;
let DockerService = DockerService_1 = class DockerService {
    logger = (0, logger_service_1.createLogger)(DockerService_1.name);
    docker = null;
    isAvailable = false;
    hasConnected = false;
    reinitInFlight = false;
    callTimeoutMs = DOCKER_CALL_TIMEOUT_MS;
    async answered(call, what) {
        const controller = new AbortController();
        let timer;
        const deadline = new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(new Error(`Docker did not answer ${what} within ${this.callTimeoutMs}ms`));
                controller.abort();
            }, this.callTimeoutMs);
        });
        try {
            return await Promise.race([call(controller.signal), deadline]);
        }
        finally {
            clearTimeout(timer);
        }
    }
    abortable(method, abortSignal) {
        const call = this.docker[method].bind(this.docker);
        return call({ abortSignal });
    }
    async onModuleInit() {
        await this.initializeDocker();
        await this.bootstrapOrchestration();
    }
    async bootstrapOrchestration() {
        if (!this.isAvailable) {
            this.logger.log('[Bootstrap Orchestration] Docker not available, skipping');
            return;
        }
        const env = (key) => process.env[key];
        const wanted = (profile, flag) => flag === 'true' && datastoreInUse(profile, env) && !hostPinnedElsewhere(profile);
        const profiles = [
            wanted('redis', process.env.REDIS_BUILTIN) && 'redis',
            wanted('postgres', process.env.POSTGRES_BUILTIN) && 'postgres',
            wanted('minio', process.env.MINIO_BUILTIN) && 'minio',
        ].filter((p) => typeof p === 'string');
        if (profiles.length === 0) {
            this.logger.log('[Bootstrap Orchestration] No built-in services configured');
            return;
        }
        this.logger.log(`[Bootstrap Orchestration] Starting built-in services: ${profiles.join(', ')}`);
        const result = await this.orchestrateProfiles(profiles);
        if (result.success) {
            this.logger.log(`[Bootstrap Orchestration] Started ${result.containersStarted.length} container(s)`);
        }
        else {
            this.logger.warn(`[Bootstrap Orchestration] Issues: ${result.errors.join('; ')}`);
        }
    }
    async startBuiltinDatabase() {
        await this.initializeDocker();
        if (this.isAvailable)
            await this.startService('database');
    }
    async initializeDocker() {
        try {
            this.docker = new dockerode_1.default(this.buildDockerOptions());
            await this.answered(abortSignal => this.abortable('ping', abortSignal), 'a ping');
            this.isAvailable = true;
            this.hasConnected = true;
            this.logger.log('Docker API connected successfully');
        }
        catch (error) {
            this.logger.warn('Docker not available. Container orchestration disabled.', {
                error: error instanceof Error ? error.message : String(error),
            });
            this.isAvailable = false;
        }
    }
    buildDockerOptions() {
        const dockerHost = process.env.DOCKER_HOST;
        if (dockerHost) {
            const match = /^tcp:\/\/([^:]+):(\d+)$/.exec(dockerHost);
            if (match) {
                return { host: match[1], port: parseInt(match[2], 10), protocol: 'http' };
            }
        }
        return { socketPath: '/var/run/docker.sock' };
    }
    isDockerAvailable() {
        if (!this.isAvailable && !this.reinitInFlight && (process.env.DOCKER_HOST || this.hasConnected)) {
            this.reinitInFlight = true;
            void this.initializeDocker()
                .then(() => this.bootstrapOrchestration())
                .catch(error => this.logger.warn('Could not start built-in services after Docker recovery', String(error)))
                .finally(() => {
                this.reinitInFlight = false;
            });
        }
        return this.isAvailable;
    }
    async listContainers() {
        if (!this.docker || !this.isAvailable) {
            return null;
        }
        try {
            const containers = await this.answered(abortSignal => this.docker.listContainers({ all: true, abortSignal }), 'a container list');
            return containers
                .filter(c => {
                const labels = c.Labels || {};
                return labels['com.openwa.service'] || c.Names?.some(n => n.startsWith('/openwa-'));
            })
                .map(c => ({
                id: c.Id.substring(0, 12),
                name: c.Names?.[0]?.replace(/^\//, '') || 'unknown',
                state: c.State || 'unknown',
                status: c.Status || 'unknown',
                labels: c.Labels || {},
            }));
        }
        catch (error) {
            this.logger.error('Failed to list containers', error);
            this.isAvailable = false;
            return null;
        }
    }
    async getRunningBuiltinServices() {
        const containers = await this.listContainers();
        if (containers === null)
            return null;
        const creator = (svc) => {
            const running = containers.find(c => c.labels['com.openwa.service'] === svc && c.labels['com.openwa.builtin'] === 'true' && c.state === 'running');
            if (!running)
                return false;
            return running.labels['com.docker.compose.project'] ? 'compose' : 'openwa';
        };
        return { database: creator('database'), cache: creator('cache'), storage: creator('storage') };
    }
    async getContainerByService(service) {
        if (!this.docker || !this.isAvailable) {
            return null;
        }
        try {
            const containers = await this.answered(abortSignal => this.docker.listContainers({
                all: true,
                filters: {
                    label: [`com.openwa.service=${service}`],
                },
                abortSignal,
            }), 'a container list');
            if (containers.length > 0) {
                return this.docker.getContainer(containers[0].Id);
            }
            const target = `openwa-${service}`;
            const allContainers = await this.answered(abortSignal => this.docker.listContainers({ all: true, abortSignal }), 'a container list');
            const match = allContainers.find(c => c.Names?.some(n => n === target || n === `/${target}`));
            if (match) {
                return this.docker.getContainer(match.Id);
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get container for service: ${service}`, error);
            return null;
        }
    }
    getContainerSpec(profile) {
        let saved;
        const nextBoot = (key) => (0, env_precedence_1.isEnvPinned)(key) || (0, env_precedence_1.isOsProvidedEnv)(key) ? process.env[key] : (saved ??= (0, generated_env_1.readGeneratedEnv)())[key];
        const specs = {
            redis: {
                image: 'redis:7-alpine',
                name: 'openwa-redis',
                alias: 'redis',
                cmd: ['redis-server', '--appendonly', 'yes', '--maxmemory-policy', 'noeviction'],
                volumes: [{ name: 'openwa_redis-data', path: '/data' }],
                healthcheck: {
                    test: ['CMD', 'redis-cli', 'ping'],
                    interval: 5000000000,
                    timeout: 3000000000,
                    retries: 5,
                },
                labels: {
                    'com.openwa.service': 'cache',
                    'com.openwa.builtin': 'true',
                },
                securityOpt: ['no-new-privileges:true'],
            },
            postgres: {
                image: 'postgres:16-alpine',
                name: 'openwa-postgres',
                alias: 'postgres',
                env: [
                    'POSTGRES_USER=openwa',
                    `POSTGRES_PASSWORD=${nextBoot('DATABASE_PASSWORD') || 'openwa'}`,
                    'POSTGRES_DB=openwa',
                ],
                volumes: [{ name: 'openwa_postgres-data', path: '/var/lib/postgresql/data' }],
                healthcheck: {
                    test: ['CMD-SHELL', 'pg_isready -U openwa'],
                    interval: 5000000000,
                    timeout: 3000000000,
                    retries: 5,
                },
                labels: {
                    'com.openwa.service': 'database',
                    'com.openwa.builtin': 'true',
                },
                securityOpt: ['no-new-privileges:true'],
            },
            minio: {
                image: 'pgsty/silo:RELEASE.2026-09-16T00-00-00Z@sha256:635197cb9f36d01bee221d34d1c7d7960f6a95c48b0b6c01d99cd13bdae51a46',
                name: 'openwa-minio',
                alias: 'minio',
                cmd: ['server', '/data', '--console-address', ':9001'],
                env: [
                    `MINIO_ROOT_USER=${nextBoot('S3_ACCESS_KEY_ID') || nextBoot('S3_ACCESS_KEY') || 'minioadmin'}`,
                    `MINIO_ROOT_PASSWORD=${nextBoot('S3_SECRET_ACCESS_KEY') || nextBoot('S3_SECRET_KEY') || 'minioadmin'}`,
                ],
                volumes: [{ name: 'openwa_minio-data', path: '/data' }],
                healthcheck: {
                    test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live'],
                    interval: 10000000000,
                    timeout: 5000000000,
                    retries: 3,
                },
                labels: {
                    'com.openwa.service': 'storage',
                    'com.openwa.builtin': 'true',
                },
                securityOpt: ['no-new-privileges:true'],
            },
        };
        return specs[profile] || null;
    }
    async createService(profile) {
        if (!this.docker || !this.isAvailable) {
            this.logger.error('Docker not available for creating service');
            return false;
        }
        const spec = this.getContainerSpec(profile);
        if (!spec) {
            this.logger.error(`Unknown profile: ${profile}`);
            return false;
        }
        this.logger.log(`Creating service: ${profile} (image: ${spec.image})`);
        try {
            const existing = await this.getContainerByService(profile);
            if (existing) {
                const info = await this.answered(abortSignal => existing.inspect({ abortSignal }), 'a container inspection');
                this.warnOnImageDrift(profile, spec.name, info);
                if (info.State.Running) {
                    this.logger.log(`Container ${spec.name} already running`);
                    return true;
                }
                await existing.start();
                this.logger.log(`Started existing container: ${spec.name}`);
                return true;
            }
            const cached = await this.answered(abortSignal => {
                const image = Object.create(this.docker.getImage(spec.image));
                const modem = this.docker.modem;
                const imageModem = Object.create(modem);
                image.modem = imageModem;
                imageModem.dial = (options, callback) => modem.dial({ ...options, abortSignal }, callback);
                return image.inspect({ abortSignal });
            }, 'an image inspection').then(() => true, (error) => {
                if (error?.statusCode !== 404)
                    throw error;
                return false;
            });
            if (!cached) {
                this.logger.log(`Pulling image: ${spec.image}`);
                await new Promise((resolve, reject) => {
                    void this.docker.pull(spec.image, (err, stream) => {
                        if (err)
                            return reject(err);
                        this.docker.modem.followProgress(stream, (err2) => {
                            if (err2)
                                return reject(err2);
                            resolve();
                        });
                    });
                });
            }
            if (spec.volumes) {
                for (const vol of spec.volumes) {
                    try {
                        await this.docker.createVolume({ Name: vol.name });
                        this.logger.log(`Created volume: ${vol.name}`);
                    }
                    catch (error) {
                        this.logger.debug(`Volume ${vol.name} creation skipped (may already exist)`, { error: String(error) });
                    }
                }
            }
            const containerConfig = {
                name: spec.name,
                Image: spec.image,
                Cmd: spec.cmd,
                Env: spec.env,
                Labels: spec.labels,
                HostConfig: {
                    NetworkMode: 'openwa-network',
                    RestartPolicy: { Name: 'unless-stopped' },
                    Binds: spec.volumes?.map(v => `${v.name}:${v.path}`),
                    SecurityOpt: spec.securityOpt,
                },
                Healthcheck: spec.healthcheck
                    ? {
                        Test: spec.healthcheck.test,
                        Interval: spec.healthcheck.interval,
                        Timeout: spec.healthcheck.timeout,
                        Retries: spec.healthcheck.retries,
                    }
                    : undefined,
                NetworkingConfig: {
                    EndpointsConfig: {
                        'openwa-network': {
                            Aliases: [spec.alias, profile],
                        },
                    },
                },
            };
            const container = await this.docker.createContainer(containerConfig);
            await container.start();
            this.logger.log(`Created and started container: ${spec.name}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to create service ${profile}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async startService(service) {
        const container = await this.getContainerByService(service);
        const serviceToProfile = {
            database: 'postgres',
            cache: 'redis',
            storage: 'minio',
            postgres: 'postgres',
            redis: 'redis',
            minio: 'minio',
        };
        const profile = serviceToProfile[service] || service;
        if (!container) {
            this.logger.log(`Container for service '${service}' not found, creating...`);
            return this.createService(profile);
        }
        try {
            const info = await this.answered(abortSignal => container.inspect({ abortSignal }), 'a container inspection');
            this.warnOnImageDrift(profile, info.Name?.replace(/^\//, '') || service, info);
            if (info.State.Running) {
                this.logger.log(`Service '${service}' is already running`);
                return true;
            }
            await container.start();
            this.logger.log(`Started service: ${service}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start service: ${service}`, error);
            return false;
        }
    }
    warnOnImageDrift(profile, name, info) {
        const pinned = this.getContainerSpec(profile)?.image;
        const running = info.Config?.Image;
        if (!pinned || !running || running === pinned)
            return;
        this.logger.warn(`Container ${name} runs image ${running}, but this release pins ${pinned}. Remove it with ` +
            `\`docker rm -f ${name}\` (its named data volume is kept) and restart OpenWA or re-enable the ` +
            `service so it is recreated from the pin.` +
            (profile === 'postgres' ? ' A PostgreSQL major version change needs a data migration first.' : ''));
    }
    async stopManagedService(profile) {
        this.logger.log(`Stopping service with profile: ${profile} (container retained, not removed)`);
        const serviceMap = {
            postgres: 'database',
            redis: 'cache',
            minio: 'storage',
        };
        return this.stopService(serviceMap[profile] || profile);
    }
    async stopService(service) {
        const container = await this.getContainerByService(service);
        if (!container) {
            this.logger.warn(`Container for service '${service}' not found`);
            return true;
        }
        try {
            const info = await this.answered(abortSignal => container.inspect({ abortSignal }), 'a container inspection');
            if (!info.State.Running) {
                this.logger.log(`Service '${service}' is already stopped`);
                return true;
            }
            await container.stop();
            this.logger.log(`Stopped service: ${service}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to stop service: ${service}`, error);
            return false;
        }
    }
    async orchestrateProfiles(profiles) {
        let estimatedTime = 15;
        if (profiles.includes('postgres'))
            estimatedTime += 20;
        if (profiles.includes('redis'))
            estimatedTime += 13;
        if (profiles.includes('minio'))
            estimatedTime += 15;
        const result = {
            success: true,
            message: '',
            containersStarted: [],
            containersStopped: [],
            errors: [],
            estimatedTime,
        };
        if (!this.docker || !this.isAvailable) {
            result.success = false;
            result.message = 'Docker is not available';
            return result;
        }
        this.logger.log(`Orchestrating profiles: ${profiles.join(', ')}`);
        const profileToService = {
            postgres: 'database',
            redis: 'cache',
            minio: 'storage',
        };
        for (const profile of profiles) {
            const service = profileToService[profile] || profile;
            try {
                const started = await this.startService(service);
                if (started) {
                    result.containersStarted.push(profile);
                }
                else {
                    result.errors.push(`Failed to create or start the '${profile}' container; see the server log for the Docker error.`);
                }
            }
            catch (error) {
                result.errors.push(`Failed to start ${profile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        if (result.errors.length > 0) {
            result.success = profiles.length > 0 && result.containersStarted.length > 0;
            result.message = result.errors.join('; ');
        }
        else {
            result.message = `Successfully orchestrated ${result.containersStarted.length} service(s)`;
        }
        return result;
    }
};
exports.DockerService = DockerService;
exports.DockerService = DockerService = DockerService_1 = __decorate([
    (0, common_1.Injectable)()
], DockerService);
async function prestartBuiltinDatabase(env = process.env, service = new DockerService(), timeoutMs = 15_000) {
    if (env.DATABASE_TYPE !== 'postgres' || env.POSTGRES_BUILTIN !== 'true' || hostPinnedElsewhere('postgres', env))
        return;
    const logger = (0, logger_service_1.createLogger)('DockerService');
    let timer;
    const deadline = new Promise(resolve => {
        timer = setTimeout(() => {
            logger.warn(`Built-in PostgreSQL start did not finish within ${timeoutMs}ms; continuing boot`);
            resolve();
        }, timeoutMs);
    });
    try {
        await Promise.race([service.startBuiltinDatabase(), deadline]);
    }
    catch (error) {
        logger.warn(`Could not start built-in PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=docker.service.js.map