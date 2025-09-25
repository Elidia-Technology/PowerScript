#!/usr/bin/env node

import { PowerScriptCloud } from '../src/cloud';
import { CloudConfig, CloudProvider } from '../src/cloud/types';
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PowerScript Cloud CLI
 * Command-line interface for cloud deployment operations
 */

program
    .name('ps-cloud')
    .description('PowerScript Cloud Deployment CLI')
    .version('1.0.0');

// Deploy command
program
    .command('deploy')
    .description('Deploy application to cloud provider')
    .option('-p, --provider <provider>', 'Cloud provider (aws, gcp, azure, vercel, netlify, edge)', 'aws')
    .option('-r, --region <region>', 'Deployment region', 'us-east-1')
    .option('-e, --environment <env>', 'Deployment environment', 'production')
    .option('-c, --config <file>', 'Configuration file path')
    .option('--compute-type <type>', 'Compute instance type', 'small')
    .option('--compute-replicas <count>', 'Number of compute replicas', '2')
    .option('--database', 'Include database resources')
    .option('--database-type <type>', 'Database type (postgresql, mysql)', 'postgresql')
    .option('--backup', 'Enable database backups')
    .option('--monitoring', 'Enable monitoring and alerting')
    .option('--scaling', 'Enable auto-scaling')
    .action(async (options: any) => {
        try {
            console.log('🚀 PowerScript Cloud Deployment Starting...\n');
            
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            // Build configuration
            const config: CloudConfig = await buildConfig(options);
            
            console.log(`📋 Deployment Configuration:`);
            console.log(`   Provider: ${config.provider}`);
            console.log(`   Region: ${config.region}`);
            console.log(`   Environment: ${config.environment}`);
            if (config.resources?.compute) {
                console.log(`   Compute: ${config.resources.compute.instanceType} x${config.resources.compute.replicas}`);
            }
            if (config.resources?.database) {
                console.log(`   Database: ${config.resources.database.type} (backup: ${config.resources.database.backup ? 'enabled' : 'disabled'})`);
            }
            console.log('');
            
            // Add progress listener
            cloud.on('deploymentStarted', (data) => {
                console.log(`⚡ Starting deployment: ${data.id}`);
            });
            
            cloud.on('deploymentProgress', (data) => {
                console.log(`📊 Progress ${data.progress}%: ${data.message}`);
            });
            
            cloud.on('resourceCreated', (resource) => {
                console.log(`✅ Created ${resource.type}: ${resource.name}`);
            });
            
            cloud.on('deploymentCompleted', (result) => {
                if (result.success) {
                    console.log('\n🎉 Deployment Successful!');
                    console.log(`🌐 URL: ${result.url}`);
                    console.log(`⏱️  Duration: ${result.duration}ms`);
                    console.log(`💰 Estimated Cost: $${result.cost?.monthly}/month`);
                    
                    if (result.endpoints) {
                        console.log('\n📡 Endpoints:');
                        Object.entries(result.endpoints).forEach(([key, value]) => {
                            console.log(`   ${key}: ${value}`);
                        });
                    }
                } else {
                    console.log('\n❌ Deployment Failed');
                    if (result.logs) {
                        console.log('📜 Logs:');
                        result.logs.forEach(log => console.log(`   ${log}`));
                    }
                }
            });
            
            // Start deployment
            const result = await cloud.deploy(config);
            
            if (result.success) {
                console.log(`\n📋 Deployment ID: ${result.deploymentId}`);
                console.log(`🔗 Use 'ps-cloud status ${result.deploymentId}' to check status`);
                process.exit(0);
            } else {
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Deployment failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Status command
program
    .command('status <deploymentId>')
    .description('Check deployment status')
    .option('-p, --provider <provider>', 'Cloud provider', 'aws')
    .action(async (deploymentId: string, options: any) => {
        try {
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const status = await cloud.getDeploymentStatus(deploymentId);
            
            if (status) {
                console.log(`📊 Deployment Status: ${deploymentId}`);
                console.log(`   Status: ${status.status}`);
                console.log(`   Progress: ${status.progress}%`);
                console.log(`   Message: ${status.message}`);
                console.log(`   Created: ${status.createdAt.toISOString()}`);
                console.log(`   Updated: ${status.updatedAt.toISOString()}`);
                
                if (status.url) {
                    console.log(`   URL: ${status.url}`);
                }
                
                if (status.duration) {
                    console.log(`   Duration: ${status.duration}ms`);
                }
            } else {
                console.log(`❌ Deployment not found: ${deploymentId}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to get status:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// List deployments command
program
    .command('list')
    .description('List all deployments')
    .action(async () => {
        try {
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const deployments = await cloud.listDeployments();
            
            if (deployments.length === 0) {
                console.log('📭 No deployments found');
                return;
            }
            
            console.log(`📋 Deployments (${deployments.length}):\n`);
            
            deployments.forEach((deployment, index) => {
                console.log(`${index + 1}. ${deployment.id}`);
                console.log(`   Status: ${deployment.status}`);
                console.log(`   Created: ${deployment.createdAt.toLocaleDateString()}`);
                if (deployment.url) {
                    console.log(`   URL: ${deployment.url}`);
                }
                console.log('');
            });
            
        } catch (error) {
            console.error('❌ Failed to list deployments:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Undeploy command
program
    .command('undeploy <deploymentId>')
    .description('Remove a deployment')
    .action(async (deploymentId: string) => {
        try {
            console.log(`🗑️  Undeploying: ${deploymentId}`);
            
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const success = await cloud.undeploy(deploymentId);
            
            if (success) {
                console.log('✅ Successfully undeployed');
            } else {
                console.log('❌ Failed to undeploy');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Undeploy failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Resources command
program
    .command('resources')
    .description('List cloud resources')
    .option('-p, --provider <provider>', 'Filter by provider')
    .action(async (options: any) => {
        try {
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const resources = await cloud.listResources(options.provider);
            
            if (resources.length === 0) {
                console.log('📭 No resources found');
                return;
            }
            
            console.log(`🏗️  Cloud Resources (${resources.length}):\n`);
            
            resources.forEach((resource, index) => {
                console.log(`${index + 1}. ${resource.name} (${resource.type})`);
                console.log(`   ID: ${resource.id}`);
                console.log(`   Status: ${resource.status}`);
                console.log(`   Region: ${resource.region}`);
                if (resource.cost) {
                    console.log(`   Cost: $${resource.cost.monthly}/month`);
                }
                console.log('');
            });
            
        } catch (error) {
            console.error('❌ Failed to list resources:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Optimize command
program
    .command('optimize')
    .description('Get optimization suggestions')
    .option('-p, --provider <provider>', 'Filter by provider')
    .action(async (options: any) => {
        try {
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const suggestions = await cloud.getOptimizationSuggestions(options.provider);
            
            if (suggestions.length === 0) {
                console.log('✨ No optimization suggestions at this time');
                return;
            }
            
            console.log(`💡 Optimization Suggestions (${suggestions.length}):\n`);
            
            suggestions.forEach((suggestion, index) => {
                const severityIcon = suggestion.severity === 'high' ? '🔴' : 
                                   suggestion.severity === 'medium' ? '🟡' : '🟢';
                
                console.log(`${index + 1}. ${severityIcon} ${suggestion.title}`);
                console.log(`   Type: ${suggestion.type}`);
                console.log(`   Description: ${suggestion.description}`);
                console.log(`   Recommendation: ${suggestion.recommendation}`);
                
                if (suggestion.potentialSavings) {
                    console.log(`   Potential Savings: $${suggestion.potentialSavings}/month`);
                }
                
                console.log(`   Implementation Effort: ${suggestion.implementationEffort}`);
                console.log('');
            });
            
        } catch (error) {
            console.error('❌ Failed to get optimization suggestions:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

// Generate IaC command
program
    .command('generate')
    .description('Generate Infrastructure as Code template')
    .option('-p, --provider <provider>', 'Cloud provider', 'aws')
    .option('-o, --output <file>', 'Output file path')
    .option('-r, --region <region>', 'Deployment region', 'us-east-1')
    .option('-e, --environment <env>', 'Environment name', 'production')
    .action(async (options: any) => {
        try {
            const cloud = new PowerScriptCloud();
            await cloud.initialize();
            
            const config: CloudConfig = await buildConfig(options);
            const template = await cloud.generateIaCTemplate(config);
            
            if (options.output) {
                fs.writeFileSync(options.output, template.template);
                console.log(`✅ Template generated: ${options.output}`);
            } else {
                console.log('📄 Generated Template:\n');
                console.log(template.template);
            }
            
            console.log('\n📋 Template Info:');
            console.log(`   Provider: ${template.provider}`);
            console.log(`   Parameters: ${Object.keys(template.parameters || {}).join(', ')}`);
            console.log(`   Outputs: ${Object.keys(template.outputs || {}).join(', ')}`);
            
        } catch (error) {
            console.error('❌ Failed to generate template:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });

/**
 * Helper function to build configuration from CLI options
 */
async function buildConfig(options: any): Promise<CloudConfig> {
    let config: CloudConfig;
    
    // Load from config file if provided
    if (options.config) {
        const configPath = path.resolve(options.config);
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }
        
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
    } else {
        // Build from CLI options
        config = {
            provider: options.provider as CloudProvider,
            region: options.region,
            environment: options.environment || 'production'
        };
        
        // Add resources configuration
        if (options.computeType || options.computeReplicas || options.database) {
            config.resources = {};
            
            if (options.computeType || options.computeReplicas) {
                config.resources.compute = {
                    instanceType: options.computeType || 'small',
                    replicas: parseInt(options.computeReplicas) || 2
                };
            }
            
            if (options.database) {
                config.resources.database = {
                    type: options.databaseType || 'postgresql',
                    backup: options.backup || false
                };
            }
        }
        
        // Add scaling configuration
        if (options.scaling) {
            config.scaling = {
                enabled: true,
                minInstances: 1,
                maxInstances: 10,
                targetCPU: 70
            };
        }
        
        // Add monitoring configuration
        if (options.monitoring) {
            config.monitoring = {
                enabled: true,
                dashboard: true
            };
        }
    }
    
    return config;
}

// Parse command line arguments
program.parse();