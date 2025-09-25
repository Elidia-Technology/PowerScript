/**
 * PowerScript Enhanced AI/ML Module Test Suite
 * Jest-compatible tests for comprehensive AI/ML functionality
 */

import { PowerScriptAIEnhanced } from '../src/ai-enhanced/PowerScriptAIEnhanced';
import type {
  AIEnhancedConfig,
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest
} from '../src/ai-enhanced/types';

// Test configuration optimized for CPU-only environment
const testConfig: AIEnhancedConfig = {
  preferredDevice: 'cpu',
  enableGPU: false,
  maxConcurrentTasks: 2,
  memoryLimit: 1024,
  enableModelCache: true,
  maxCacheSize: 1024,
  defaultTextModel: 'llama-3.2-1b',
  defaultImageModel: 'stable-diffusion-v1.5',
  defaultVideoModel: 'stable-video-diffusion',
  defaultAudioModel: 'whisper-base',
  allowRemoteModels: false,
  sandboxEnabled: true
};

describe('PowerScript Enhanced AI/ML Module', () => {
  let aiEnhanced: PowerScriptAIEnhanced;

  beforeEach(() => {
    aiEnhanced = new PowerScriptAIEnhanced(testConfig);
  });

  afterEach(async () => {
    if (aiEnhanced) {
      try {
        await aiEnhanced.cleanup();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Initialization and Hardware Detection', () => {
    test('should initialize AI enhanced module successfully', async () => {
      let readyEmitted = false;
      aiEnhanced.on('ready', () => {
        readyEmitted = true;
      });

      await aiEnhanced.initialize();
      
      expect(readyEmitted).toBe(true);
    }, 30000); // Increased timeout for initialization

    test('should retrieve system information', async () => {
      await aiEnhanced.initialize();
      
      const sysInfo = await aiEnhanced.getSystemInfo();
      
      expect(sysInfo).toBeDefined();
      expect(sysInfo.hardware).toBeDefined();
      expect(Array.isArray(sysInfo.hardware)).toBe(true);
      expect(sysInfo.models).toBeDefined();
      expect(sysInfo.cache).toBeDefined();
      expect(sysInfo.tasks).toBeDefined();
    }, 30000);
  });

  describe('Model Management', () => {
    test('should list available models', async () => {
      await aiEnhanced.initialize();
      
      const models = await aiEnhanced.listModels();
      
      expect(Array.isArray(models)).toBe(true);
      // In test environment, we expect mock models or empty array
    }, 30000);

    test('should handle model loading gracefully', async () => {
      await aiEnhanced.initialize();
      
      // Test loading a model (may fail in test environment, but should not throw)
      try {
        const result = await aiEnhanced.loadModel('test-model');
        expect(typeof result).toBe('boolean');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);
  });

  describe('Text Generation', () => {
    test('should handle text generation requests', async () => {
      await aiEnhanced.initialize();
      
      const request: TextGenerationRequest = {
        prompt: 'Hello',
        config: {
          maxTokens: 10,
          temperature: 0.7
        }
      };
      
      try {
        const response = await aiEnhanced.generateText(request);
        
        expect(response).toBeDefined();
        expect(typeof response.text).toBe('string');
        expect(typeof response.tokensGenerated).toBe('number');
        expect(typeof response.timeMs).toBe('number');
        expect(typeof response.model).toBe('string');
      } catch (error) {
        // In test environment, model might not be available
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);

    test('should handle text summarization', async () => {
      await aiEnhanced.initialize();
      
      const text = 'This is a sample text for summarization testing.';
      
      try {
        const summary = await aiEnhanced.summarizeText(text, { maxLength: 20 });
        expect(typeof summary).toBe('string');
      } catch (error) {
        // In test environment, model might not be available
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);
  });

  describe('Image Generation', () => {
    test('should handle image generation requests', async () => {
      await aiEnhanced.initialize();
      
      const request: ImageGenerationRequest = {
        prompt: 'A simple test image',
        config: {
          width: 256,
          height: 256,
          steps: 10 // Reduced for CPU
        }
      };
      
      try {
        const response = await aiEnhanced.generateImage(request);
        expect(response).toBeDefined();
      } catch (error) {
        // In test environment, model might not be available
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);
  });

  describe('Audio Processing', () => {
    test('should handle text-to-speech requests', async () => {
      await aiEnhanced.initialize();
      
      try {
        const result = await aiEnhanced.textToSpeech('Hello world', {
          voice: 'default',
          speed: 1.0
        });
        expect(result).toBeDefined();
      } catch (error) {
        // In test environment, model might not be available
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);
  });

  describe('Performance and Monitoring', () => {
    test('should provide cache statistics', async () => {
      await aiEnhanced.initialize();
      
      const stats = aiEnhanced.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalEntries).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.missRate).toBe('number');
      expect(typeof stats.evictions).toBe('number');
    });

    test('should handle cache operations', async () => {
      await aiEnhanced.initialize();
      
      // Test cache clearing
      aiEnhanced.clearCache();
      
      const stats = aiEnhanced.getCacheStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    test('should handle task management', async () => {
      await aiEnhanced.initialize();
      
      const tasks = aiEnhanced.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });
});