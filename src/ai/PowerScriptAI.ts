/**
 * PowerScript AI - Main AI coordination and management class
 * 
 * Provides unified access to multiple AI providers including OpenAI, Anthropic, 
 * Cohere, HuggingFace, and local models with advanced features like function calling,
 * embeddings, multi-agent orchestration, and RAG systems.
 */

import { EventDispatcher, Event } from '../core/EventDispatcher';
import { Logger } from '../core/Logger';
import { ErrorManager } from '../core/ErrorManager';
import { DependencyContainer } from '../core/DependencyContainer';
import {
  IAIProvider,
  AIProviderRegistry,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIImageRequest,
  AIImageResponse,
  AIMessage,
  AIProviderConfig
} from './types';

export interface PowerScriptAIConfig {
  providers?: {
    [key: string]: AIProviderConfig;
  };
  defaultProvider?: string;
  features?: {
    multiAgent?: boolean;
    rag?: boolean;
    functionCalling?: boolean;
    streaming?: boolean;
    caching?: boolean;
  };
  limits?: {
    maxTokens?: number;
    maxRequests?: number;
    timeout?: number;
  };
  monitoring?: {
    enabled?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

export class AIEvent extends Event {
  public static readonly PROVIDER_REGISTERED = 'providerRegistered';
  public static readonly PROVIDER_INITIALIZED = 'providerInitialized';
  public static readonly REQUEST_START = 'requestStart';
  public static readonly REQUEST_COMPLETE = 'requestComplete';
  public static readonly REQUEST_ERROR = 'requestError';
  public static readonly STREAM_START = 'streamStart';
  public static readonly STREAM_CHUNK = 'streamChunk';
  public static readonly STREAM_END = 'streamEnd';

  constructor(type: string, data?: any, bubbles: boolean = false, cancelable: boolean = false) {
    super(type, bubbles, cancelable);
    this.data = data;
  }

  public data: any;
}

/**
 * Main PowerScript AI class providing unified AI capabilities
 */
export class PowerScriptAI extends EventDispatcher {
  private _config: PowerScriptAIConfig;
  private _logger: Logger;
  private _errorManager: ErrorManager;
  private _container: DependencyContainer;
  private _registry: AIProviderRegistry;
  private _initialized: boolean = false;
  private _requestCount: number = 0;
  private _cache: Map<string, any> = new Map();

  constructor(config?: PowerScriptAIConfig) {
    super();
    
    this._config = {
      providers: {},
      defaultProvider: 'openai',
      features: {
        multiAgent: true,
        rag: true,
        functionCalling: true,
        streaming: true,
        caching: true
      },
      limits: {
        maxTokens: 4096,
        maxRequests: 1000,
        timeout: 30000
      },
      monitoring: {
        enabled: true,
        logLevel: 'info'
      },
      ...config
    };

    this._logger = new Logger();
    this._errorManager = new ErrorManager(this._logger);
    this._container = new DependencyContainer();
    this._registry = new AIProviderRegistry();
  }

  /**
   * Initialize PowerScript AI with providers
   */
  public async initialize(config?: PowerScriptAIConfig): Promise<void> {
    if (this._initialized) {
      this._logger.warn('PowerScript AI already initialized');
      return;
    }

    if (config) {
      this._config = { ...this._config, ...config };
    }

    this._logger.info('Initializing PowerScript AI', {
      providers: Object.keys(this._config.providers || {}),
      defaultProvider: this._config.defaultProvider,
      features: this._config.features
    });

    // Initialize configured providers
    await this._initializeProviders();

    this._initialized = true;
    this._logger.info('PowerScript AI initialized successfully');
  }

  /**
   * Register an AI provider
   */
  public registerProvider(provider: IAIProvider, config?: AIProviderConfig): void {
    this._registry.register(provider);
    
    if (config) {
      this._config.providers = this._config.providers || {};
      this._config.providers[provider.name.toLowerCase()] = config;
    }

    this.dispatchEvent(new AIEvent(AIEvent.PROVIDER_REGISTERED, {
      provider: provider.name,
      features: provider.supportedFeatures
    }));

    this._logger.info(`AI Provider registered: ${provider.name}`, {
      version: provider.version,
      models: provider.supportedModels.length,
      features: provider.supportedFeatures
    });
  }

  /**
   * Get available providers
   */
  public getProviders(): string[] {
    return this._registry.getNames();
  }

  /**
   * Get provider info
   */
  public getProviderInfo(name?: string): any {
    if (name) {
      const provider = this._registry.get(name);
      return provider ? {
        name: provider.name,
        version: provider.version,
        models: provider.supportedModels,
        features: provider.supportedFeatures,
        initialized: provider.isInitialized()
      } : null;
    }
    
    return this._registry.getInfo();
  }

  /**
   * Set default provider
   */
  public setDefaultProvider(name: string): void {
    this._registry.setDefault(name);
    this._config.defaultProvider = name;
    this._logger.info(`Default AI provider set to: ${name}`);
  }

  // Core AI Operations

  /**
   * Generate text completion using specified or default provider
   */
  public async complete(
    messages: AIMessage[] | string,
    options?: {
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<AICompletionResponse> {
    this._ensureInitialized();
    this._checkLimits();

    const providerName = options?.provider || this._config.defaultProvider || 'openai';
    const provider = this._getProvider(providerName);

    // Convert string to messages array
    const messagesArray = typeof messages === 'string' 
      ? [{ role: 'user' as const, content: messages }]
      : messages;

    const request: AICompletionRequest = {
      messages: messagesArray,
      model: options?.model || provider.supportedModels[0],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || this._config.limits?.maxTokens,
      stream: options?.stream || false
    };

    const cacheKey = this._getCacheKey('complete', request);
    if (this._config.features?.caching && this._cache.has(cacheKey)) {
      this._logger.debug('Returning cached completion result');
      return this._cache.get(cacheKey);
    }

    this.dispatchEvent(new AIEvent(AIEvent.REQUEST_START, {
      provider: providerName,
      type: 'completion',
      request
    }));

    try {
      const startTime = Date.now();
      const response = await provider.complete(request);
      const duration = Date.now() - startTime;

      this._requestCount++;
      
      if (this._config.features?.caching) {
        this._cache.set(cacheKey, response);
      }

      this.dispatchEvent(new AIEvent(AIEvent.REQUEST_COMPLETE, {
        provider: providerName,
        type: 'completion',
        duration,
        tokens: response.usage
      }));

      this._logger.debug('Completion request completed', {
        provider: providerName,
        model: response.model,
        tokens: response.usage.total_tokens,
        duration
      });

      return response;

    } catch (error) {
      this.dispatchEvent(new AIEvent(AIEvent.REQUEST_ERROR, {
        provider: providerName,
        type: 'completion',
        error: error instanceof Error ? error.message : String(error)
      }));

      this._errorManager.handleError(error as Error, 'AI_COMPLETION_ERROR');
      throw error;
    }
  }

  /**
   * Generate streaming text completion
   */
  public async *completeStream(
    messages: AIMessage[] | string,
    options?: {
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncIterable<AICompletionResponse> {
    this._ensureInitialized();
    this._checkLimits();

    const providerName = options?.provider || this._config.defaultProvider || 'openai';
    const provider = this._getProvider(providerName);

    if (!provider.supportedFeatures.streaming) {
      throw new Error(`Provider '${providerName}' does not support streaming`);
    }

    const messagesArray = typeof messages === 'string' 
      ? [{ role: 'user' as const, content: messages }]
      : messages;

    const request: AICompletionRequest = {
      messages: messagesArray,
      model: options?.model || provider.supportedModels[0],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || this._config.limits?.maxTokens,
      stream: true
    };

    this.dispatchEvent(new AIEvent(AIEvent.STREAM_START, {
      provider: providerName,
      request
    }));

    try {
      for await (const chunk of provider.completeStream(request)) {
        this.dispatchEvent(new AIEvent(AIEvent.STREAM_CHUNK, {
          provider: providerName,
          chunk
        }));
        yield chunk;
      }

      this.dispatchEvent(new AIEvent(AIEvent.STREAM_END, {
        provider: providerName
      }));

    } catch (error) {
      this.dispatchEvent(new AIEvent(AIEvent.REQUEST_ERROR, {
        provider: providerName,
        type: 'streaming',
        error: error instanceof Error ? error.message : String(error)
      }));

      this._errorManager.handleError(error as Error, 'AI_STREAMING_ERROR');
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  public async embed(
    input: string | string[],
    options?: {
      provider?: string;
      model?: string;
      dimensions?: number;
    }
  ): Promise<AIEmbeddingResponse> {
    this._ensureInitialized();

    const providerName = options?.provider || this._config.defaultProvider || 'openai';
    const provider = this._getProvider(providerName);

    if (!provider.supportedFeatures.embeddings) {
      throw new Error(`Provider '${providerName}' does not support embeddings`);
    }

    const request: AIEmbeddingRequest = {
      input,
      model: options?.model,
      dimensions: options?.dimensions
    };

    const cacheKey = this._getCacheKey('embed', request);
    if (this._config.features?.caching && this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    try {
      const response = await provider.embed(request);
      
      if (this._config.features?.caching) {
        this._cache.set(cacheKey, response);
      }

      return response;

    } catch (error) {
      this._errorManager.handleError(error as Error, 'AI_EMBEDDING_ERROR');
      throw error;
    }
  }

  /**
   * Generate images (if provider supports it)
   */
  public async generateImage(
    prompt: string,
    options?: {
      provider?: string;
      model?: string;
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      n?: number;
    }
  ): Promise<AIImageResponse> {
    this._ensureInitialized();

    const providerName = options?.provider || this._config.defaultProvider || 'openai';
    const provider = this._getProvider(providerName);

    if (!provider.supportedFeatures.imageGeneration || !provider.generateImage) {
      throw new Error(`Provider '${providerName}' does not support image generation`);
    }

    const request: AIImageRequest = {
      prompt,
      model: options?.model,
      size: options?.size || '1024x1024',
      quality: options?.quality || 'standard',
      n: options?.n || 1
    };

    try {
      return await provider.generateImage(request);
    } catch (error) {
      this._errorManager.handleError(error as Error, 'AI_IMAGE_ERROR');
      throw error;
    }
  }

  // Utility Methods

  /**
   * Estimate tokens for text
   */
  public estimateTokens(text: string, provider?: string): number {
    const providerName = provider || this._config.defaultProvider || 'openai';
    const providerInstance = this._getProvider(providerName);
    return providerInstance.estimateTokens(text);
  }

  /**
   * Get usage statistics
   */
  public getUsage(): {
    requests: number;
    cacheSize: number;
    providers: number;
  } {
    return {
      requests: this._requestCount,
      cacheSize: this._cache.size,
      providers: this._registry.getAll().length
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this._cache.clear();
    this._logger.debug('AI cache cleared');
  }

  /**
   * Health check for all providers
   */
  public async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this._registry.getAll()) {
      try {
        results[provider.name] = await provider.healthCheck();
      } catch (error) {
        results[provider.name] = false;
      }
    }
    
    return results;
  }

  // Private methods

  private async _initializeProviders(): Promise<void> {
    const configs = this._config.providers || {};
    
    for (const [name, config] of Object.entries(configs)) {
      const provider = this._registry.get(name);
      if (provider && config) {
        try {
          await provider.initialize(config);
          this.dispatchEvent(new AIEvent(AIEvent.PROVIDER_INITIALIZED, {
            provider: name
          }));
          this._logger.info(`AI Provider initialized: ${name}`);
        } catch (error) {
          this._logger.error(`Failed to initialize AI provider ${name}:`, error);
        }
      }
    }
  }

  private _getProvider(name: string): IAIProvider {
    const provider = this._registry.get(name);
    if (!provider) {
      throw new Error(`AI provider '${name}' not found`);
    }
    if (!provider.isInitialized()) {
      throw new Error(`AI provider '${name}' not initialized`);
    }
    return provider;
  }

  private _ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('PowerScript AI not initialized. Call initialize() first.');
    }
  }

  private _checkLimits(): void {
    if (this._config.limits?.maxRequests && this._requestCount >= this._config.limits.maxRequests) {
      throw new Error('Maximum request limit reached');
    }
  }

  private _getCacheKey(operation: string, request: any): string {
    return `${operation}:${JSON.stringify(request)}`;
  }

  public toString(): string {
    return `[PowerScriptAI providers=${this._registry.getAll().length} requests=${this._requestCount}]`;
  }
}