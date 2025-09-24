#!/usr/bin/env node
"use strict";
/**
 * PowerScript CLI
 * Command-line interface for PowerScript development
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
// Simple CLI implementation without external dependencies
class PowerScriptCLI {
    powerscript;
    constructor() {
        this.powerscript = index_1.PowerScript;
    }
    async run(args) {
        const command = args[2];
        switch (command) {
            case 'init':
                await this.init(args[3] || 'my-powerscript-app');
                break;
            case 'version':
            case '--version':
            case '-v':
                this.showVersion();
                break;
            case 'help':
            case '--help':
            case '-h':
            default:
                this.showHelp();
                break;
        }
    }
    async init(projectName) {
        console.log(`🚀 Initializing PowerScript project: ${projectName}`);
        try {
            // Initialize PowerScript
            await this.powerscript.initialize();
            console.log(`✅ PowerScript project "${projectName}" initialized successfully!`);
            console.log('\nNext steps:');
            console.log(`  cd ${projectName}`);
            console.log('  npm start');
        }
        catch (error) {
            console.error('❌ Failed to initialize project:', error);
            process.exit(1);
        }
    }
    showVersion() {
        console.log(`PowerScript v${this.powerscript.version}`);
        console.log(`Runtime: ${this.powerscript.platform.node}`);
        console.log(`Platform: ${this.powerscript.platform.platform}`);
        console.log(`Architecture: ${this.powerscript.platform.arch}`);
    }
    showHelp() {
        console.log(`
PowerScript CLI v${this.powerscript.version}
ActionScript 3 style Node.js development with AI/ML capabilities

Usage:
  powerscript <command> [options]
  ps <command> [options]

Commands:
  init [name]     Initialize a new PowerScript project
  version         Show version information
  help            Show this help message

Examples:
  powerscript init my-app
  powerscript version
  powerscript help

For more information, visit: https://github.com/powerscript/powerscript
    `);
    }
}
// Main execution
async function main() {
    const cli = new PowerScriptCLI();
    await cli.run(process.argv);
}
// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});
// Run CLI if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('CLI Error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=ps.js.map