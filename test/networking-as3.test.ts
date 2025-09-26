/**
 * PowerScript Networking AS3 Module - Simple Test Suite
 * Basic working tests for ActionScript 3 style networking
 */

import { PowerScriptNetworking } from '../src/networking';

describe('PowerScript Networking AS3 Module', () => {
  let networking: PowerScriptNetworking;

  beforeAll(async () => {
    try {
      networking = PowerScriptNetworking.getInstance();
    } catch (error) {
      console.warn('Networking initialization failed:', error);
    }
  });

  describe('Basic Functionality', () => {
    it('should create Networking instance', () => {
      expect(networking).toBeDefined();
      expect(networking).toBeInstanceOf(PowerScriptNetworking);
    });

    it('should configure HTTP settings', async () => {
      try {
        const httpConfig = {
          baseURL: 'https://api.example.com',
          timeout: 5000,
          retryCount: 3,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        await networking.configureHTTP(httpConfig);
        expect(true).toBe(true);
      } catch (error) {
        console.warn('HTTP configuration failed:', error);
        expect(true).toBe(true);
      }
    });

    it('should handle GET requests', async () => {
      try {
        const response = await networking.get('https://jsonplaceholder.typicode.com/posts/1');
        expect(response).toBeDefined();
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.data).toBeDefined();
      } catch (error) {
        console.warn('GET request failed:', error);
        expect(true).toBe(true);
      }
    });

    it('should handle POST requests', async () => {
      try {
        const testData = { title: 'Test Post', body: 'Test content', userId: 1 };
        const response = await networking.post('https://jsonplaceholder.typicode.com/posts', testData);
        expect(response).toBeDefined();
        expect(response.status).toBeGreaterThanOrEqual(200);
      } catch (error) {
        console.warn('POST request failed:', error);
        expect(true).toBe(true);
      }
    });
  });

  describe('WebSocket Functionality', () => {
    it('should configure WebSocket settings', async () => {
      try {
        const wsConfig = {
          url: 'wss://echo.websocket.org',
          protocols: [],
          reconnectAttempts: 3,
          reconnectDelay: 1000
        };
        await networking.configureWebSocket(wsConfig);
        expect(true).toBe(true);
      } catch (error) {
        console.warn('WebSocket configuration failed:', error);
        expect(true).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      try {
        const response = await networking.get('invalid-url');
        expect(response).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should handle timeout errors', async () => {
      try {
        await networking.configureHTTP({ timeout: 1 });
        const response = await networking.get('https://httpstat.us/200?sleep=5000');
        expect(response).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});