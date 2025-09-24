/**
 * PowerScript Networking & Communication System
 * Main coordination class for all networking operations
 */

import {
    HTTPConfig, HTTPProvider, HTTPRequest, HTTPResponse, HTTPError,
    WebSocketConfig, WebSocketProvider, WebSocketMessage, WebSocketEvent,
    GraphQLConfig, GraphQLProvider, GraphQLQuery, GraphQLResponse,
    MessageQueueConfig, MessageQueueProvider, Message, MessageConsumer,
    NetworkEvent, NetworkEventType, NetworkSeverity, NetworkError
} from './types';

// Simple EventEmitter implementation
class SimpleEventEmitter {
    private events: Map<string, Function[]> = new Map();
    
    on(event: string, listener: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }
    
    emit(event: string, ...args: any[]): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    
    off(event: string, listener?: Function): void {
        if (!listener) {
            this.events.delete(event);
        } else {
            const listeners = this.events.get(event);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
            }
        }
    }
}

export class PowerScriptNetworking extends SimpleEventEmitter {
    private static instance: PowerScriptNetworking;
    
    private httpProvider: HTTPProvider | null = null;
    private webSocketProvider: WebSocketProvider | null = null;
    private graphQLProvider: GraphQLProvider | null = null;
    private messageQueueProvider: MessageQueueProvider | null = null;
    
    private config: {
        http?: HTTPConfig;
        websocket?: WebSocketConfig;
        graphql?: GraphQLConfig;
        messageQueue?: MessageQueueConfig;
    } = {};
    
    private metrics = {
        http: {
            requestCount: 0,
            successCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        },
        websocket: {
            connectionCount: 0,
            messagesSent: 0,
            messagesReceived: 0,
            reconnectionCount: 0
        },
        graphql: {
            queryCount: 0,
            mutationCount: 0,
            subscriptionCount: 0,
            cacheHits: 0,
            cacheMisses: 0
        },
        messageQueue: {
            messagesPublished: 0,
            messagesConsumed: 0,
            messagesRetried: 0,
            deadLetterCount: 0
        }
    };
    
    private constructor() {
        super();
        this.setupDefaultProviders();
    }
    
    public static getInstance(): PowerScriptNetworking {
        if (!PowerScriptNetworking.instance) {
            PowerScriptNetworking.instance = new PowerScriptNetworking();
        }
        return PowerScriptNetworking.instance;
    }
    
    // HTTP Operations
    public async configureHTTP(config: HTTPConfig, provider?: HTTPProvider): Promise<void> {
        try {
            this.config.http = { ...this.config.http, ...config };
            
            if (provider) {
                this.httpProvider = provider;
            }
            
            if (this.httpProvider) {
                this.httpProvider.setDefaults(this.config.http);
                this.setupHTTPInterceptors();
            }
            
            this.emitEvent(NetworkEventType.HTTP_REQUEST_START, 'HTTP provider configured', {
                provider: this.httpProvider?.name,
                config: this.sanitizeConfig(config)
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to configure HTTP: ${errorMessage}`, 'HTTP_CONFIG_ERROR');
        }
    }
    
    public async request<T = any>(request: HTTPRequest): Promise<HTTPResponse<T>> {
        if (!this.httpProvider) {
            throw new NetworkError('HTTP provider not configured', 'HTTP_PROVIDER_MISSING');
        }
        
        const startTime = Date.now();
        this.metrics.http.requestCount++;
        
        try {
            this.emitEvent(NetworkEventType.HTTP_REQUEST_START, 'HTTP request started', {
                method: request.method,
                url: request.url,
                headers: this.sanitizeHeaders(request.headers)
            });
            
            const response = await this.httpProvider.request<T>(request);
            const duration = Date.now() - startTime;
            
            this.updateHTTPMetrics(true, duration);
            
            this.emitEvent(NetworkEventType.HTTP_REQUEST_SUCCESS, 'HTTP request completed', {
                status: response.status,
                duration,
                cached: response.cached
            });
            
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateHTTPMetrics(false, duration);
            
            this.emitEvent(NetworkEventType.HTTP_REQUEST_ERROR, 'HTTP request failed', {
                error: error instanceof Error ? error.message : String(error),
                duration,
                retryable: (error as any)?.isRetryable || false
            });
            
            throw error;
        }
    }
    
    public async get<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'GET', url, ...config });
    }
    
    public async post<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'POST', url, body: data, ...config });
    }
    
    public async put<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'PUT', url, body: data, ...config });
    }
    
    public async delete<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'DELETE', url, ...config });
    }
    
    public async patch<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>> {
        return this.request<T>({ method: 'PATCH', url, body: data, ...config });
    }
    
    // WebSocket Operations
    public async configureWebSocket(config: WebSocketConfig, provider?: WebSocketProvider): Promise<void> {
        try {
            this.config.websocket = { ...this.config.websocket, ...config };
            
            if (provider) {
                this.webSocketProvider = provider;
            }
            
            if (this.webSocketProvider) {
                this.setupWebSocketEventHandlers();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to configure WebSocket: ${errorMessage}`, 'WEBSOCKET_CONFIG_ERROR');
        }
    }
    
    public async connectWebSocket(): Promise<void> {
        if (!this.webSocketProvider || !this.config.websocket) {
            throw new NetworkError('WebSocket provider or config not available', 'WEBSOCKET_PROVIDER_MISSING');
        }
        
        try {
            this.emitEvent(NetworkEventType.WEBSOCKET_CONNECTING, 'WebSocket connecting', {
                url: this.config.websocket.url
            });
            
            await this.webSocketProvider.connect(this.config.websocket);
            this.metrics.websocket.connectionCount++;
            
            this.emitEvent(NetworkEventType.WEBSOCKET_CONNECTED, 'WebSocket connected', {
                url: this.config.websocket.url
            });
        } catch (error) {
            this.emitEvent(NetworkEventType.WEBSOCKET_ERROR, 'WebSocket connection failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    
    public async disconnectWebSocket(code?: number, reason?: string): Promise<void> {
        if (!this.webSocketProvider) {
            return;
        }
        
        try {
            await this.webSocketProvider.disconnect(code, reason);
            
            this.emitEvent(NetworkEventType.WEBSOCKET_DISCONNECTED, 'WebSocket disconnected', {
                code,
                reason
            });
        } catch (error) {
            this.emitEvent(NetworkEventType.WEBSOCKET_ERROR, 'WebSocket disconnection failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    
    public async sendWebSocketMessage(message: WebSocketMessage): Promise<void> {
        if (!this.webSocketProvider) {
            throw new NetworkError('WebSocket provider not configured', 'WEBSOCKET_PROVIDER_MISSING');
        }
        
        try {
            await this.webSocketProvider.send(message);
            this.metrics.websocket.messagesSent++;
            
            this.emitEvent(NetworkEventType.WEBSOCKET_MESSAGE_SENT, 'WebSocket message sent', {
                messageId: message.id,
                type: message.type,
                size: this.getMessageSize(message.data)
            });
        } catch (error) {
            this.emitEvent(NetworkEventType.WEBSOCKET_ERROR, 'WebSocket message send failed', {
                error: error instanceof Error ? error.message : String(error),
                messageId: message.id
            });
            throw error;
        }
    }
    
    // GraphQL Operations
    public async configureGraphQL(config: GraphQLConfig, provider?: GraphQLProvider): Promise<void> {
        try {
            this.config.graphql = { ...this.config.graphql, ...config };
            
            if (provider) {
                this.graphQLProvider = provider;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to configure GraphQL: ${errorMessage}`, 'GRAPHQL_CONFIG_ERROR');
        }
    }
    
    public async graphQLQuery<T = any>(query: GraphQLQuery): Promise<GraphQLResponse<T>> {
        if (!this.graphQLProvider) {
            throw new NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        
        const startTime = Date.now();
        this.metrics.graphql.queryCount++;
        
        try {
            this.emitEvent(NetworkEventType.GRAPHQL_QUERY_START, 'GraphQL query started', {
                operationName: query.operationName,
                variables: Object.keys(query.variables || {})
            });
            
            const response = await this.graphQLProvider.query<T>(query);
            const duration = Date.now() - startTime;
            
            this.emitEvent(NetworkEventType.GRAPHQL_QUERY_SUCCESS, 'GraphQL query completed', {
                duration,
                hasErrors: !!response.errors?.length
            });
            
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.emitEvent(NetworkEventType.GRAPHQL_QUERY_ERROR, 'GraphQL query failed', {
                error: error instanceof Error ? error.message : String(error),
                duration
            });
            
            throw error;
        }
    }
    
    public async graphQLMutation<T = any>(mutation: GraphQLQuery): Promise<GraphQLResponse<T>> {
        if (!this.graphQLProvider) {
            throw new NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        
        this.metrics.graphql.mutationCount++;
        return this.graphQLProvider.mutate<T>(mutation);
    }
    
    public async graphQLSubscription<T = any>(subscription: GraphQLQuery): Promise<AsyncIterableIterator<GraphQLResponse<T>>> {
        if (!this.graphQLProvider) {
            throw new NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        
        this.metrics.graphql.subscriptionCount++;
        
        this.emitEvent(NetworkEventType.GRAPHQL_SUBSCRIPTION_START, 'GraphQL subscription started', {
            operationName: subscription.operationName
        });
        
        return this.graphQLProvider.subscribe<T>(subscription);
    }
    
    // Message Queue Operations
    public async configureMessageQueue(config: MessageQueueConfig, provider?: MessageQueueProvider): Promise<void> {
        try {
            this.config.messageQueue = { ...this.config.messageQueue, ...config };
            
            if (provider) {
                this.messageQueueProvider = provider;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to configure message queue: ${errorMessage}`, 'MESSAGE_QUEUE_CONFIG_ERROR');
        }
    }
    
    public async connectMessageQueue(): Promise<void> {
        if (!this.messageQueueProvider) {
            throw new NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        
        try {
            await this.messageQueueProvider.connect();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to connect to message queue: ${errorMessage}`, 'MESSAGE_QUEUE_CONNECTION_ERROR');
        }
    }
    
    public async publishMessage(topic: string, message: Message): Promise<void> {
        if (!this.messageQueueProvider) {
            throw new NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        
        try {
            await this.messageQueueProvider.publish(topic, message);
            this.metrics.messageQueue.messagesPublished++;
            
            this.emitEvent(NetworkEventType.MESSAGE_PUBLISHED, 'Message published', {
                topic,
                messageId: message.id,
                size: JSON.stringify(message).length
            });
        } catch (error) {
            this.emitEvent(NetworkEventType.MESSAGE_FAILED, 'Message publish failed', {
                topic,
                messageId: message.id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    
    public async subscribeToMessages(consumer: MessageConsumer): Promise<void> {
        if (!this.messageQueueProvider) {
            throw new NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        
        try {
            // Wrap the consumer handler to track metrics
            const wrappedConsumer: MessageConsumer = {
                ...consumer,
                handler: async (message: Message) => {
                    try {
                        await consumer.handler(message);
                        this.metrics.messageQueue.messagesConsumed++;
                        
                        this.emitEvent(NetworkEventType.MESSAGE_CONSUMED, 'Message consumed', {
                            consumerId: consumer.id,
                            messageId: message.id,
                            topic: message.topic
                        });
                    } catch (error) {
                        this.emitEvent(NetworkEventType.MESSAGE_FAILED, 'Message processing failed', {
                            consumerId: consumer.id,
                            messageId: message.id,
                            error: error instanceof Error ? error.message : String(error)
                        });
                        throw error;
                    }
                }
            };
            
            await this.messageQueueProvider.subscribe(wrappedConsumer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new NetworkError(`Failed to subscribe to messages: ${errorMessage}`, 'MESSAGE_QUEUE_SUBSCRIBE_ERROR');
        }
    }
    
    // Health and Monitoring
    public getNetworkingHealth(): Record<string, any> {
        return {
            http: {
                provider: this.httpProvider?.name || 'none',
                configured: !!this.config.http,
                metrics: this.metrics.http
            },
            websocket: {
                provider: this.webSocketProvider?.name || 'none',
                configured: !!this.config.websocket,
                connected: this.webSocketProvider?.isConnected() || false,
                metrics: this.metrics.websocket
            },
            graphql: {
                provider: this.graphQLProvider?.name || 'none',
                configured: !!this.config.graphql,
                metrics: this.metrics.graphql
            },
            messageQueue: {
                provider: this.messageQueueProvider?.name || 'none',
                configured: !!this.config.messageQueue,
                connected: this.messageQueueProvider?.isConnected() || false,
                metrics: this.metrics.messageQueue
            }
        };
    }
    
    public getMetrics(): typeof this.metrics {
        return { ...this.metrics };
    }
    
    public resetMetrics(): void {
        this.metrics = {
            http: {
                requestCount: 0,
                successCount: 0,
                errorCount: 0,
                averageResponseTime: 0,
                totalResponseTime: 0
            },
            websocket: {
                connectionCount: 0,
                messagesSent: 0,
                messagesReceived: 0,
                reconnectionCount: 0
            },
            graphql: {
                queryCount: 0,
                mutationCount: 0,
                subscriptionCount: 0,
                cacheHits: 0,
                cacheMisses: 0
            },
            messageQueue: {
                messagesPublished: 0,
                messagesConsumed: 0,
                messagesRetried: 0,
                deadLetterCount: 0
            }
        };
    }
    
    // Private helper methods
    private setupDefaultProviders(): void {
        // Default providers will be loaded from their respective modules
        // This is a placeholder for the provider registration system
    }
    
    private setupHTTPInterceptors(): void {
        if (!this.httpProvider) return;
        
        // Request interceptor for metrics and logging
        this.httpProvider.addRequestInterceptor(async (request: HTTPRequest) => {
            // Add default headers, authentication, etc.
            return request;
        });
        
        // Response interceptor for metrics and caching
        this.httpProvider.addResponseInterceptor(async (response: HTTPResponse) => {
            // Process response, update cache, etc.
            return response;
        });
    }
    
    private setupWebSocketEventHandlers(): void {
        if (!this.webSocketProvider) return;
        
        this.webSocketProvider.on('message', (event: WebSocketEvent) => {
            this.metrics.websocket.messagesReceived++;
            
            this.emitEvent(NetworkEventType.WEBSOCKET_MESSAGE_RECEIVED, 'WebSocket message received', {
                type: event.type,
                size: this.getMessageSize(event.data)
            });
        });
        
        this.webSocketProvider.on('reconnecting', (event: WebSocketEvent) => {
            this.metrics.websocket.reconnectionCount++;
            
            this.emitEvent(NetworkEventType.WEBSOCKET_RECONNECTING, 'WebSocket reconnecting', {
                attempt: this.metrics.websocket.reconnectionCount
            });
        });
    }
    
    private updateHTTPMetrics(success: boolean, duration: number): void {
        if (success) {
            this.metrics.http.successCount++;
        } else {
            this.metrics.http.errorCount++;
        }
        
        this.metrics.http.totalResponseTime += duration;
        this.metrics.http.averageResponseTime = 
            this.metrics.http.totalResponseTime / this.metrics.http.requestCount;
    }
    
    private emitEvent(type: NetworkEventType, message: string, metadata: Record<string, any>): void {
        const event: NetworkEvent = {
            id: `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: new Date(),
            severity: NetworkSeverity.LOW,
            message,
            metadata
        };
        
        this.emit('networkEvent', event);
    }
    
    private sanitizeConfig(config: any): any {
        const sanitized = { ...config };
        
        // Remove sensitive information
        if (sanitized.connection?.password) {
            sanitized.connection.password = '***';
        }
        if (sanitized.proxy?.auth?.password) {
            sanitized.proxy.auth.password = '***';
        }
        
        return sanitized;
    }
    
    private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
        if (!headers) return {};
        
        const sanitized = { ...headers };
        
        // Remove sensitive headers
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '***';
            }
            if (sanitized[header.toLowerCase()]) {
                sanitized[header.toLowerCase()] = '***';
            }
        });
        
        return sanitized;
    }
    
    private getMessageSize(data: any): number {
        if (typeof data === 'string') {
            return data.length * 2; // Approximate UTF-8 byte size
        }
        if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'Buffer') {
            return data.length;
        }
        if (data instanceof ArrayBuffer) {
            return data.byteLength;
        }
        return JSON.stringify(data).length;
    }
}

// Export singleton instance
export const networking = PowerScriptNetworking.getInstance();