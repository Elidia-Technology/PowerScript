const ts = require('typescript');
const fs = require('fs');
const path = require('path');

// Simple TypeScript compiler and runner
function compileAndRun() {
    try {
        // Read the test file
        const testFile = path.join(__dirname, 'tests/database.test.ts');
        const content = fs.readFileSync(testFile, 'utf8');
        
        // Compile TypeScript to JavaScript
        const result = ts.transpile(content, {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: false
        });
        
        // Write compiled JS to temp file
        const tempFile = path.join(__dirname, 'temp-db-test.js');
        fs.writeFileSync(tempFile, result);
        
        // Run the compiled JavaScript
        console.log('🧪 Running Database Tests...\n');
        require('./temp-db-test.js');
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

compileAndRun();