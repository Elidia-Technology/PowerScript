import { EventEmitter } from 'events';
import {
    CloudConfig,
    CloudCredentials,
    DeploymentResult,
    DeploymentStatus,
    CloudResource,
    CloudProvider_Interface,
    IaCTemplate,
    OptimizationSuggestion,
    ResourceCost,
    ValidationResult
} from '../types';

/**
 * Base cloud provider implementation
 * Provides common functionality for all cloud providers
 */
export abstract class BaseCloudProvider extends EventEmitter implements CloudProvider_Interface {
    public abstract readonly name: string;
    public abstract readonly regions: string[];
    public abstract readonly supportedServices: string[];

    protected credentials?: CloudCredentials;
    protected authenticated: boolean = false;

    constructor() {
        super();
    }

    /**
     * Authenticate with the cloud provider
     */
    public async authenticate(credentials: CloudCredentials): Promise<boolean> {
        try {
            this.credentials = credentials;
            const result = await this.performAuthentication(credentials);
            this.authenticated = result;
            
            if (result) {
                this.emit('authenticated', { provider: this.name });
            } else {
                this.emit('authenticationFailed', { provider: this.name, error: 'Invalid credentials' });
            }
            
            return result;
        } catch (error) {
            this.authenticated = false;
            this.emit('authenticationError', { provider: this.name, error });
            throw error;
        }
    }

    /**
     * Check if provider is authenticated
     */
    public isAuthenticated(): boolean {
        return this.authenticated;
    }

    /**
     * Deploy application
     */
    public async deploy(config: CloudConfig): Promise<DeploymentResult> {
        if (!this.isAuthenticated()) {
            throw new Error(`Not authenticated with ${this.name}`);
        }

        const deploymentId = this.generateDeploymentId();
        
        try {
            this.emit('deploymentStarted', { id: deploymentId, config });
            
            const result = await this.performDeployment(config, deploymentId);
            
            this.emit('deploymentCompleted', result);
            return result;
        } catch (error) {
            this.emit('deploymentFailed', { id: deploymentId, message: error instanceof Error ? error.message : String(error), details: error });
            throw error;
        }
    }

    /**
     * Undeploy application
     */
    public async undeploy(deploymentId: string): Promise<boolean> {
        if (!this.isAuthenticated()) {
            throw new Error(`Not authenticated with ${this.name}`);
        }

        try {
            const result = await this.performUndeploy(deploymentId);
            
            if (result) {
                this.emit('resourceDeleted', { id: deploymentId, name: `deployment-${deploymentId}` });
            }
            
            return result;
        } catch (error) {
            this.emit('undeploymentError', { id: deploymentId, error });
            throw error;
        }
    }

    /**
     * Redeploy application
     */
    public async redeploy(deploymentId: string, config?: Partial<CloudConfig>): Promise<DeploymentResult> {
        if (!this.isAuthenticated()) {
            throw new Error(`Not authenticated with ${this.name}`);
        }

        try {
            // Get existing deployment config
            const existingStatus = await this.getDeploymentStatus(deploymentId);
            if (!existingStatus) {
                throw new Error(`Deployment ${deploymentId} not found`);
            }

            // Merge with new config if provided
            const deploymentConfig = config ? { ...existingStatus } : existingStatus;
            
            return await this.performRedeployment(deploymentId, deploymentConfig);
        } catch (error) {
            this.emit('redeploymentError', { id: deploymentId, error });
            throw error;
        }
    }

    /**
     * Generate a unique deployment ID
     */
    protected generateDeploymentId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${this.name}-${timestamp}-${random}`;
    }

    /**
     * Generate cost estimate for configuration
     */
    protected estimateCost(config: CloudConfig): ResourceCost {
        // Basic cost estimation - providers should override with actual pricing
        let hourlyCost = 0;
        
        // Compute costs
        if (config.resources?.compute) {
            const replicas = config.resources.compute.replicas || 1;
            hourlyCost += this.getComputeCost(config.resources.compute.instanceType || 'small') * replicas;
        }
        
        // Storage costs
        if (config.resources?.storage) {
            const size = this.parseStorageSize(config.resources.storage.size || '10GB');
            hourlyCost += this.getStorageCost(size);
        }
        
        // Database costs
        if (config.resources?.database) {
            hourlyCost += this.getDatabaseCost(config.resources.database.type || 'postgresql');
        }

        return {
            hourly: hourlyCost,
            monthly: hourlyCost * 24 * 30,
            currency: 'USD',
            breakdown: [
                { component: 'compute', cost: hourlyCost * 0.6, unit: 'hourly' },
                { component: 'storage', cost: hourlyCost * 0.2, unit: 'hourly' },
                { component: 'networking', cost: hourlyCost * 0.2, unit: 'hourly' }
            ]
        };
    }

    /**
     * Helper methods for cost calculation
     */
    protected getComputeCost(instanceType: string): number {
        const costs: Record<string, number> = {
            'small': 0.05,
            'medium': 0.10,
            'large': 0.20,
            't3.micro': 0.0104,
            't3.small': 0.0208,
            't3.medium': 0.0416,
            't3.large': 0.0832
        };
        return costs[instanceType] || 0.05;
    }

    protected getStorageCost(sizeGB: number): number {
        return sizeGB * 0.001; // $0.001 per GB per hour
    }

    protected getDatabaseCost(type: string): number {
        const costs: Record<string, number> = {
            'postgresql': 0.08,
            'mysql': 0.08,
            'mongodb': 0.12,
            'redis': 0.05
        };
        return costs[type] || 0.08;
    }

    protected parseStorageSize(size: string): number {
        const match = size.match(/(\d+)(GB|TB|MB)/i);
        if (!match) return 10; // Default 10GB
        
        const value = parseInt(match[1]);
        const unit = match[2].toUpperCase();
        
        switch (unit) {
            case 'TB': return value * 1024;
            case 'GB': return value;
            case 'MB': return value / 1024;
            default: return value;
        }
    }

    /**
     * Abstract methods that providers must implement
     */
    protected abstract performAuthentication(credentials: CloudCredentials): Promise<boolean>;
    protected abstract performDeployment(config: CloudConfig, deploymentId: string): Promise<DeploymentResult>;
    protected abstract performUndeploy(deploymentId: string): Promise<boolean>;
    protected abstract performRedeployment(deploymentId: string, config: any): Promise<DeploymentResult>;
    
    public abstract getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
    public abstract listDeployments(): Promise<DeploymentStatus[]>;
    public abstract getLogs(deploymentId: string, lines?: number): Promise<string[]>;
    public abstract listResources(): Promise<CloudResource[]>;
    public abstract getResource(resourceId: string): Promise<CloudResource>;
    public abstract deleteResource(resourceId: string): Promise<boolean>;
    public abstract getCostAnalysis(timeRange?: { start: Date; end: Date }): Promise<ResourceCost>;
    public abstract getOptimizationSuggestions(): Promise<OptimizationSuggestion[]>;
    public abstract generateIaCTemplate(config: CloudConfig): Promise<IaCTemplate>;
    public abstract validateTemplate(template: IaCTemplate): Promise<ValidationResult>;
    public abstract deployFromTemplate(template: IaCTemplate): Promise<DeploymentResult>;
}