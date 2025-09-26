# PowerScript AI Module

## Abstract

The PowerScript AI module provides comprehensive artificial intelligence capabilities, including text generation, model management, and integration with leading AI providers such as OpenAI, Anthropic, and local model inference.

## Table of Contents

1. [Overview](#overview)
2. [AI Providers](#ai-providers)
3. [Text Generation](#text-generation)
4. [Model Management](#model-management)
5. [API Reference](#api-reference)
6. [Examples](#examples)
7. [Configuration](#configuration)

## 1. Overview

### 1.1 Purpose

The AI module enables developers to integrate advanced artificial intelligence capabilities into their applications:

- Text generation and completion
- Chat-based interactions
- Multi-provider AI integration
- Local and cloud-based model support
- Streaming response handling
- Context management and conversation history

### 1.2 Dependencies

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0"
  }
}
```

### 1.3 Import Syntax

```powerscript
// Import AI module
import { PowerScriptAI } from 'powerscript';

// Or access through main PowerScript class
import { PowerScript } from 'powerscript';
const ai = PowerScript.ai;
```

## 2. AI Providers

### 2.1 Supported Providers

| Provider | Description | Models Supported |
|----------|-------------|------------------|
| **OpenAI** | GPT-3.5, GPT-4, DALL-E | gpt-3.5-turbo, gpt-4, gpt-4-turbo |
| **Anthropic** | Claude models | claude-3-sonnet, claude-3-opus |
| **Local** | Local inference support | Custom models via ONNX |
| **Hugging Face** | Community models | Transformers-based models |

### 2.2 Provider Configuration

```powerscript
interface AIProviderConfig {
    provider: 'openai' | 'anthropic' | 'local' | 'huggingface';
    apiKey?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    defaultModel?: string;
}

// Configure OpenAI provider
const aiConfig: AIProviderConfig = {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
    defaultModel: 'gpt-4-turbo'
};
```

## 3. Text Generation

### 3.1 PowerScriptAI Interface

```typescript
interface GenerateTextOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    stream?: boolean;
}

interface AIResponse {
    text: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'length' | 'content_filter';
    timestamp: Date;
}

class PowerScriptAI extends EventDispatcher {
    constructor(config?: AIProviderConfig)
    
    async initialize(): Promise<void>
    
    // Text generation methods
    async generateText(prompt: string, options?: GenerateTextOptions): Promise<AIResponse>
    async generateTextStream(prompt: string, options?: GenerateTextOptions): AsyncIterable<string>
    
    // Chat methods  
    async chat(messages: ChatMessage[], options?: GenerateTextOptions): Promise<AIResponse>
    async chatStream(messages: ChatMessage[], options?: GenerateTextOptions): AsyncIterable<string>
    
    // Model management
    async listModels(): Promise<AIModel[]>
    async getModel(modelId: string): Promise<AIModel>
    
    // Provider management
    setProvider(provider: string, config: AIProviderConfig): void
    getCurrentProvider(): string
    
    // Utilities
    async estimateTokens(text: string): Promise<number>
    
    // Cleanup
    async cleanup(): Promise<void>
}
```

### 3.2 Basic Text Generation

```powerscript
import { PowerScript } from 'powerscript';

async function generateText() {
    const ai = PowerScript.ai;
    
    // Simple text generation
    const response = await ai.generateText(
        "Write a short story about a robot learning to paint"
    );
    
    console.log('Generated text:', response.text);
    console.log('Tokens used:', response.usage.totalTokens);
    console.log('Model used:', response.model);
}

// With advanced options
async function generateWithOptions() {
    const ai = PowerScript.ai;
    
    const response = await ai.generateText(
        "Create a technical explanation of quantum computing",
        {
            model: 'gpt-4-turbo',
            maxTokens: 500,
            temperature: 0.7,
            topP: 0.9,
            stopSequences: ['\n\n\n']
        }
    );
    
    console.log(response.text);
}
```

### 3.3 Streaming Text Generation

```powerscript
async function streamGeneration() {
    const ai = PowerScript.ai;
    
    console.log('Generating response...');
    
    for await (const chunk of ai.generateTextStream(
        "Explain the benefits of renewable energy"
    )) {
        process.stdout.write(chunk);
    }
    
    console.log('\nGeneration complete!');
}

// Stream with event handling
async function streamWithEvents() {
    const ai = PowerScript.ai;
    
    // Listen for streaming events
    ai.addEventListener('stream.start', (event) => {
        console.log('Stream started');
    });
    
    ai.addEventListener('stream.chunk', (event) => {
        process.stdout.write(event.data.chunk);
    });
    
    ai.addEventListener('stream.complete', (event) => {
        console.log('\nStream complete:', event.data.usage);
    });
    
    // Start streaming
    for await (const chunk of ai.generateTextStream(
        "Write a poem about artificial intelligence"
    )) {
        // Chunks are automatically handled by event listeners
    }
}
```

## 4. Model Management

### 4.1 Model Information

```typescript
interface AIModel {
    id: string;
    name: string;
    provider: string;
    type: 'text' | 'chat' | 'completion' | 'embedding';
    maxTokens: number;
    inputCost: number;  // Cost per 1K tokens
    outputCost: number; // Cost per 1K tokens
    capabilities: string[];
    available: boolean;
}
```

### 4.2 Working with Models

```powerscript
async function exploreModels() {
    const ai = PowerScript.ai;
    
    // List all available models
    const models = await ai.listModels();
    
    console.log('Available models:');
    models.forEach(model => {
        console.log(`- ${model.name} (${model.provider})`);
        console.log(`  Type: ${model.type}`);
        console.log(`  Max tokens: ${model.maxTokens}`);
        console.log(`  Capabilities: ${model.capabilities.join(', ')}`);
    });
    
    // Get specific model details
    const gpt4 = await ai.getModel('gpt-4-turbo');
    console.log('GPT-4 Turbo details:', gpt4);
    
    // Use specific model for generation
    const response = await ai.generateText(
        "Explain machine learning in simple terms",
        { model: gpt4.id }
    );
    
    console.log(response.text);
}
```

## 5. API Reference

### 5.1 Chat Interface

```typescript
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

interface ChatOptions extends GenerateTextOptions {
    systemMessage?: string;
    conversationId?: string;
    saveConversation?: boolean;
}

// Chat conversation example
async function chatConversation() {
    const ai = PowerScript.ai;
    
    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: 'You are a helpful coding assistant specializing in PowerScript development.'
        },
        {
            role: 'user',
            content: 'How do I create a timer in PowerScript?'
        }
    ];
    
    const response = await ai.chat(messages);
    console.log('Assistant:', response.text);
    
    // Add assistant response to conversation
    messages.push({
        role: 'assistant',
        content: response.text
    });
    
    // Continue conversation
    messages.push({
        role: 'user',
        content: 'Can you show me a code example?'
    });
    
    const followUp = await ai.chat(messages);
    console.log('Assistant:', followUp.text);
}
```

### 5.2 Advanced Features

#### 5.2.1 Token Estimation

```powerscript
async function estimateUsage() {
    const ai = PowerScript.ai;
    
    const prompt = "Write a comprehensive guide to PowerScript development";
    const estimatedTokens = await ai.estimateTokens(prompt);
    
    console.log(`Estimated input tokens: ${estimatedTokens}`);
    
    // Estimate total cost based on model
    const model = await ai.getModel('gpt-4-turbo');
    const estimatedCost = (estimatedTokens / 1000) * model.inputCost;
    
    console.log(`Estimated input cost: $${estimatedCost.toFixed(4)}`);
}
```

#### 5.2.2 Batch Processing

```powerscript
async function batchGeneration() {
    const ai = PowerScript.ai;
    
    const prompts = [
        "Explain variables in PowerScript",
        "How to handle events in PowerScript",
        "PowerScript graphics programming basics",
        "Database integration with PowerScript"
    ];
    
    console.log('Processing batch requests...');
    
    const results = await Promise.allSettled(
        prompts.map(prompt => 
            ai.generateText(prompt, { 
                maxTokens: 200,
                temperature: 0.7 
            })
        )
    );
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            console.log(`\n--- Response ${index + 1} ---`);
            console.log(result.value.text);
        } else {
            console.error(`Request ${index + 1} failed:`, result.reason);
        }
    });
}
```

## 6. Examples

### 6.1 AI-Powered Code Assistant

```powerscript
import { PowerScript } from 'powerscript';

class PowerScriptCodeAssistant {
    private ai: PowerScriptAI;
    private conversationHistory: ChatMessage[] = [];
    
    constructor() {
        this.ai = PowerScript.ai;
        
        // Set up system message
        this.conversationHistory.push({
            role: 'system',
            content: `You are an expert PowerScript developer assistant. 
                     Help users with PowerScript code, explain concepts, 
                     and provide working examples. Always include practical 
                     code samples when relevant.`
        });
    }
    
    async askQuestion(question: string): Promise<string> {
        // Add user question to conversation
        this.conversationHistory.push({
            role: 'user',
            content: question
        });
        
        try {
            const response = await this.ai.chat(this.conversationHistory, {
                model: 'gpt-4-turbo',
                temperature: 0.3,
                maxTokens: 1000
            });
            
            // Add assistant response to conversation
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text
            });
            
            return response.text;
            
        } catch (error) {
            console.error('AI request failed:', error);
            return 'Sorry, I encountered an error processing your request.';
        }
    }
    
    async generateCode(description: string): Promise<string> {
        const prompt = `Generate PowerScript code for: ${description}
                       Include comments and error handling where appropriate.
                       Format as a complete, runnable example.`;
        
        const response = await this.ai.generateText(prompt, {
            model: 'gpt-4-turbo',
            temperature: 0.2, // Lower temperature for code generation
            maxTokens: 1500
        });
        
        return response.text;
    }
    
    async explainCode(code: string): Promise<string> {
        const prompt = `Explain this PowerScript code in detail:
                       
                       \`\`\`powerscript
                       ${code}
                       \`\`\`
                       
                       Include what each part does and any PowerScript-specific concepts.`;
        
        const response = await this.ai.generateText(prompt, {
            temperature: 0.4,
            maxTokens: 800
        });
        
        return response.text;
    }
    
    clearConversation(): void {
        this.conversationHistory = this.conversationHistory.slice(0, 1); // Keep system message
    }
}

// Usage example
async function useCodeAssistant() {
    const assistant = new PowerScriptCodeAssistant();
    
    // Ask a question
    const answer = await assistant.askQuestion(
        "How do I create a custom event in PowerScript?"
    );
    console.log('Assistant:', answer);
    
    // Generate code
    const code = await assistant.generateCode(
        "A timer that counts down from 10 seconds and dispatches events"
    );
    console.log('Generated code:', code);
    
    // Explain existing code
    const explanation = await assistant.explainCode(`
        const timer = new Timer(1000, 10);
        timer.addEventListener('timer', handleTick);
        timer.start();
    `);
    console.log('Code explanation:', explanation);
}
```

### 6.2 Content Generation Pipeline

```powerscript
class ContentGenerator {
    private ai: PowerScriptAI;
    
    constructor() {
        this.ai = PowerScript.ai;
    }
    
    async generateBlogPost(topic: string, targetLength: number = 1000): Promise<BlogPost> {
        // Generate outline
        const outlinePrompt = `Create a detailed outline for a blog post about "${topic}". 
                              Include 5-7 main sections with brief descriptions.`;
        
        const outlineResponse = await this.ai.generateText(outlinePrompt, {
            temperature: 0.7,
            maxTokens: 300
        });
        
        // Generate title
        const titlePrompt = `Create 5 compelling blog post titles for a post about "${topic}". 
                            Make them engaging and SEO-friendly.`;
        
        const titleResponse = await this.ai.generateText(titlePrompt, {
            temperature: 0.8,
            maxTokens: 150
        });
        
        // Generate main content
        const contentPrompt = `Write a comprehensive blog post about "${topic}".
                              Use this outline: ${outlineResponse.text}
                              Target length: approximately ${targetLength} words.
                              Include practical examples and actionable insights.`;
        
        const contentResponse = await this.ai.generateText(contentPrompt, {
            temperature: 0.6,
            maxTokens: Math.floor(targetLength * 1.5) // Rough token estimation
        });
        
        // Generate meta description
        const metaPrompt = `Create a compelling meta description (150-160 characters) 
                           for this blog post: "${contentResponse.text.substring(0, 200)}..."`;
        
        const metaResponse = await this.ai.generateText(metaPrompt, {
            temperature: 0.5,
            maxTokens: 50
        });
        
        return {
            title: titleResponse.text.split('\n')[0], // Use first title suggestion
            outline: outlineResponse.text,
            content: contentResponse.text,
            metaDescription: metaResponse.text,
            generatedAt: new Date(),
            wordCount: contentResponse.text.split(' ').length
        };
    }
    
    async generateSocialMediaPosts(content: string): Promise<SocialMediaPost[]> {
        const platforms = ['twitter', 'linkedin', 'facebook'];
        const posts: SocialMediaPost[] = [];
        
        for (const platform of platforms) {
            const prompt = `Create a ${platform} post promoting this content:
                           ${content.substring(0, 500)}...
                           
                           Follow ${platform} best practices for engagement.
                           ${platform === 'twitter' ? 'Keep under 280 characters.' : ''}`;
            
            const response = await this.ai.generateText(prompt, {
                temperature: 0.7,
                maxTokens: platform === 'twitter' ? 100 : 200
            });
            
            posts.push({
                platform,
                content: response.text,
                generatedAt: new Date()
            });
        }
        
        return posts;
    }
}

interface BlogPost {
    title: string;
    outline: string;
    content: string;
    metaDescription: string;
    generatedAt: Date;
    wordCount: number;
}

interface SocialMediaPost {
    platform: string;
    content: string;
    generatedAt: Date;
}

// Usage
async function generateContent() {
    const generator = new ContentGenerator();
    
    const blogPost = await generator.generateBlogPost(
        "Getting Started with PowerScript AI Development",
        1200
    );
    
    console.log('Generated blog post:');
    console.log('Title:', blogPost.title);
    console.log('Word count:', blogPost.wordCount);
    console.log('Meta description:', blogPost.metaDescription);
    
    const socialPosts = await generator.generateSocialMediaPosts(blogPost.content);
    
    console.log('\nSocial media posts:');
    socialPosts.forEach(post => {
        console.log(`${post.platform.toUpperCase()}:`, post.content);
    });
}
```

## 7. Configuration

### 7.1 Environment Configuration

```powerscript
// .env file
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
POWERSCRIPT_AI_PROVIDER=openai
POWERSCRIPT_AI_MODEL=gpt-4-turbo
POWERSCRIPT_AI_TIMEOUT=30000

// Configuration loading
import { PowerScript } from 'powerscript';

const ai = PowerScript.ai;

// Configure from environment
ai.setProvider('openai', {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.POWERSCRIPT_AI_MODEL || 'gpt-3.5-turbo',
    timeout: parseInt(process.env.POWERSCRIPT_AI_TIMEOUT || '30000')
});
```

### 7.2 Multiple Provider Setup

```powerscript
async function setupMultipleProviders() {
    const ai = PowerScript.ai;
    
    // Configure OpenAI
    ai.setProvider('openai', {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: 'gpt-4-turbo'
    });
    
    // Configure Anthropic
    ai.setProvider('anthropic', {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        defaultModel: 'claude-3-sonnet'
    });
    
    // Use different providers for different tasks
    const technicalResponse = await ai.generateText(
        "Explain quantum computing", 
        { provider: 'openai', model: 'gpt-4-turbo' }
    );
    
    const creativeResponse = await ai.generateText(
        "Write a creative story",
        { provider: 'anthropic', model: 'claude-3-opus' }
    );
}
```

## Error Handling

### Common Error Types

```powerscript
try {
    const response = await ai.generateText("Test prompt");
} catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
        console.log('Rate limit exceeded, retrying in 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        // Retry logic
    } else if (error.code === 'INVALID_API_KEY') {
        console.error('Invalid API key configured');
    } else if (error.code === 'MODEL_NOT_FOUND') {
        console.error('Requested model not available');
    } else {
        console.error('Unexpected error:', error.message);
    }
}
```

## Performance Considerations

- **Token Management**: Monitor token usage to control costs
- **Caching**: Implement response caching for repeated queries
- **Streaming**: Use streaming for long responses to improve user experience
- **Batch Processing**: Group multiple requests when possible
- **Error Handling**: Implement exponential backoff for rate limiting

## See Also

- [PowerScript Core Documentation](core.md)
- [AI Enhanced Module Documentation](ai-enhanced.md)
- [Complete API Reference](api-reference.md)
- [Configuration Guide](configuration.md)

---

*PowerScript AI Module - Version 1.0.0*