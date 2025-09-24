/**
 * PowerScript AI - Base interfaces and types for AI providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  functions?: AIFunction[];
  function_call?: 'auto' | 'none' | { name: string };
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AICompletionResponse {
  id: string;
  model: string;
  choices: AIChoice[];
  usage: AIUsage;
  created: number;
}

export interface AIChoice {
  index: number;
  message: AIMessage;
  finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIEmbeddingRequest {
  input: string | string[];
  model?: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
}

export interface AIEmbeddingResponse {
  data: AIEmbedding[];
  model: string;
  usage: AIUsage;
}

export interface AIEmbedding {
  index: number;
  embedding: number[];
}

export interface AIImageRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  style?: 'vivid' | 'natural';
}

export interface AIImageResponse {
  data: AIImage[];
  created: number;
}

export interface AIImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

export interface AIProviderConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
  defaultModel?: string;
}

/**
 * Base AI Provider interface that all providers must implement
 */
export interface IAIProvider {
  readonly name: string;
  readonly version: string;
  readonly supportedModels: string[];
  readonly supportedFeatures: AIFeatures;

  initialize(config: AIProviderConfig): Promise<void>;
  isInitialized(): boolean;
  
  // Text completion
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  completeStream(request: AICompletionRequest): AsyncIterable<AICompletionResponse>;
  
  // Embeddings
  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  
  // Image generation (if supported)
  generateImage?(request: AIImageRequest): Promise<AIImageResponse>;
  
  // Provider-specific features
  getModels(): Promise<string[]>;
  validateModel(model: string): boolean;
  estimateTokens(text: string): number;
  
  // Health and status
  healthCheck(): Promise<boolean>;
  getUsage(): Promise<any>;
}

export interface AIFeatures {
  textCompletion: boolean;
  streaming: boolean;
  functionCalling: boolean;
  embeddings: boolean;
  imageGeneration: boolean;
  imageAnalysis: boolean;
  audio: boolean;
  video: boolean;
  multimodal: boolean;
}

export interface AIProviderInfo {
  name: string;
  version: string;
  description: string;
  website: string;
  models: AIModelInfo[];
  pricing?: AIPricingInfo;
}

export interface AIModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  inputCost?: number;
  outputCost?: number;
  features: string[];
}

export interface AIPricingInfo {
  inputTokens: number;  // per 1M tokens
  outputTokens: number; // per 1M tokens
  currency: string;
}

/**
 * AI Provider Registry for managing multiple providers
 */
export class AIProviderRegistry {
  private _providers: Map<string, IAIProvider> = new Map();
  private _defaultProvider?: string;

  /**
   * Register an AI provider
   */
  public register(provider: IAIProvider): void {
    this._providers.set(provider.name.toLowerCase(), provider);
    
    if (!this._defaultProvider) {
      this._defaultProvider = provider.name.toLowerCase();
    }
  }

  /**
   * Get a provider by name
   */
  public get(name: string): IAIProvider | undefined {
    return this._providers.get(name.toLowerCase());
  }

  /**
   * Get all registered providers
   */
  public getAll(): IAIProvider[] {
    return Array.from(this._providers.values());
  }

  /**
   * Get provider names
   */
  public getNames(): string[] {
    return Array.from(this._providers.keys());
  }

  /**
   * Set default provider
   */
  public setDefault(name: string): void {
    if (this._providers.has(name.toLowerCase())) {
      this._defaultProvider = name.toLowerCase();
    } else {
      throw new Error(`Provider '${name}' not found`);
    }
  }

  /**
   * Get default provider
   */
  public getDefault(): IAIProvider | undefined {
    return this._defaultProvider ? this._providers.get(this._defaultProvider) : undefined;
  }

  /**
   * Check if provider exists
   */
  public has(name: string): boolean {
    return this._providers.has(name.toLowerCase());
  }

  /**
   * Remove a provider
   */
  public remove(name: string): boolean {
    const removed = this._providers.delete(name.toLowerCase());
    
    if (this._defaultProvider === name.toLowerCase() && this._providers.size > 0) {
      this._defaultProvider = this._providers.keys().next().value;
    }
    
    return removed;
  }

  /**
   * Clear all providers
   */
  public clear(): void {
    this._providers.clear();
    this._defaultProvider = undefined;
  }

  /**
   * Get registry info
   */
  public getInfo(): {
    total: number;
    providers: string[];
    default?: string;
  } {
    return {
      total: this._providers.size,
      providers: Array.from(this._providers.keys()),
      default: this._defaultProvider
    };
  }
}