import { EventEmitter } from 'events';

/**
 * Cloud deployment configuration
 */
export interface CloudConfig {
    provider: CloudProvider;
    region: string;
    environment: DeploymentEnvironment;
    credentials?: CloudCredentials;
    resources?: ResourceConfig;
    scaling?: ScalingConfig;
    monitoring?: MonitoringConfig;
}

/**
 * Supported cloud providers
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'cloudflare' | 'deno' | 'bun' | 'edge';

/**
 * Deployment environments
 */
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Cloud provider credentials
 */
export interface CloudCredentials {
    accessKey?: string;
    secretKey?: string;
    token?: string;
    projectId?: string;
    region?: string;
    [key: string]: any;
}

/**
 * Resource configuration for cloud deployment
 */
export interface ResourceConfig {
    compute?: ComputeConfig;
    storage?: StorageConfig;
    database?: DatabaseConfig;
    networking?: NetworkingConfig;
    [key: string]: any;
}

/**
 * Compute resource configuration
 */
export interface ComputeConfig {
    instanceType?: string;
    cpu?: number;
    memory?: string;
    replicas?: number;
    container?: ContainerConfig;
}

/**
 * Container configuration
 */
export interface ContainerConfig {
    image?: string;
    dockerfile?: string;
    buildContext?: string;
    ports?: number[];
    environmentVariables?: Record<string, string>;
    volumes?: VolumeConfig[];
}

/**
 * Volume configuration
 */
export interface VolumeConfig {
    name: string;
    mountPath: string;
    size?: string;
    storageClass?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
    type?: 'object' | 'block' | 'file';
    size?: string;
    backup?: boolean;
    encryption?: boolean;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
    type?: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'dynamodb';
    version?: string;
    size?: string;
    backup?: boolean;
    highAvailability?: boolean;
}

/**
 * Networking configuration
 */
export interface NetworkingConfig {
    loadBalancer?: LoadBalancerConfig;
    cdn?: CDNConfig;
    ssl?: SSLConfig;
    customDomain?: string;
}

/**
 * Load balancer configuration
 */
export interface LoadBalancerConfig {
    enabled: boolean;
    type?: 'application' | 'network';
    healthCheck?: HealthCheckConfig;
    stickySession?: boolean;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
    path: string;
    port?: number;
    interval?: number;
    timeout?: number;
    retries?: number;
}

/**
 * CDN configuration
 */
export interface CDNConfig {
    enabled: boolean;
    cachePolicy?: string;
    origins?: string[];
    customHeaders?: Record<string, string>;
}

/**
 * SSL configuration
 */
export interface SSLConfig {
    enabled: boolean;
    certificate?: string;
    autoRenew?: boolean;
}

/**
 * Auto-scaling configuration
 */
export interface ScalingConfig {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU?: number;
    targetMemory?: number;
    scaleOutCooldown?: number;
    scaleInCooldown?: number;
    metrics?: ScalingMetric[];
}

/**
 * Scaling metric configuration
 */
export interface ScalingMetric {
    name: string;
    targetValue: number;
    type: 'cpu' | 'memory' | 'requests' | 'custom';
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    enabled: boolean;
    metrics?: string[];
    alerts?: AlertConfig[];
    dashboard?: boolean;
    logs?: LogConfig;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
    name: string;
    condition: string;
    threshold: number;
    severity: 'info' | 'warning' | 'error' | 'critical';
    notifications?: NotificationConfig[];
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
    type: 'email' | 'sms' | 'slack' | 'webhook';
    target: string;
    enabled: boolean;
}

/**
 * Log configuration
 */
export interface LogConfig {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    retention?: number; // days
    aggregation?: boolean;
}

/**
 * Deployment status
 */
export interface DeploymentStatus {
    id: string;
    status: 'pending' | 'building' | 'deploying' | 'deployed' | 'failed' | 'rolled-back';
    progress: number;
    message?: string;
    url?: string;
    createdAt: Date;
    updatedAt: Date;
    duration?: number;
    logs?: string[];
}

/**
 * Cloud resource information
 */
export interface CloudResource {
    id: string;
    name: string;
    type: string;
    status: 'creating' | 'running' | 'stopped' | 'error' | 'deleting';
    region: string;
    cost?: ResourceCost;
    metadata?: Record<string, any>;
}

/**
 * Resource cost information
 */
export interface ResourceCost {
    hourly: number;
    monthly: number;
    currency: string;
    breakdown?: CostBreakdown[];
}

/**
 * Cost breakdown
 */
export interface CostBreakdown {
    component: string;
    cost: number;
    unit: string;
}

/**
 * Infrastructure as Code template
 */
export interface IaCTemplate {
    provider: CloudProvider;
    template: string;
    parameters?: Record<string, any>;
    outputs?: Record<string, any>;
    dependencies?: string[];
}

/**
 * Deployment result
 */
export interface DeploymentResult {
    success: boolean;
    deploymentId: string;
    url?: string;
    endpoints?: Record<string, string>;
    resources?: CloudResource[];
    cost?: ResourceCost;
    duration: number;
    logs: string[];
    errors?: string[];
}

/**
 * Cloud provider interface
 */
export interface CloudProvider_Interface extends EventEmitter {
    // Provider identification
    readonly name: string;
    readonly regions: string[];
    readonly supportedServices: string[];

    // Authentication
    authenticate(credentials: CloudCredentials): Promise<boolean>;
    isAuthenticated(): boolean;

    // Deployment operations
    deploy(config: CloudConfig): Promise<DeploymentResult>;
    undeploy(deploymentId: string): Promise<boolean>;
    redeploy(deploymentId: string, config?: Partial<CloudConfig>): Promise<DeploymentResult>;

    // Status and monitoring
    getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
    listDeployments(): Promise<DeploymentStatus[]>;
    getLogs(deploymentId: string, lines?: number): Promise<string[]>;

    // Resource management
    listResources(): Promise<CloudResource[]>;
    getResource(resourceId: string): Promise<CloudResource>;
    deleteResource(resourceId: string): Promise<boolean>;

    // Cost optimization
    getCostAnalysis(timeRange?: { start: Date; end: Date }): Promise<ResourceCost>;
    getOptimizationSuggestions(): Promise<OptimizationSuggestion[]>;

    // Infrastructure as Code
    generateIaCTemplate(config: CloudConfig): Promise<IaCTemplate>;
    validateTemplate(template: IaCTemplate): Promise<ValidationResult>;
    deployFromTemplate(template: IaCTemplate): Promise<DeploymentResult>;
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
    type: 'cost' | 'performance' | 'security' | 'reliability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    potentialSavings?: number;
    implementationEffort: 'low' | 'medium' | 'high';
    recommendation: string;
}

/**
 * Template validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
    estimatedCost?: ResourceCost;
}

/**
 * Validation error
 */
export interface ValidationError {
    code: string;
    message: string;
    line?: number;
    column?: number;
    severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
    code: string;
    message: string;
    line?: number;
    column?: number;
    recommendation?: string;
}

/**
 * Deployment events
 */
export interface DeploymentEvents {
    deploymentStarted: (deployment: { id: string; config: CloudConfig }) => void;
    deploymentProgress: (progress: { id: string; progress: number; message: string }) => void;
    deploymentCompleted: (result: DeploymentResult) => void;
    deploymentFailed: (error: { id: string; message: string; details?: any }) => void;
    resourceCreated: (resource: CloudResource) => void;
    resourceDeleted: (resource: { id: string; name: string }) => void;
    costAlert: (alert: { threshold: number; current: number; suggestion?: string }) => void;
}

/**
 * Edge deployment configuration
 */
export interface EdgeConfig {
    provider: 'cloudflare' | 'deno' | 'bun' | 'vercel-edge';
    regions?: string[];
    runtime?: 'v8' | 'deno' | 'bun';
    environmentVariables?: Record<string, string>;
    routes?: EdgeRoute[];
    caching?: EdgeCacheConfig;
}

/**
 * Edge route configuration
 */
export interface EdgeRoute {
    pattern: string;
    handler: string;
    methods?: string[];
    middleware?: string[];
}

/**
 * Edge caching configuration
 */
export interface EdgeCacheConfig {
    enabled: boolean;
    ttl?: number;
    vary?: string[];
    bypass?: string[];
}

/**
 * Multi-cloud deployment configuration
 */
export interface MultiCloudConfig {
    primary: CloudConfig;
    secondary?: CloudConfig;
    failover?: FailoverConfig;
    loadBalancing?: MultiCloudLoadBalancing;
    dataSync?: DataSyncConfig;
}

/**
 * Failover configuration
 */
export interface FailoverConfig {
    enabled: boolean;
    healthCheck: HealthCheckConfig;
    switchoverTime: number;
    rollbackConditions?: string[];
}

/**
 * Multi-cloud load balancing
 */
export interface MultiCloudLoadBalancing {
    strategy: 'round-robin' | 'latency-based' | 'geographic' | 'cost-optimized';
    healthChecks: boolean;
    weights?: Record<string, number>;
}

/**
 * Data synchronization configuration
 */
export interface DataSyncConfig {
    enabled: boolean;
    strategy: 'active-active' | 'active-passive' | 'eventual-consistency';
    syncInterval?: number;
    conflictResolution?: 'primary-wins' | 'timestamp' | 'custom';
}