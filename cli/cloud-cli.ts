/**
 * PowerScript Cloud CLI
 * 
 * Command-line interface for cloud deployment and management
 * 
 * @example
 * ```bash
 * npx ps cloud deploy --provider aws --region us-east-1
 * npx ps cloud status my-deployment
 * npx ps cloud logs my-deployment
 * ```
 */

import { Command } from 'commander';
import { PowerScriptCloud } from '../src/cloud';
import { CloudConfig, CloudProvider } from '../src/cloud/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CloudCLI {
  private cloud: PowerScriptCloud;
  private program: Command;

  constructor() {
    this.cloud = new PowerScriptCloud();
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('ps-cloud')
      .description('PowerScript Cloud Deployment CLI')
      .version('1.0.0');

    // Deploy command
    this.program
      .command('deploy')
      .description('Deploy application to cloud')
      .option('-p, --provider <provider>', 'Cloud provider (aws, gcp, azure, vercel, netlify)', 'aws')
      .option('-r, --region <region>', 'Deployment region', 'us-east-1')
      .option('-e, --environment <env>', 'Environment (development, staging, production)', 'production')
      .option('-c, --config <file>', 'Configuration file path')
      .option('--instance-type <type>', 'Instance type for compute resources', 't3.medium')
      .option('--replicas <count>', 'Number of replicas', '2')
      .option('--database <type>', 'Database type (postgresql, mysql, mongodb)')
      .option('--storage <size>', 'Storage size', '20GB')
      .option('--dry-run', 'Show what would be deployed without actually deploying')
      .action(async (options) => {
        await this.handleDeploy(options);
      });

    // Status command
    this.program
      .command('status <deploymentId>')
      .description('Check deployment status')
      .action(async (deploymentId) => {
        await this.handleStatus(deploymentId);
      });

    // Logs command
    this.program
      .command('logs <deploymentId>')
      .description('Get deployment logs')
      .option('-n, --lines <count>', 'Number of log lines to retrieve', '100')
      .option('-f, --follow', 'Follow log output')
      .action(async (deploymentId, options) => {
        await this.handleLogs(deploymentId, options);
      });

    // List command
    this.program
      .command('list')
      .description('List all deployments')
      .option('-p, --provider <provider>', 'Filter by provider')
      .action(async (options) => {
        await this.handleList(options);
      });

    // Undeploy command
    this.program
      .command('undeploy <deploymentId>')
      .description('Remove deployment')
      .option('--force', 'Force removal without confirmation')
      .action(async (deploymentId, options) => {
        await this.handleUndeploy(deploymentId, options);
      });

    // Cost command
    this.program
      .command('cost')
      .description('Get cost analysis')
      .option('-p, --provider <provider>', 'Provider to analyze')
      .option('--start <date>', 'Start date (YYYY-MM-DD)')
      .option('--end <date>', 'End date (YYYY-MM-DD)')
      .action(async (options) => {
        await this.handleCost(options);
      });

    // Template commands
    const templateCmd = this.program
      .command('template')
      .description('Infrastructure as Code template operations');

    templateCmd
      .command('generate')
      .description('Generate IaC template')
      .option('-p, --provider <provider>', 'Cloud provider', 'aws')
      .option('-o, --output <file>', 'Output file path', 'template.json')
      .option('-c, --config <file>', 'Configuration file path')
      .action(async (options) => {
        await this.handleTemplateGenerate(options);
      });

    templateCmd
      .command('validate <templateFile>')
      .description('Validate IaC template')
      .action(async (templateFile) => {
        await this.handleTemplateValidate(templateFile);
      });

    templateCmd
      .command('deploy <templateFile>')
      .description('Deploy from IaC template')
      .action(async (templateFile) => {
        await this.handleTemplateDeploy(templateFile);
      });

    // Resources command
    this.program
      .command('resources')
      .description('List/manage cloud resources')
      .option('-p, --provider <provider>', 'Filter by provider')
      .action(async (options) => {
        await this.handleResources(options);
      });

    // Init command
    this.program
      .command('init')
      .description('Initialize cloud configuration')
      .option('-p, --provider <provider>', 'Primary cloud provider', 'aws')
      .option('-f, --file <path>', 'Configuration file path', 'cloud.config.json')
      .action(async (options) => {
        await this.handleInit(options);
      });
  }

  private async handleDeploy(options: any): Promise<void> {
    try {
      console.log('🚀 Starting deployment...');

      // Load configuration
      const config = await this.loadConfig(options);

      // Initialize cloud provider
      await this.cloud.initialize();

      if (options.dryRun) {
        console.log('🔍 Dry run - deployment configuration:');
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      // Deploy
      const result = await this.cloud.deploy(config);

      if (result.success) {
        console.log('✅ Deployment successful!');
        console.log(`🔗 URL: ${result.url}`);
        console.log(`📋 Deployment ID: ${result.deploymentId}`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
        
        if (result.endpoints) {
          console.log('🔗 Endpoints:');
          Object.entries(result.endpoints).forEach(([name, url]) => {
            console.log(`  ${name}: ${url}`);
          });
        }

        if (result.cost) {
          console.log(`💰 Estimated cost: $${result.cost.monthly.toFixed(2)}/month`);
        }
      } else {
        console.error('❌ Deployment failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Deployment error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleStatus(deploymentId: string): Promise<void> {
    try {
      await this.cloud.initialize();
      const status = await this.cloud.getDeploymentStatus(deploymentId);

      if (!status) {
        console.log(`❓ Deployment ${deploymentId} not found`);
        return;
      }

      console.log('📊 Deployment Status');
      console.log('═'.repeat(50));
      console.log(`ID: ${status.id}`);
      console.log(`Status: ${this.formatStatus(status.status)}`);
      console.log(`Progress: ${status.progress}%`);
      console.log(`Message: ${status.message}`);
      if (status.url) {
        console.log(`URL: ${status.url}`);
      }
      console.log(`Created: ${status.createdAt}`);
      console.log(`Updated: ${status.updatedAt}`);
      if (status.duration) {
        console.log(`Duration: ${status.duration}ms`);
      }
    } catch (error) {
      console.error('❌ Status check failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleLogs(deploymentId: string, options: any): Promise<void> {
    try {
      await this.cloud.initialize();
      const lines = parseInt(options.lines) || 100;
      const logs = await this.cloud.getLogs(deploymentId, lines);

      console.log(`📝 Logs for deployment ${deploymentId} (last ${lines} lines):`);
      console.log('═'.repeat(60));
      
      if (logs.length === 0) {
        console.log('No logs available');
        return;
      }

      logs.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });

      if (options.follow) {
        console.log('\n👀 Following logs (press Ctrl+C to stop)...');
        // In a real implementation, would implement log following
        setInterval(async () => {
          const newLogs = await this.cloud.getLogs(deploymentId, 10);
          newLogs.forEach(line => console.log(line));
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve logs:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleList(options: any): Promise<void> {
    try {
      await this.cloud.initialize();
      const deployments = await this.cloud.listDeployments(options.provider);

      console.log('📋 Deployments');
      console.log('═'.repeat(80));

      if (deployments.length === 0) {
        console.log('No deployments found');
        return;
      }

      console.log('ID'.padEnd(20) + 'Status'.padEnd(15) + 'URL'.padEnd(30) + 'Created');
      console.log('-'.repeat(80));

      deployments.forEach(deployment => {
        const id = deployment.id.substring(0, 18);
        const status = this.formatStatus(deployment.status);
        const url = (deployment.url || '').substring(0, 28);
        const created = deployment.createdAt.toISOString().split('T')[0];
        
        console.log(id.padEnd(20) + status.padEnd(15) + url.padEnd(30) + created);
      });
    } catch (error) {
      console.error('❌ Failed to list deployments:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleUndeploy(deploymentId: string, options: any): Promise<void> {
    try {
      if (!options.force) {
        const confirm = await this.confirm(`Are you sure you want to undeploy ${deploymentId}?`);
        if (!confirm) {
          console.log('Undeploy cancelled');
          return;
        }
      }

      console.log('🗑️  Removing deployment...');
      await this.cloud.initialize();
      const success = await this.cloud.undeploy(deploymentId);

      if (success) {
        console.log('✅ Deployment removed successfully');
      } else {
        console.log('❌ Failed to remove deployment');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Undeploy failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleCost(options: any): Promise<void> {
    try {
      await this.cloud.initialize();
      
      let timeRange;
      if (options.start && options.end) {
        timeRange = {
          start: new Date(options.start),
          end: new Date(options.end)
        };
      }

      const cost = await this.cloud.getCostAnalysis(options.provider, timeRange);

      console.log('💰 Cost Analysis');
      console.log('═'.repeat(50));
      console.log(`Hourly: $${cost.hourly.toFixed(2)}`);
      console.log(`Monthly: $${cost.monthly.toFixed(2)}`);
      console.log(`Currency: ${cost.currency}`);

      if (cost.breakdown && cost.breakdown.length > 0) {
        console.log('\n📊 Breakdown:');
        cost.breakdown.forEach(item => {
          console.log(`  ${item.component}: $${item.cost.toFixed(2)} (${item.unit})`);
        });
      }
    } catch (error) {
      console.error('❌ Cost analysis failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleTemplateGenerate(options: any): Promise<void> {
    try {
      const config = await this.loadConfig(options);
      await this.cloud.initialize();
      
      const template = await this.cloud.generateIaCTemplate(config);
      
      await fs.writeFile(options.output, template.template, 'utf8');
      console.log(`✅ Template generated: ${options.output}`);
    } catch (error) {
      console.error('❌ Template generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleTemplateValidate(templateFile: string): Promise<void> {
    try {
      const templateContent = await fs.readFile(templateFile, 'utf8');
      const template = {
        provider: 'aws', // Would detect from template
        template: templateContent,
        parameters: {},
        outputs: {}
      };

      await this.cloud.initialize();
      const result = await this.cloud.validateTemplate(template);

      if (result.valid) {
        console.log('✅ Template is valid');
        if (result.estimatedCost) {
          console.log(`💰 Estimated cost: $${result.estimatedCost.monthly.toFixed(2)}/month`);
        }
      } else {
        console.log('❌ Template validation failed');
        result.errors?.forEach(error => {
          console.log(`  Error: ${error.message}`);
        });
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`  ${warning.message}`);
        });
      }
    } catch (error) {
      console.error('❌ Template validation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleTemplateDeploy(templateFile: string): Promise<void> {
    try {
      const templateContent = await fs.readFile(templateFile, 'utf8');
      const template = {
        provider: 'aws' as CloudProvider, // Would detect from template
        template: templateContent,
        parameters: {},
        outputs: {}
      };

      console.log('🚀 Deploying from template...');
      await this.cloud.initialize();
      const result = await this.cloud.deployFromTemplate(template);

      if (result.success) {
        console.log('✅ Template deployment successful!');
        console.log(`📋 Deployment ID: ${result.deploymentId}`);
        console.log(`🔗 URL: ${result.url}`);
      } else {
        console.log('❌ Template deployment failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Template deployment failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleResources(options: any): Promise<void> {
    try {
      await this.cloud.initialize();
      const resources = await this.cloud.listResources(options.provider);

      console.log('📦 Cloud Resources');
      console.log('═'.repeat(80));

      if (resources.length === 0) {
        console.log('No resources found');
        return;
      }

      console.log('ID'.padEnd(20) + 'Name'.padEnd(25) + 'Type'.padEnd(15) + 'Status'.padEnd(10) + 'Region');
      console.log('-'.repeat(80));

      resources.forEach(resource => {
        const id = resource.id.substring(0, 18);
        const name = resource.name.substring(0, 23);
        const type = resource.type.padEnd(13);
        const status = resource.status.padEnd(8);
        const region = resource.region;
        
        console.log(id.padEnd(20) + name.padEnd(25) + type + status + region);
      });
    } catch (error) {
      console.error('❌ Failed to list resources:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async handleInit(options: any): Promise<void> {
    try {
      const configPath = options.file;
      
      // Check if config already exists
      try {
        await fs.access(configPath);
        const overwrite = await this.confirm(`Configuration file ${configPath} already exists. Overwrite?`);
        if (!overwrite) {
          console.log('Init cancelled');
          return;
        }
      } catch {
        // File doesn't exist, proceed
      }

      const config = {
        provider: options.provider,
        region: 'us-east-1',
        environment: 'production',
        resources: {
          compute: {
            instanceType: 't3.medium',
            replicas: 2
          },
          storage: {
            size: '20GB',
            type: 'ssd'
          },
          database: {
            type: 'postgresql',
            size: '20GB',
            backup: true,
            highAvailability: false
          }
        },
        authentication: {
          // Provider-specific auth config would go here
        }
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`✅ Configuration initialized: ${configPath}`);
      console.log('📝 Edit the configuration file and add your credentials before deploying');
    } catch (error) {
      console.error('❌ Init failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async loadConfig(options: any): Promise<CloudConfig> {
    let config: CloudConfig = {
      provider: options.provider as CloudProvider,
      region: options.region,
      environment: options.environment
    };

    // Load from file if specified
    if (options.config) {
      try {
        const fileContent = await fs.readFile(options.config, 'utf8');
        const fileConfig = JSON.parse(fileContent);
        config = { ...fileConfig, ...config }; // CLI options override file
      } catch (error) {
        console.error(`❌ Failed to load config file: ${options.config}`);
        process.exit(1);
      }
    }

    // Add resources from CLI options
    if (options.instanceType || options.replicas) {
      config.resources = config.resources || {};
      config.resources.compute = {
        instanceType: options.instanceType,
        replicas: parseInt(options.replicas) || 2
      };
    }

    if (options.database) {
      config.resources = config.resources || {};
      config.resources.database = {
        type: options.database,
        size: '20GB',
        backup: true
      };
    }

    if (options.storage) {
      config.resources = config.resources || {};
      config.resources.storage = {
        size: options.storage,
        type: 'ssd'
      };
    }

    return config;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'deployed': '✅ Deployed',
      'deploying': '🚀 Deploying',
      'failed': '❌ Failed',
      'rolled-back': '🔄 Rolled Back',
      'pending': '⏳ Pending'
    };
    return statusMap[status] || status;
  }

  private async confirm(message: string): Promise<boolean> {
    // Simple confirmation - in production would use a proper prompt library
    return new Promise((resolve) => {
      process.stdout.write(`${message} (y/N): `);
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        resolve(answer === 'y' || answer === 'yes');
      });
    });
  }

  public async run(args: string[] = process.argv): Promise<void> {
    await this.program.parseAsync(args);
  }
}

// Export for CLI usage
export default CloudCLI;

// If run directly
if (require.main === module) {
  const cli = new CloudCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}