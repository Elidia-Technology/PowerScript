#!/usr/bin/env node
"use strict";
/**
 * EIPS Build System - PowerScript to Production Pipeline
 *
 * Converts PowerScript (.ts) → TypeScript → Compressed JS → HTML
 * Usage: eips build <input.ts> --output <dir> --compress --html
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIPSBuilder = void 0;
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
const terser_1 = require("terser");
class EIPSBuilder {
    constructor(options) {
        this.options = options;
    }
    async build() {
        console.log('🚀 EIPS Build System Starting...');
        console.log(`📂 Input: ${this.options.input}`);
        console.log(`📦 Output: ${this.options.output}`);
        try {
            // Step 1: Prepare output directory
            this.prepareOutputDir();
            // Step 2: Compile TypeScript
            console.log('🔧 Compiling TypeScript...');
            const jsContent = await this.compileTypeScript();
            // Step 3: Compress JavaScript (if enabled)
            console.log(`📦 ${this.options.compress ? 'Compressing' : 'Processing'} JavaScript...`);
            const finalJS = this.options.compress ? await this.compressJS(jsContent) : jsContent;
            // Step 4: Write JavaScript file
            const jsPath = path.join(this.options.output, 'game.js');
            fs.writeFileSync(jsPath, finalJS);
            console.log(`✅ JavaScript: ${jsPath}`);
            // Step 5: Generate HTML (if enabled)
            if (this.options.html) {
                console.log('🌐 Generating HTML wrapper...');
                const gameInfo = this.extractGameInfo();
                const htmlContent = this.generateHTML(gameInfo);
                const htmlPath = path.join(this.options.output, 'index.html');
                fs.writeFileSync(htmlPath, htmlContent);
                console.log(`✅ HTML: ${htmlPath}`);
            }
            // Step 6: Copy assets (if any)
            this.copyAssets();
            console.log('🎉 Build Complete!');
            console.log(`📁 Output Directory: ${path.resolve(this.options.output)}`);
            // Step 7: Serve (if enabled)
            if (this.options.serve) {
                this.startDevServer();
            }
        }
        catch (error) {
            console.error('❌ Build Failed:', error);
            process.exit(1);
        }
    }
    prepareOutputDir() {
        if (!fs.existsSync(this.options.output)) {
            fs.mkdirSync(this.options.output, { recursive: true });
        }
    }
    async compileTypeScript() {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempOutput = path.join(tempDir, 'compiled.js');
        try {
            // Use TypeScript compiler with proper configuration
            const tscCommand = `npx tsc "${this.options.input}" --target ES2020 --module ES2020 --outFile "${tempOutput}" --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports --moduleResolution node`;
            (0, child_process_1.execSync)(tscCommand, { stdio: 'pipe' });
            const jsContent = fs.readFileSync(tempOutput, 'utf-8');
            // Clean up temp file
            if (fs.existsSync(tempOutput)) {
                fs.unlinkSync(tempOutput);
            }
            return this.wrapForBrowser(jsContent);
        }
        catch (error) {
            throw new Error(`TypeScript compilation failed: ${error}`);
        }
    }
    wrapForBrowser(jsContent) {
        // Wrap the compiled JS for browser execution
        return `
(function() {
    'use strict';
    
    // PowerScript Runtime for Browser
    ${jsContent}
    
    // Auto-initialize game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
    
    function initializeGame() {
        console.log('🎮 Initializing PowerScript Game...');
        
        // Find or create canvas
        let canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.width = 1000;
            canvas.height = 600;
            document.body.appendChild(canvas);
        }
        
        // Initialize game systems
        try {
            // Game initialization will happen here
            console.log('✅ PowerScript Game Ready!');
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
        }
    }
})();
        `.trim();
    }
    async compressJS(jsContent) {
        try {
            const result = await (0, terser_1.minify)(jsContent, {
                compress: {
                    drop_console: false, // Keep console.log for debugging
                    drop_debugger: true,
                    pure_funcs: ['console.debug'],
                },
                mangle: {
                    reserved: ['game', 'PlatformerGame', 'Stage', 'Sprite'], // Preserve important names
                },
                format: {
                    comments: false,
                },
            });
            if (result.code) {
                console.log(`📦 Compression: ${jsContent.length} → ${result.code.length} bytes (${Math.round((1 - result.code.length / jsContent.length) * 100)}% reduction)`);
                return result.code;
            }
            else {
                throw new Error('Minification produced no output');
            }
        }
        catch (error) {
            console.warn('⚠️ Compression failed, using uncompressed code:', error);
            return jsContent;
        }
    }
    extractGameInfo() {
        // Analyze the source file to extract game information
        const sourceContent = fs.readFileSync(this.options.input, 'utf-8');
        const info = {
            title: 'PowerScript Game',
            width: 1000,
            height: 600,
            className: 'PlatformerGame',
            hasCanvas: true
        };
        // Extract title from comments
        const titleMatch = sourceContent.match(/\/\*\*[^*]*\*\s*([^*\n]+)/);
        if (titleMatch) {
            info.title = titleMatch[1].trim();
        }
        // Extract dimensions from config
        const widthMatch = sourceContent.match(/width:\s*(\d+)/);
        const heightMatch = sourceContent.match(/height:\s*(\d+)/);
        if (widthMatch)
            info.width = parseInt(widthMatch[1]);
        if (heightMatch)
            info.height = parseInt(heightMatch[1]);
        // Extract class name
        const classMatch = sourceContent.match(/export class (\w+)/);
        if (classMatch) {
            info.className = classMatch[1];
        }
        return info;
    }
    generateHTML(gameInfo) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameInfo.title}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Arial', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: white;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            font-size: 1.2em;
            margin: 10px 0;
            opacity: 0.9;
        }

        .game-container {
            position: relative;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
            background: rgba(255,255,255,0.1);
            padding: 10px;
            backdrop-filter: blur(10px);
        }

        #gameCanvas {
            border-radius: 10px;
            background: #87CEEB;
            display: block;
        }

        .ui {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            min-width: 120px;
        }

        .controls {
            margin: 20px 0;
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(5px);
        }

        .controls h3 {
            margin: 0 0 10px 0;
            color: #FFD700;
        }

        .key-hint {
            display: inline-block;
            margin: 5px;
            padding: 5px 10px;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
            font-family: monospace;
            font-weight: bold;
        }

        .game-over {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            color: white;
            display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .game-over h2 {
            color: #E74C3C;
            margin: 0 0 15px 0;
            font-size: 2em;
        }

        .restart-btn {
            background: linear-gradient(45deg, #27AE60, #2ECC71);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
        }

        .restart-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46,204,113,0.4);
        }

        .eips-info {
            margin-top: 30px;
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            backdrop-filter: blur(5px);
            max-width: 800px;
        }

        .eips-badge {
            background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            margin-left: 5px;
        }

        @media (max-width: 768px) {
            .game-container {
                transform: scale(0.8);
                transform-origin: top center;
            }
            
            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${gameInfo.title}</h1>
        <div class="subtitle">
            Built with PowerScript/EIPS <span class="eips-badge">AS3</span>
        </div>
    </div>

    <div class="game-container">
        <canvas id="gameCanvas" width="${gameInfo.width}" height="${gameInfo.height}"></canvas>
        
        <div class="ui">
            <div id="score">Score: 0</div>
        </div>
        
        <div class="game-over" id="gameOver">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="finalScore">0</span></p>
            <button class="restart-btn" onclick="restartGame()">🔄 Play Again</button>
        </div>
    </div>

    <div class="controls">
        <h3>Controls</h3>
        <span class="key-hint">←/A</span> Move Left
        <span class="key-hint">→/D</span> Move Right
        <span class="key-hint">↑/W/Space</span> Jump
    </div>

    <div class="eips-info">
        <h3>PowerScript/EIPS Build Pipeline</h3>
        <p><strong>Source:</strong> PowerScript (.ts) → <strong>Compiled:</strong> TypeScript → <strong>Optimized:</strong> ${this.options.compress ? 'Compressed' : 'Standard'} JavaScript → <strong>Output:</strong> Production HTML</p>
        <p><em>This game was built using clean AS3-style PowerScript code with automatic HTML generation and JavaScript optimization.</em></p>
    </div>

    <!-- Game JavaScript -->
    <script src="game.js"></script>
    
    <!-- Game UI Integration -->
    <script>
        // UI event handlers
        let gameInstance = null;
        
        function updateScore(score) {
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = 'Score: ' + score;
            }
        }
        
        function showGameOver(score) {
            const gameOverElement = document.getElementById('gameOver');
            const finalScoreElement = document.getElementById('finalScore');
            
            if (gameOverElement) gameOverElement.style.display = 'block';
            if (finalScoreElement) finalScoreElement.textContent = score;
        }
        
        function restartGame() {
            const gameOverElement = document.getElementById('gameOver');
            if (gameOverElement) gameOverElement.style.display = 'none';
            
            // Restart game if instance exists
            if (window.game && typeof window.game.restart === 'function') {
                window.game.restart();
            } else {
                location.reload();
            }
        }
        
        // Listen for game events
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎮 PowerScript Game UI Ready');
            
            // Connect to game events
            if (window.game) {
                window.game.addEventListener('scoreUpdate', function(event) {
                    updateScore(event.score);
                });
                
                window.game.addEventListener('gameOver', function(event) {
                    showGameOver(event.score);
                });
            }
        });
    </script>
</body>
</html>`;
    }
    copyAssets() {
        // Copy any asset files (images, sounds, etc.) to output directory
        const assetsDir = path.dirname(this.options.input);
        const potentialAssets = ['assets', 'images', 'sounds', 'textures'];
        potentialAssets.forEach(assetDir => {
            const assetPath = path.join(assetsDir, assetDir);
            if (fs.existsSync(assetPath)) {
                const outputAssetPath = path.join(this.options.output, assetDir);
                this.copyDirectory(assetPath, outputAssetPath);
                console.log(`📂 Copied assets: ${assetDir}/`);
            }
        });
    }
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach(file => {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }
    startDevServer() {
        console.log('🌐 Starting development server...');
        const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = ${this.options.port};
const ROOT = '${path.resolve(this.options.output)}';

const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('404 Not Found');
        return;
    }
    
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };
    
    res.writeHead(200, { 
        'Content-Type': mimeTypes[ext] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
    });
    
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log('🚀 Dev Server: http://localhost:' + PORT);
});
        `;
        const serverPath = path.join(this.options.output, '_server.js');
        fs.writeFileSync(serverPath, serverScript);
        // Start the server
        try {
            const serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
                stdio: 'inherit',
                detached: true
            });
            console.log(`🚀 Dev Server: http://localhost:${this.options.port}`);
            console.log(`📁 Serving: ${path.resolve(this.options.output)}`);
        }
        catch (error) {
            console.error('❌ Failed to start dev server:', error);
        }
    }
}
exports.EIPSBuilder = EIPSBuilder;
// CLI Interface
function parseArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args[0] === '--help') {
        console.log(`
🚀 EIPS Build System - PowerScript to Production Pipeline

Usage:
  eips build <input.ts> [options]

Options:
  --output <dir>     Output directory (default: dist)
  --compress         Compress JavaScript with Terser
  --html             Generate HTML wrapper
  --serve            Start development server
  --port <number>    Development server port (default: 8080)

Examples:
  eips build game.ts --output dist --compress --html
  eips build platformer.ts --output build --html --serve
  eips build examples/game.ts --compress --serve --port 3000
        `);
        process.exit(0);
    }
    const options = {
        input: '',
        output: 'dist',
        compress: false,
        html: false,
        serve: false,
        port: 8080
    };
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg === 'build' && i + 1 < args.length) {
            options.input = args[i + 1];
            i += 2;
        }
        else if (arg === '--output' && i + 1 < args.length) {
            options.output = args[i + 1];
            i += 2;
        }
        else if (arg === '--port' && i + 1 < args.length) {
            options.port = parseInt(args[i + 1]);
            i += 2;
        }
        else if (arg === '--compress') {
            options.compress = true;
            i++;
        }
        else if (arg === '--html') {
            options.html = true;
            i++;
        }
        else if (arg === '--serve') {
            options.serve = true;
            i++;
        }
        else if (!options.input) {
            options.input = arg;
            i++;
        }
        else {
            i++;
        }
    }
    if (!options.input) {
        console.error('❌ Error: Input file required');
        process.exit(1);
    }
    if (!fs.existsSync(options.input)) {
        console.error(`❌ Error: Input file not found: ${options.input}`);
        process.exit(1);
    }
    return options;
}
// Main execution
async function main() {
    const options = parseArgs();
    const builder = new EIPSBuilder(options);
    await builder.build();
}
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Build failed:', error);
        process.exit(1);
    });
}
exports.default = EIPSBuilder;
