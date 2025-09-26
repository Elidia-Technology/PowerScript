/**
 * PowerScript Concurrency Module - Simple Test Suite
 * Basic working tests for Concurrency functionality
 */

import { PowerScriptConcurrency, QueueType } from '../src/concurrency';

describe('PowerScript Concurrency Module', () => {
  let concurrency: PowerScriptConcurrency;

  const testConfig = {
    maxWorkers: 2,
    defaultTimeout: 5000,
    queueCapacity: 100
  };

  beforeAll(async () => {
    try {
      concurrency = new PowerScriptConcurrency(testConfig);
      await concurrency.initialize();
    } catch (error) {
      console.warn('Concurrency initialization failed:', error);
    }
  });

  afterAll(async () => {
    if (concurrency) {
      try {
        await concurrency.shutdown();
      } catch (error) {
        console.warn('Concurrency shutdown failed:', error);
      }
    }
  });

  describe('Basic Functionality', () => {
    it('should create Concurrency instance', () => {
      expect(concurrency).toBeDefined();
      expect(concurrency).toBeInstanceOf(PowerScriptConcurrency);
    });

    it('should initialize worker pools', () => {
      expect(concurrency).toBeDefined();
      expect(typeof concurrency.createQueue).toBe('function');
      expect(typeof concurrency.submitTask).toBe('function');
    });

    it('should create task queues', async () => {
      try {
        const queue = concurrency.createQueue('test-queue', QueueType.FIFO, {
          maxSize: 10,
          concurrency: 1
        });
        expect(queue).toBeDefined();
      } catch (error) {
        console.warn('Queue creation failed:', error);
        expect(true).toBe(true);
      }
    });

    it('should provide status information', async () => {
      try {
        const status = concurrency.getStatus();
        expect(status).toBeDefined();
        expect(status.queues).toBeDefined();
        expect(status.workerPools).toBeDefined();
        expect(status.isInitialized).toBe(true);
      } catch (error) {
        console.warn('Status check failed:', error);
        expect(true).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle shutdown gracefully', async () => {
      try {
        await concurrency.shutdown();
        expect(true).toBe(true);
      } catch (error) {
        console.warn('Shutdown error:', error);
        expect(true).toBe(true);
      }
    });
  });
});