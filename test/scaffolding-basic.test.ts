/**
 * Tests for PowerScript Scaffolding Module (Module 25)
 */

import { PowerScriptScaffolding } from '../src/scaffolding';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PowerScript Scaffolding Module', () => {
  let scaffolding: PowerScriptScaffolding;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ps-test-'));
    scaffolding = new PowerScriptScaffolding(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create scaffolding instance', () => {
    expect(scaffolding).toBeInstanceOf(PowerScriptScaffolding);
  });

  it('should generate basic TypeScript class', async () => {
    const result = await scaffolding.generateClass('UserService', {
      properties: ['name', 'email'],
      methods: ['create', 'update', 'delete'],
      isExported: true,
      hasConstructor: true
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBe(1);
    expect(result.errors.length).toBe(0);

    // Check file was created
    const filePath = path.join(tempDir, 'user-service.ts');
    const content = await fs.readFile(filePath, 'utf8');
    
    expect(content).toContain('export class UserService');
    expect(content).toContain('public name: any;');
    expect(content).toContain('public email: any;');
    expect(content).toContain('public create(): void');
    expect(content).toContain('constructor()');
  });

  it('should generate AI application structure', async () => {
    const result = await scaffolding.generateAIApp('ChatBot', {
      provider: 'openai',
      features: ['conversation', 'memory'],
      framework: 'express'
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBeGreaterThan(3);
    expect(result.errors.length).toBe(0);

    // Check main files were created
    const projectDir = path.join(tempDir, 'chat-bot');
    const mainFile = path.join(projectDir, 'src/index.ts');
    const packageFile = path.join(projectDir, 'package.json');
    
    expect(await fileExists(mainFile)).toBe(true);
    expect(await fileExists(packageFile)).toBe(true);

    // Check package.json content
    const packageContent = await fs.readFile(packageFile, 'utf8');
    const packageJson = JSON.parse(packageContent);
    expect(packageJson.name).toBe('chat-bot');
    expect(packageJson.dependencies.powerscript).toBeDefined();
  });

  it('should generate RAG bot application', async () => {
    const result = await scaffolding.generateRAGBot('KnowledgeBot', {
      vectorDatabase: 'memory',
      embeddingProvider: 'openai',
      chunkingStrategy: 'semantic',
      features: ['query', 'upload', 'api']
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBeGreaterThan(4);
    expect(result.errors.length).toBe(0);

    // Check RAG-specific files
    const projectDir = path.join(tempDir, 'knowledge-bot');
    const ragConfig = path.join(projectDir, 'src/config/rag.ts');
    const docProcessor = path.join(projectDir, 'src/services/DocumentProcessor.ts');
    
    expect(await fileExists(ragConfig)).toBe(true);
    expect(await fileExists(docProcessor)).toBe(true);
  });

  it('should generate server application', async () => {
    const result = await scaffolding.generateServer('APIServer', {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      features: ['rest', 'websocket'],
      middleware: ['auth', 'logging'],
      dryRun: false
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBeGreaterThan(4);
    expect(result.errors.length).toBe(0);

    // Check server files
    const projectDir = path.join(tempDir, 'api-server');
    const serverMain = path.join(projectDir, 'src/index.ts');
    const routes = path.join(projectDir, 'src/routes/index.ts');
    const models = path.join(projectDir, 'src/models/index.ts');
    
    expect(await fileExists(serverMain)).toBe(true);
    expect(await fileExists(routes)).toBe(true);
    expect(await fileExists(models)).toBe(true);
  });

  it('should handle dry run mode', async () => {
    const result = await scaffolding.generateClass('TestClass', {
      dryRun: true,
      properties: ['id', 'name']
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBe(0); // No files created in dry run
    expect(result.errors.length).toBe(0);

    // Verify no files were actually created
    const files = await fs.readdir(tempDir);
    expect(files.length).toBe(0);
  });

  it('should support custom templates', async () => {
    scaffolding.registerTemplate({
      name: 'test-template',
      description: 'Test template',
      files: [
        {
          path: 'test.ts',
          content: 'export const test = "{{name}}";',
          isTemplate: true
        }
      ]
    });

    const templates = scaffolding.listTemplates();
    expect(templates).toContain('test-template');

    const result = await scaffolding.generateFromTemplate('test-template', {
      variables: { name: 'hello world' }
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated.length).toBe(1);

    const content = await fs.readFile(path.join(tempDir, 'test.ts'), 'utf8');
    expect(content).toBe('export const test = "hello world";');
  });

  it('should handle generation errors gracefully', async () => {
    // Try to generate to a non-existent directory without proper permissions
    const badPath = '/root/cannot-write-here';
    const badScaffolding = new PowerScriptScaffolding(badPath);
    
    const result = await badScaffolding.generateClass('TestClass', {
      properties: ['test']
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// Helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}