/**
 * PowerScript Enhanced CLI with AS3 Compilation Support
 * 
 * Provides npx ps compile/run/test commands with auto-compilation features
 * and improved AS3 syntax support.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { AS3Compiler, AS3CompilerOptions } from './AS3Compiler';
import { PowerScript } from '../PowerScript';

export interface CLIOptions {
    input?: string;
    output?: string;
    target?: string;
    module?: string;
    watch?: boolean;
    sourceMaps?: boolean;
    declaration?: boolean;
    strict?: boolean;
    verbose?: boolean;
    as3Mode?: boolean;
    autoCompile?: boolean;
}

export class PowerScriptCLI {
    private program: Command;
    private compiler: AS3Compiler;
    private watchedFiles: Set<string> = new Set();
    private compileQueue: Set<string> = new Set();
    private isCompiling: boolean = false;

    constructor() {
        this.program = new Command();
        this.compiler = new AS3Compiler();
        this.setupCommands();
    }

    private setupCommands(): void {
        this.program
            .name('ps')
            .description('PowerScript CLI - ActionScript 3 to TypeScript/JavaScript compiler')
            .version('1.0.0');

        // Compile command
        this.program
            .command('compile')
            .aliases(['c', 'build'])
            .description('Compile PowerScript files')
            .argument('<input>', 'Input file or directory')
            .option('-o, --output <path>', 'Output directory')
            .option('-t, --target <target>', 'Target ES version', 'es2018')
            .option('-m, --module <module>', 'Module system', 'commonjs')
            .option('-w, --watch', 'Watch for changes and recompile')
            .option('--sourceMaps', 'Generate source maps', true)
            .option('--declaration', 'Generate declaration files', false)
            .option('--strict', 'Enable strict mode', false)
            .option('--as3', 'Enable AS3 compatibility mode', true)
            .option('-v, --verbose', 'Verbose output')
            .action(async (input, options) => {
                await this.handleCompile(input, options);
            });

        // Run command
        this.program
            .command('run')
            .aliases(['r', 'exec'])
            .description('Compile and run PowerScript file')
            .argument('<file>', 'PowerScript file to run')
            .option('--as3', 'Enable AS3 compatibility mode', true)
            .option('--watch', 'Watch for changes and re-run')
            .option('-v, --verbose', 'Verbose output')
            .action(async (file, options) => {
                await this.handleRun(file, options);
            });

        // Test command
        this.program
            .command('test')
            .aliases(['t'])
            .description('Run PowerScript tests')
            .argument('[pattern]', 'Test file pattern', '**/*.test.ps')
            .option('--watch', 'Watch for changes and re-run tests')
            .option('--as3', 'Enable AS3 compatibility mode', true)
            .option('-v, --verbose', 'Verbose output')
            .action(async (pattern, options) => {
                await this.handleTest(pattern, options);
            });

        // New command - create new PowerScript project
        this.program
            .command('new')
            .aliases(['n', 'create'])
            .description('Create a new PowerScript project')
            .argument('<name>', 'Project name')
            .option('--template <template>', 'Project template', 'basic')
            .option('--as3', 'Use AS3 compatibility template', true)
            .action(async (name, options) => {
                await this.handleNew(name, options);
            });

        // Init command - initialize PowerScript in existing project
        this.program
            .command('init')
            .aliases(['i'])
            .description('Initialize PowerScript in current directory')
            .option('--as3', 'Enable AS3 compatibility mode', true)
            .action(async (options) => {
                await this.handleInit(options);
            });

        // Validate command - check AS3 syntax
        this.program
            .command('validate')
            .aliases(['v', 'check'])
            .description('Validate PowerScript/AS3 syntax')
            .argument('<input>', 'File or directory to validate')
            .option('--as3', 'Enable AS3 validation', true)
            .action(async (input, options) => {
                await this.handleValidate(input, options);
            });
    }

    /**
     * Handle compile command
     */
    private async handleCompile(input: string, options: CLIOptions): Promise<void> {
        try {
            console.log(`🔧 Compiling PowerScript: ${input}`);
            
            const compilerOptions: AS3CompilerOptions = {
                target: options.target as any || 'es2018',
                module: options.module as any || 'commonjs',
                sourceMaps: options.sourceMaps !== false,
                declaration: options.declaration === true,
                strict: options.strict === true,
                enableAS3Utilities: options.as3Mode !== false,
                outDir: options.output
            };

            this.compiler = new AS3Compiler(compilerOptions);

            if (options.watch) {
                await this.startWatchMode(input, compilerOptions);
            } else {
                await this.compileSingle(input, compilerOptions);
            }

        } catch (error) {
            console.error('❌ Compilation failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }

    /**
     * Handle run command
     */
    private async handleRun(file: string, options: CLIOptions): Promise<void> {
        try {
            console.log(`🚀 Running PowerScript: ${file}`);

            // First compile the file
            const compilerOptions: AS3CompilerOptions = {
                target: 'es2018',
                module: 'commonjs',
                enableAS3Utilities: true
            };

            const source = fs.readFileSync(file, 'utf-8');
            const result = await this.compiler.compileAS3(source, file);

            if (!result.success) {
                console.error('❌ Compilation failed:');
                result.errors.forEach(error => console.error(`  ${error}`));
                return;
            }

            // Write compiled output to temp file
            const tempDir = path.join(process.cwd(), '.ps-temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFile = path.join(tempDir, path.basename(file, '.ps') + '.js');
            fs.writeFileSync(tempFile, result.output!);

            // Run the compiled file
            if (options.watch) {
                await this.startRunWatchMode(file, tempFile, compilerOptions);
            } else {
                this.executeFile(tempFile);
            }

        } catch (error) {
            console.error('❌ Execution failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }

    /**
     * Handle test command
     */
    private async handleTest(pattern: string, options: CLIOptions): Promise<void> {
        try {
            console.log(`🧪 Running PowerScript tests: ${pattern}`);

            const testFiles = this.findFiles(pattern);
            if (testFiles.length === 0) {
                console.log('📝 No test files found');
                return;
            }

            const compilerOptions: AS3CompilerOptions = {
                target: 'es2018',
                module: 'commonjs',
                enableAS3Utilities: true
            };

            for (const testFile of testFiles) {
                console.log(`  Running: ${testFile}`);
                
                const source = fs.readFileSync(testFile, 'utf-8');
                const result = await this.compiler.compileAS3(source, testFile);

                if (!result.success) {
                    console.error(`❌ Test compilation failed: ${testFile}`);
                    result.errors.forEach(error => console.error(`  ${error}`));
                    continue;
                }

                // Execute test
                const tempFile = path.join('.ps-temp', path.basename(testFile, '.ps') + '.test.js');
                fs.writeFileSync(tempFile, result.output!);
                this.executeFile(tempFile);
            }

        } catch (error) {
            console.error('❌ Test execution failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }

    /**
     * Handle new project command
     */
    private async handleNew(name: string, options: any): Promise<void> {
        try {
            console.log(`📦 Creating new PowerScript project: ${name}`);

            const projectDir = path.join(process.cwd(), name);
            if (fs.existsSync(projectDir)) {
                console.error(`❌ Directory ${name} already exists`);
                return;
            }

            fs.mkdirSync(projectDir, { recursive: true });

            // Create project structure
            this.createProjectStructure(projectDir, options);

            console.log(`✅ Created PowerScript project: ${name}`);
            console.log(`📂 Next steps:`);
            console.log(`   cd ${name}`);
            console.log(`   npx ps compile src/Main.ps`);
            console.log(`   npx ps run src/Main.ps`);

        } catch (error) {
            console.error('❌ Project creation failed:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handle init command
     */
    private async handleInit(options: any): Promise<void> {
        try {
            console.log('🔧 Initializing PowerScript project...');

            // Create basic project files
            this.createPackageJson();
            this.createTSConfig();
            this.createPowerScriptConfig();

            if (!fs.existsSync('src')) {
                fs.mkdirSync('src');
                this.createSampleFile();
            }

            console.log('✅ PowerScript project initialized!');
            console.log('📂 Created files:');
            console.log('   package.json');
            console.log('   tsconfig.json');
            console.log('   powerscript.config.json');
            console.log('   src/Main.ps (sample)');

        } catch (error) {
            console.error('❌ Initialization failed:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Handle validate command
     */
    private async handleValidate(input: string, options: CLIOptions): Promise<void> {
        try {
            console.log(`🔍 Validating PowerScript: ${input}`);

            const files = this.findPowerScriptFiles(input);
            let totalErrors = 0;
            let totalWarnings = 0;

            for (const file of files) {
                const source = fs.readFileSync(file, 'utf-8');
                const validation = this.compiler.validateAS3Syntax(source);

                console.log(`\n📄 ${file}:`);
                
                if (validation.isValid) {
                    console.log('  ✅ Valid syntax');
                } else {
                    console.log('  ❌ Syntax errors found:');
                    validation.errors.forEach(error => {
                        console.log(`    ${error}`);
                        totalErrors++;
                    });
                }

                if (validation.warnings.length > 0) {
                    console.log('  ⚠️  Warnings:');
                    validation.warnings.forEach(warning => {
                        console.log(`    ${warning}`);
                        totalWarnings++;
                    });
                }

                // Show suggestions
                const suggestions = this.compiler.getAS3Suggestions(source);
                if (suggestions.length > 0) {
                    console.log('  💡 Suggestions:');
                    suggestions.forEach(suggestion => {
                        console.log(`    ${suggestion}`);
                    });
                }
            }

            console.log(`\n📊 Validation Summary:`);
            console.log(`   Files: ${files.length}`);
            console.log(`   Errors: ${totalErrors}`);
            console.log(`   Warnings: ${totalWarnings}`);

            if (totalErrors > 0) {
                process.exit(1);
            }

        } catch (error) {
            console.error('❌ Validation failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }

    /**
     * Start watch mode for compilation
     */
    private async startWatchMode(input: string, options: AS3CompilerOptions): Promise<void> {
        console.log('👀 Watch mode started. Press Ctrl+C to stop.');

        const files = this.findPowerScriptFiles(input);
        
        // Initial compilation
        await this.compileSingle(input, options);

        // Setup file watching
        const chokidar = require('chokidar');
        const watcher = chokidar.watch(files, { ignored: /^\./, persistent: true });

        watcher.on('change', async (file: string) => {
            console.log(`📝 File changed: ${file}`);
            await this.compileFile(file, options);
        });

        // Keep process alive
        process.on('SIGINT', () => {
            console.log('\n👋 Stopping watch mode...');
            watcher.close();
            process.exit(0);
        });
    }

    /**
     * Start watch mode for run command
     */
    private async startRunWatchMode(sourceFile: string, compiledFile: string, options: AS3CompilerOptions): Promise<void> {
        console.log('👀 Run watch mode started. Press Ctrl+C to stop.');

        let childProcess: child_process.ChildProcess | null = null;

        const runFile = () => {
            if (childProcess) {
                childProcess.kill();
            }
            childProcess = this.executeFile(compiledFile, false);
        };

        const chokidar = require('chokidar');
        const watcher = chokidar.watch(sourceFile, { ignored: /^\./, persistent: true });

        watcher.on('change', async () => {
            console.log(`📝 File changed: ${sourceFile}`);
            
            const source = fs.readFileSync(sourceFile, 'utf-8');
            const result = await this.compiler.compileAS3(source, sourceFile);

            if (result.success) {
                fs.writeFileSync(compiledFile, result.output!);
                console.log('🔄 Restarting...');
                runFile();
            } else {
                console.error('❌ Compilation failed:');
                result.errors.forEach(error => console.error(`  ${error}`));
            }
        });

        // Initial run
        runFile();

        process.on('SIGINT', () => {
            console.log('\n👋 Stopping run watch mode...');
            if (childProcess) {
                childProcess.kill();
            }
            watcher.close();
            process.exit(0);
        });
    }

    /**
     * Compile a single file or directory
     */
    private async compileSingle(input: string, options: AS3CompilerOptions): Promise<void> {
        const files = this.findPowerScriptFiles(input);
        
        console.log(`📝 Found ${files.length} file(s) to compile`);

        for (const file of files) {
            await this.compileFile(file, options);
        }
    }

    /**
     * Compile a single file
     */
    private async compileFile(filePath: string, options: AS3CompilerOptions): Promise<void> {
        try {
            const source = fs.readFileSync(filePath, 'utf-8');
            const result = await this.compiler.compileAS3(source, filePath);

            if (result.success) {
                const outputPath = this.getOutputPath(filePath, options.outDir || 'dist');
                
                // Ensure output directory exists
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                
                // Write compiled output
                fs.writeFileSync(outputPath, result.output!);
                
                // Write source map if enabled
                if (result.sourceMap && options.sourceMaps) {
                    fs.writeFileSync(outputPath + '.map', result.sourceMap);
                }
                
                // Write declarations if enabled
                if (result.declarations && options.declaration) {
                    const declarationPath = outputPath.replace('.js', '.d.ts');
                    fs.writeFileSync(declarationPath, result.declarations);
                }

                console.log(`✅ Compiled: ${filePath} → ${outputPath}`);
            } else {
                console.error(`❌ Failed to compile: ${filePath}`);
                result.errors.forEach(error => console.error(`  ${error}`));
            }

        } catch (error) {
            console.error(`❌ Error compiling ${filePath}:`, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Execute a JavaScript file
     */
    private executeFile(filePath: string, wait: boolean = true): child_process.ChildProcess {
        const child = child_process.spawn('node', [filePath], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        if (wait) {
            child.on('exit', (code) => {
                if (code !== 0) {
                    process.exit(code || 1);
                }
            });
        }

        return child;
    }

    /**
     * Find PowerScript files
     */
    private findPowerScriptFiles(input: string): string[] {
        if (fs.statSync(input).isFile()) {
            return [input];
        }

        return this.findFiles('**/*.ps', input);
    }

    /**
     * Find files by pattern
     */
    private findFiles(pattern: string, baseDir: string = process.cwd()): string[] {
        const glob = require('glob');
        return glob.sync(pattern, { cwd: baseDir, absolute: true });
    }

    /**
     * Get output path for compiled file
     */
    private getOutputPath(inputPath: string, outputDir: string): string {
        const relativePath = path.relative(process.cwd(), inputPath);
        const outputPath = path.join(outputDir, relativePath.replace('.ps', '.js'));
        return outputPath;
    }

    /**
     * Create project structure
     */
    private createProjectStructure(projectDir: string, options: any): void {
        // Create directories
        fs.mkdirSync(path.join(projectDir, 'src'));
        fs.mkdirSync(path.join(projectDir, 'dist'));
        fs.mkdirSync(path.join(projectDir, 'tests'));

        // Create package.json
        const packageJson = {
            name: path.basename(projectDir),
            version: '1.0.0',
            description: 'PowerScript project',
            main: 'dist/Main.js',
            scripts: {
                build: 'npx ps compile src',
                start: 'npx ps run src/Main.ps',
                test: 'npx ps test',
                dev: 'npx ps run src/Main.ps --watch'
            },
            dependencies: {},
            devDependencies: {
                '@types/node': '^20.0.0'
            }
        };

        fs.writeFileSync(
            path.join(projectDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // Create main file
        const mainContent = `package ${path.basename(projectDir)} {
    import { trace } from 'powerscript';

    public class Main {
        public static function main(): void {
            trace("Hello from PowerScript!");
        }
    }
}

Main.main();
`;

        fs.writeFileSync(path.join(projectDir, 'src', 'Main.ps'), mainContent);

        // Create test file
        const testContent = `package ${path.basename(projectDir)}.tests {
    import { trace } from 'powerscript';

    public class MainTest {
        public static function testMain(): void {
            trace("Running tests...");
            // Add your tests here
            trace("All tests passed!");
        }
    }
}

MainTest.testMain();
`;

        fs.writeFileSync(path.join(projectDir, 'tests', 'Main.test.ps'), testContent);

        // Create config files
        this.createTSConfigInDir(projectDir);
        this.createPowerScriptConfigInDir(projectDir);
    }

    private createPackageJson(): void {
        if (fs.existsSync('package.json')) return;

        const packageJson = {
            name: path.basename(process.cwd()),
            version: '1.0.0',
            description: 'PowerScript project',
            main: 'dist/index.js',
            scripts: {
                build: 'npx ps compile src',
                start: 'node dist/index.js',
                dev: 'npx ps run src/Main.ps --watch',
                test: 'npx ps test'
            },
            dependencies: {},
            devDependencies: {
                '@types/node': '^20.0.0'
            }
        };

        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    }

    private createTSConfig(): void {
        this.createTSConfigInDir(process.cwd());
    }

    private createTSConfigInDir(dir: string): void {
        const tsconfig = {
            compilerOptions: {
                target: 'ES2018',
                module: 'commonjs',
                outDir: './dist',
                rootDir: './src',
                strict: false,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                declaration: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', 'tests']
        };

        fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
    }

    private createPowerScriptConfig(): void {
        this.createPowerScriptConfigInDir(process.cwd());
    }

    private createPowerScriptConfigInDir(dir: string): void {
        const config = {
            compilerOptions: {
                target: 'es2018',
                module: 'commonjs',
                enableAS3Utilities: true,
                sourceMaps: true,
                declaration: true,
                strict: false
            },
            include: ['src/**/*.ps'],
            exclude: ['node_modules', 'dist']
        };

        fs.writeFileSync(path.join(dir, 'powerscript.config.json'), JSON.stringify(config, null, 2));
    }

    private createSampleFile(): void {
        const content = `package main {
    import { trace } from 'powerscript';

    public class Main {
        public static function main(): void {
            trace("Hello from PowerScript!");
        }
    }
}

Main.main();
`;

        fs.writeFileSync('src/Main.ps', content);
    }

    /**
     * Run the CLI
     */
    public async run(argv?: string[]): Promise<void> {
        await this.program.parseAsync(argv);
    }
}

// Export CLI
export default PowerScriptCLI;