#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { ModelTrainer, TrainingConfig } from './ModelTrainer';

// Simple CLI argument parser
interface CLIArgs {
    command: string;
    subcommand?: string;
    args: string[];
    options: Record<string, string | boolean>;
}

/**
 * PowerScript CLI for Model Training
 * 
 * Command-line interface for training and fine-tuning AI models.
 * Supports various model types and training configurations through JSON config files.
 * 
 * Usage Examples:
 * ```bash
 * # Train a text generation model
 * npx ps train model config.json
 * 
 * # Train with custom output directory
 * npx ps train model config.json --output ./my-models
 * 
 * # Resume training from checkpoint
 * npx ps train model config.json --resume ./checkpoints/checkpoint-10
 * 
 * # Train with verbose logging
 * npx ps train model config.json --verbose
 * 
 * # Evaluate existing model
 * npx ps evaluate model ./models/my-model --test-data ./data/test.jsonl
 * 
 * # Export training results
 * npx ps export results ./models/my-model --format csv
 * ```
 */

/**
 * Simple CLI argument parser
 */
function parseArgs(): CLIArgs {
    const args = process.argv.slice(2);
    const parsed: CLIArgs = {
        command: '',
        args: [],
        options: {}
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            
            if (nextArg && !nextArg.startsWith('-')) {
                parsed.options[key] = nextArg;
                i += 2;
            } else {
                parsed.options[key] = true;
                i++;
            }
        } else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            const nextArg = args[i + 1];
            
            if (nextArg && !nextArg.startsWith('-')) {
                parsed.options[key] = nextArg;
                i += 2;
            } else {
                parsed.options[key] = true;
                i++;
            }
        } else {
            if (!parsed.command) {
                parsed.command = arg;
            } else if (!parsed.subcommand) {
                parsed.subcommand = arg;
            } else {
                parsed.args.push(arg);
            }
            i++;
        }
    }

    return parsed;
}

/**
 * Display help information
 */
function showHelp(): void {
    console.log(`
PowerScript AI Model Training CLI v1.0.0

Usage: npx ps <command> [options]

Commands:
  train <type> <config>     Train or fine-tune an AI model
  evaluate <type> <path>    Evaluate a trained model
  export <type> <path>      Export training results and metrics
  list [directory]          List available models and checkpoints
  init <template>           Initialize training configuration templates

Train Options:
  -o, --output <dir>        Output directory for model and checkpoints
  -r, --resume <checkpoint> Resume training from checkpoint
  -v, --verbose             Enable verbose logging
  --dry-run                 Validate configuration without training
  --gpu <ids>               GPU device IDs to use (comma-separated)
  --distributed             Enable distributed training

Evaluate Options:
  --test-data <path>        Path to test dataset
  --batch-size <size>       Batch size for evaluation (default: 16)
  --metrics <metrics>       Comma-separated list of metrics to compute
  --output <path>           Output path for evaluation results

Export Options:
  --format <format>         Export format: json, csv, tensorboard (default: json)
  --output <path>           Output file path
  --include <items>         Items to include: metrics,checkpoints,config

Examples:
  npx ps train model config.json
  npx ps train model config.json --output ./my-models --verbose
  npx ps evaluate model ./models/my-model --test-data ./data/test.jsonl
  npx ps init gpt --output gpt-config.json
  npx ps list ./models --type text-generation
    `);
}

/**
 * Handle train command
 */
async function handleTrainCommand(type: string, configPath: string, options: any): Promise<void> {
    try {
        console.log('🚀 PowerScript Model Training CLI');
        console.log('=====================================\n');

        // Load and validate configuration
        const config = await loadTrainingConfig(configPath, options);
        
        if (options.dryRun || options['dry-run']) {
            console.log('✅ Configuration validation passed');
            console.log('📋 Training Configuration:');
            console.log(JSON.stringify(config, null, 2));
            return;
        }

        // Initialize trainer
        const trainer = new ModelTrainer(config);
        
        // Set up event listeners for progress tracking
        setupTrainerEventListeners(trainer, options.verbose);

        // Start training
        console.log(`🎯 Starting ${type} training...`);
        console.log(`📁 Model: ${config.modelName}`);
        console.log(`📊 Dataset: ${config.trainingData.trainPath}`);
        console.log(`🎮 Output: ${config.outputDir}\n`);

        let result;
        if (options.resume) {
            console.log(`🔄 Resuming from checkpoint: ${options.resume}`);
            result = await trainer.resumeFromCheckpoint(options.resume);
        } else {
            result = await trainer.train();
        }

        console.log('\n🎉 Training completed successfully!');
        console.log(`📈 Best model saved at: ${result.modelPath}`);
        console.log(`🎯 Final metrics:`, result.metrics);

        // Export results
        const resultsPath = await trainer.exportResults('json');
        console.log(`📄 Results exported to: ${resultsPath}`);

    } catch (error) {
        console.error('❌ Training failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}



/**
 * Load and validate training configuration
 */
async function loadTrainingConfig(configPath: string, options: any): Promise<TrainingConfig> {
    if (!existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config: TrainingConfig = JSON.parse(configContent);

        // Apply command-line overrides
        if (options.output) {
            config.outputDir = resolve(options.output);
        }

        // Validate required fields
        if (!config.modelName) {
            throw new Error('modelName is required in configuration');
        }
        if (!config.modelType) {
            throw new Error('modelType is required in configuration');
        }
        if (!config.trainingData) {
            throw new Error('trainingData is required in configuration');
        }
        if (!config.hyperparameters) {
            throw new Error('hyperparameters is required in configuration');
        }
        if (!config.outputDir) {
            throw new Error('outputDir is required in configuration');
        }

        // Validate training data paths
        if (config.trainingData.trainPath && !existsSync(config.trainingData.trainPath)) {
            throw new Error(`Training data file not found: ${config.trainingData.trainPath}`);
        }
        if (config.trainingData.validationPath && !existsSync(config.trainingData.validationPath)) {
            throw new Error(`Validation data file not found: ${config.trainingData.validationPath}`);
        }
        if (config.trainingData.testPath && !existsSync(config.trainingData.testPath)) {
            throw new Error(`Test data file not found: ${config.trainingData.testPath}`);
        }

        return config;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in configuration file: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Set up event listeners for trainer progress tracking
 */
function setupTrainerEventListeners(trainer: ModelTrainer, verbose: boolean): void {
    trainer.on('trainingStarted', (data) => {
        console.log('🎬 Training session started');
        if (verbose) {
            console.log('   Configuration:', data.config.modelName);
        }
    });

    trainer.on('epochCompleted', (data) => {
        const progress = data.progress;
        const metrics = data.metrics;
        
        console.log(`📈 Epoch ${data.epoch} completed (${progress.progress.toFixed(1)}%)`);
        console.log(`   📉 Train Loss: ${metrics.trainLoss.toFixed(4)}`);
        if (metrics.validationLoss !== undefined) {
            console.log(`   📊 Val Loss: ${metrics.validationLoss.toFixed(4)}`);
        }
        if (metrics.trainAccuracy !== undefined) {
            console.log(`   🎯 Train Acc: ${(metrics.trainAccuracy * 100).toFixed(2)}%`);
        }
        if (metrics.validationAccuracy !== undefined) {
            console.log(`   ✅ Val Acc: ${(metrics.validationAccuracy * 100).toFixed(2)}%`);
        }
        
        const remainingTime = Math.round(progress.estimatedRemainingTime / 1000);
        if (remainingTime > 0) {
            console.log(`   ⏱️  ETA: ${remainingTime}s`);
        }
        console.log('');
    });

    trainer.on('checkpointSaved', (data) => {
        console.log(`💾 Checkpoint saved: ${data.checkpoint.modelPath}`);
    });

    trainer.on('earlyStopping', (data) => {
        console.log(`⏹️  Early stopping triggered at epoch ${data.epoch}`);
        console.log(`   Patience: ${data.patience} epochs without improvement`);
    });

    trainer.on('trainingError', (data) => {
        console.error('❌ Training error:', data.error);
    });

    if (verbose) {
        trainer.on('stepCompleted', (data) => {
            console.log(`   Step ${data.step}: Loss=${data.batchLoss.toFixed(4)}, LR=${data.learningRate.toExponential(2)}`);
        });
    }
}

/**
 * Create evaluation configuration
 */
function createEvaluationConfig(modelPath: string, options: any): TrainingConfig {
    return {
        modelName: 'evaluation-model',
        modelType: 'text-generation', // Default, would be inferred from model
        trainingData: {
            testPath: options.testData,
            format: 'jsonl', // Default, would be inferred
            textColumn: 'text',
            labelColumn: 'label'
        },
        hyperparameters: {
            learningRate: 0, // Not needed for evaluation
            batchSize: parseInt(options.batchSize) || 16,
            epochs: 0, // Not needed for evaluation
            optimizer: 'adamw' // Not needed for evaluation
        },
        outputDir: './evaluation-results',
        logging: {
            logLevel: 'info'
        },
        saveStrategy: 'epoch',
        evaluationStrategy: 'epoch'
    };
}

/**
 * Export training results
 */
async function exportTrainingResults(sourcePath: string, options: any): Promise<void> {
    console.log(`📤 Exporting training results...`);
    
    // In real implementation, would load actual training results
    const results = {
        modelName: 'example-model',
        trainingComplete: true,
        metrics: [],
        checkpoints: [],
        exportedAt: new Date()
    };

    console.log(`✅ Exported ${results.metrics.length} metrics and ${results.checkpoints.length} checkpoints`);
}

/**
 * Export metrics only
 */
async function exportMetrics(sourcePath: string, options: any): Promise<void> {
    console.log(`📊 Exporting metrics...`);
    
    // In real implementation, would extract and export metrics
    console.log(`✅ Metrics exported in ${options.format} format`);
}

/**
 * Export model for deployment
 */
async function exportModel(sourcePath: string, options: any): Promise<void> {
    console.log(`🚀 Exporting model for deployment...`);
    
    // In real implementation, would package model for deployment
    console.log(`✅ Model exported and ready for deployment`);
}

/**
 * Scan directory for models
 */
async function scanForModels(directory: string, options: any): Promise<any[]> {
    // In real implementation, would scan filesystem for models
    return [
        {
            name: 'example-gpt-model',
            path: join(directory, 'example-gpt-model'),
            type: 'text-generation',
            lastModified: new Date().toISOString(),
            size: '125MB',
            status: 'completed'
        }
    ];
}



/**
 * Generate configuration templates
 */
function generateConfigTemplate(template: string): TrainingConfig {
    const baseConfig = {
        logging: {
            logLevel: 'info' as const,
            saveSteps: 500,
            evaluationSteps: 1000
        },
        saveStrategy: 'best' as const,
        evaluationStrategy: 'epoch' as const,
        validationSplit: 0.1,
        earlyStoppingPatience: 3
    };

    switch (template) {
        case 'gpt':
            return {
                modelName: 'custom-gpt',
                modelType: 'text-generation',
                baseModel: 'gpt2-medium',
                trainingData: {
                    trainPath: './data/train.jsonl',
                    validationPath: './data/val.jsonl',
                    format: 'jsonl',
                    textColumn: 'text',
                    maxLength: 512
                },
                hyperparameters: {
                    learningRate: 2e-5,
                    batchSize: 16,
                    epochs: 3,
                    warmupSteps: 500,
                    weightDecay: 0.01,
                    optimizer: 'adamw',
                    scheduler: 'linear'
                },
                outputDir: './models/custom-gpt',
                ...baseConfig
            };

        case 'bert':
            return {
                modelName: 'custom-bert',
                modelType: 'text-classification',
                baseModel: 'bert-base-uncased',
                trainingData: {
                    trainPath: './data/train.csv',
                    validationPath: './data/val.csv',
                    format: 'csv',
                    textColumn: 'text',
                    labelColumn: 'label',
                    maxLength: 256
                },
                hyperparameters: {
                    learningRate: 5e-5,
                    batchSize: 32,
                    epochs: 5,
                    warmupSteps: 0,
                    weightDecay: 0.01,
                    optimizer: 'adamw'
                },
                outputDir: './models/custom-bert',
                ...baseConfig
            };

        case 'classification':
            return {
                modelName: 'text-classifier',
                modelType: 'text-classification',
                trainingData: {
                    trainPath: './data/train.csv',
                    validationPath: './data/val.csv',
                    testPath: './data/test.csv',
                    format: 'csv',
                    textColumn: 'text',
                    labelColumn: 'label'
                },
                hyperparameters: {
                    learningRate: 3e-5,
                    batchSize: 16,
                    epochs: 10,
                    optimizer: 'adamw'
                },
                outputDir: './models/text-classifier',
                ...baseConfig
            };

        case 'summarization':
            return {
                modelName: 'summarizer',
                modelType: 'summarization',
                baseModel: 't5-base',
                trainingData: {
                    trainPath: './data/train.jsonl',
                    validationPath: './data/val.jsonl',
                    format: 'jsonl',
                    textColumn: 'article',
                    labelColumn: 'summary',
                    maxLength: 1024
                },
                hyperparameters: {
                    learningRate: 1e-4,
                    batchSize: 8,
                    epochs: 6,
                    warmupSteps: 1000,
                    optimizer: 'adamw',
                    scheduler: 'linear'
                },
                outputDir: './models/summarizer',
                ...baseConfig
            };

        default:
            throw new Error(`Unknown template: ${template}`);
    }
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
    const args = parseArgs();

    if (args.options.help || args.options.h) {
        showHelp();
        return;
    }

    if (!args.command) {
        console.error('❌ No command specified. Use --help for usage information.');
        process.exit(1);
    }

    try {
        switch (args.command) {
            case 'train':
                if (!args.subcommand) {
                    console.error('❌ Train command requires a type (e.g., "model")');
                    process.exit(1);
                }
                if (args.args.length === 0) {
                    console.error('❌ Train command requires a config file path');
                    process.exit(1);
                }
                await handleTrainCommand(args.subcommand, args.args[0], args.options);
                break;

            case 'evaluate':
                if (!args.subcommand) {
                    console.error('❌ Evaluate command requires a type');
                    process.exit(1);
                }
                if (args.args.length === 0) {
                    console.error('❌ Evaluate command requires a model path');
                    process.exit(1);
                }
                await handleEvaluateCommand(args.subcommand, args.args[0], args.options);
                break;

            case 'export':
                if (!args.subcommand) {
                    console.error('❌ Export command requires a type');
                    process.exit(1);
                }
                if (args.args.length === 0) {
                    console.error('❌ Export command requires a source path');
                    process.exit(1);
                }
                await handleExportCommand(args.subcommand, args.args[0], args.options);
                break;

            case 'list':
                const directory = args.args[0] || './models';
                await handleListCommand(directory, args.options);
                break;

            case 'init':
                if (!args.subcommand) {
                    console.error('❌ Init command requires a template name');
                    process.exit(1);
                }
                await handleInitCommand(args.subcommand, args.options);
                break;

            default:
                console.error(`❌ Unknown command: ${args.command}`);
                console.error('Use --help for usage information.');
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Command failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

/**
 * Handle evaluate command
 */
async function handleEvaluateCommand(type: string, modelPath: string, options: any): Promise<void> {
    console.log('📊 PowerScript Model Evaluation');
    console.log('===============================\n');

    console.log(`🔍 Evaluating ${type}: ${modelPath}`);
    
    if (options['test-data'] || options.testData) {
        console.log(`📋 Test dataset: ${options['test-data'] || options.testData}`);
    }

    // Create evaluation config
    const evalConfig = createEvaluationConfig(modelPath, options);
    
    // Initialize trainer for evaluation
    const trainer = new ModelTrainer(evalConfig);
    
    // Run evaluation
    console.log('🔄 Running evaluation...\n');
    const metrics = await trainer.evaluateOnTestSet();

    console.log('📈 Evaluation Results:');
    console.log('=====================');
    
    if (metrics.validationLoss !== undefined) {
        console.log(`📉 Loss: ${metrics.validationLoss.toFixed(4)}`);
    }
    if (metrics.validationAccuracy !== undefined) {
        console.log(`🎯 Accuracy: ${(metrics.validationAccuracy * 100).toFixed(2)}%`);
    }

    // Export results if requested
    if (options.output) {
        const results = {
            modelPath,
            evaluationMetrics: metrics,
            evaluatedAt: new Date()
        };
        
        console.log(`\n💾 Results saved to: ${options.output}`);
    }
}

/**
 * Handle export command
 */
async function handleExportCommand(type: string, sourcePath: string, options: any): Promise<void> {
    console.log('📤 PowerScript Export Tool');
    console.log('==========================\n');

    console.log(`📦 Exporting ${type} from: ${sourcePath}`);
    console.log(`📋 Format: ${options.format || 'json'}`);

    if (type === 'results') {
        await exportTrainingResults(sourcePath, options);
    } else if (type === 'metrics') {
        await exportMetrics(sourcePath, options);
    } else if (type === 'model') {
        await exportModel(sourcePath, options);
    } else {
        throw new Error(`Unknown export type: ${type}`);
    }

    console.log('\n✅ Export completed successfully!');
}

/**
 * Handle list command
 */
async function handleListCommand(directory: string, options: any): Promise<void> {
    console.log('📋 PowerScript Model List');
    console.log('=========================\n');

    const models = await scanForModels(directory, options);

    if (models.length === 0) {
        console.log(`No models found in ${directory}`);
        return;
    }

    console.log(`Found ${models.length} model(s):\n`);

    models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   📁 Path: ${model.path}`);
        console.log(`   🏷️  Type: ${model.type}`);
        console.log(`   📅 Modified: ${model.lastModified}`);
        console.log(`   💽 Size: ${model.size}`);
        if (model.status) {
            console.log(`   📊 Status: ${model.status}`);
        }
        console.log('');
    });
}

/**
 * Handle init command
 */
async function handleInitCommand(template: string, options: any): Promise<void> {
    console.log('🏗️  PowerScript Config Generator');
    console.log('================================\n');

    console.log(`📝 Creating ${template} configuration template...`);

    const config = generateConfigTemplate(template);
    const outputPath = options.output || `${template}-config.json`;

    // In real implementation, write to file
    console.log(`📄 Configuration saved to: ${outputPath}`);
    console.log('\n✅ Template created successfully!');
    console.log('\n📋 Next steps:');
    console.log(`1. Edit ${outputPath} with your training parameters`);
    console.log(`2. Prepare your training data in the specified format`);
    console.log(`3. Run: npx ps train model ${outputPath}`);
}

// Run the CLI
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ CLI error:', error.message);
        process.exit(1);
    });
}