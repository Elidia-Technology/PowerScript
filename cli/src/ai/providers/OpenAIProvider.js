"use strict";
/**
 * OpenAI Provider for PowerScript AI
 *
 * Integrates with OpenAI's API for GPT models, embeddings, and DALL-E image generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
/**
 * OpenAI Provider implementation
 */
class OpenAIProvider {
    constructor() {
        this.name = 'openai';
        this.version = '1.0.0';
        this.supportedModels = [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo',
            'text-embedding-3-large',
            'text-embedding-3-small',
            'text-embedding-ada-002',
            'dall-e-3',
            'dall-e-2'
        ];
        this.supportedFeatures = {
            textCompletion: true,
            streaming: true,
            functionCalling: true,
            embeddings: true,
            imageGeneration: true,
            imageAnalysis: true,
            audio: true,
            video: false,
            multimodal: true
        };
        this._initialized = false;
        this._baseURL = 'https://api.openai.com/v1';
    }
    /**
     * Initialize the OpenAI provider
     */
    async initialize(config) {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this._config = {
            timeout: 30000,
            maxRetries: 3,
            defaultModel: 'gpt-4o-mini',
            ...config,
            baseURL: config.baseURL || this._baseURL
        };
        // Test the API key with a simple request  
        try {
            await this._makeRequest('GET', '/models');
            this._initialized = true;
        }
        catch (error) {
            throw new Error(`Failed to initialize OpenAI provider: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if provider is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Generate text completion
     */
    async complete(request) {
        this._ensureInitialized();
        const openaiRequest = {
            model: request.model || this._config?.defaultModel || 'gpt-4o-mini',
            messages: request.messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            top_p: request.top_p,
            frequency_penalty: request.frequency_penalty,
            presence_penalty: request.presence_penalty,
            stop: request.stop,
            stream: false,
            ...(request.functions && { functions: request.functions }),
            ...(request.function_call && { function_call: request.function_call })
        };
        try {
            const response = await this._makeRequest('POST', '/chat/completions', openaiRequest);
            return this._transformCompletionResponse(response);
        }
        catch (error) {
            throw this._transformError(error);
        }
    }
    /**
     * Generate streaming text completion
     */
    async *completeStream(request) {
        this._ensureInitialized();
        const openaiRequest = {
            model: request.model || this._config?.defaultModel || 'gpt-4o-mini',
            messages: request.messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            top_p: request.top_p,
            frequency_penalty: request.frequency_penalty,
            presence_penalty: request.presence_penalty,
            stop: request.stop,
            stream: true,
            ...(request.functions && { functions: request.functions }),
            ...(request.function_call && { function_call: request.function_call })
        };
        try {
            const response = await this._makeStreamRequest('POST', '/chat/completions', openaiRequest);
            for await (const chunk of this._parseStreamResponse(response)) {
                if (chunk) {
                    yield this._transformCompletionResponse(chunk);
                }
            }
        }
        catch (error) {
            throw this._transformError(error);
        }
    }
    /**
     * Generate embeddings
     */
    async embed(request) {
        this._ensureInitialized();
        const openaiRequest = {
            model: request.model || 'text-embedding-3-small',
            input: request.input,
            encoding_format: request.encoding_format || 'float',
            ...(request.dimensions && { dimensions: request.dimensions })
        };
        try {
            const response = await this._makeRequest('POST', '/embeddings', openaiRequest);
            return this._transformEmbeddingResponse(response);
        }
        catch (error) {
            throw this._transformError(error);
        }
    }
    /**
     * Generate images using DALL-E
     */
    async generateImage(request) {
        this._ensureInitialized();
        const openaiRequest = {
            model: request.model || 'dall-e-3',
            prompt: request.prompt,
            n: request.n || 1,
            size: request.size || '1024x1024',
            quality: request.quality || 'standard',
            response_format: request.response_format || 'url',
            ...(request.style && { style: request.style })
        };
        try {
            const response = await this._makeRequest('POST', '/images/generations', openaiRequest);
            return this._transformImageResponse(response);
        }
        catch (error) {
            throw this._transformError(error);
        }
    }
    /**
     * Get available models
     */
    async getModels() {
        this._ensureInitialized();
        try {
            const response = await this._makeRequest('GET', '/models');
            return response.data.map((model) => model.id).sort();
        }
        catch (error) {
            return this.supportedModels;
        }
    }
    /**
     * Validate if model is supported
     */
    validateModel(model) {
        return this.supportedModels.includes(model);
    }
    /**
     * Estimate tokens for text (rough estimation)
     */
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for English text
        return Math.ceil(text.length / 4);
    }
    /**
     * Health check
     */
    async healthCheck() {
        if (!this._initialized)
            return false;
        try {
            await this._makeRequest('GET', '/models');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get usage information
     */
    async getUsage() {
        // OpenAI doesn't provide a direct usage endpoint
        // This would require tracking usage on our side
        return {
            provider: this.name,
            note: 'Usage tracking not available through OpenAI API'
        };
    }
    // Private helper methods
    _ensureInitialized() {
        if (!this._initialized || !this._config) {
            throw new Error('OpenAI provider not initialized');
        }
    }
    async _makeRequest(method, endpoint, data) {
        const url = `${this._config.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this._config.apiKey}`
        };
        if (this._config.organization) {
            headers['OpenAI-Organization'] = this._config.organization;
        }
        const fetchOptions = {
            method,
            headers,
            ...(data && method === 'POST' && { body: JSON.stringify(data) })
        };
        // Add timeout if supported
        if (this._config.timeout) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this._config.timeout);
            fetchOptions.signal = controller.signal;
            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);
                return await this._handleResponse(response);
            }
            catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }
        else {
            const response = await fetch(url, fetchOptions);
            return await this._handleResponse(response);
        }
    }
    async _makeStreamRequest(method, endpoint, data) {
        const url = `${this._config.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this._config.apiKey}`
        };
        if (this._config.organization) {
            headers['OpenAI-Organization'] = this._config.organization;
        }
        const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Stream request failed');
        }
        return response;
    }
    async _handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.type = errorData.error?.type;
            throw error;
        }
        return await response.json();
    }
    async *_parseStreamResponse(response) {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Stream reader not available');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            yield JSON.parse(data);
                        }
                        catch (error) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    _transformCompletionResponse(response) {
        return {
            id: response.id,
            model: response.model,
            choices: response.choices.map((choice) => ({
                index: choice.index,
                message: {
                    role: choice.message?.role || choice.delta?.role || 'assistant',
                    content: choice.message?.content || choice.delta?.content || '',
                    ...(choice.message?.function_call && { function_call: choice.message.function_call })
                },
                finish_reason: choice.finish_reason
            })),
            usage: response.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            },
            created: response.created || Date.now()
        };
    }
    _transformEmbeddingResponse(response) {
        return {
            data: response.data.map((item) => ({
                index: item.index,
                embedding: item.embedding
            })),
            model: response.model,
            usage: response.usage
        };
    }
    _transformImageResponse(response) {
        return {
            data: response.data.map((item) => ({
                url: item.url,
                b64_json: item.b64_json,
                revised_prompt: item.revised_prompt
            })),
            created: response.created || Date.now()
        };
    }
    _transformError(error) {
        if (error instanceof Error) {
            return error;
        }
        const openaiError = error;
        if (openaiError.error) {
            const newError = new Error(openaiError.error.message);
            newError.type = openaiError.error.type;
            newError.code = openaiError.error.code;
            return newError;
        }
        return new Error(String(error));
    }
}
exports.OpenAIProvider = OpenAIProvider;
