"use strict";
/**
 * PowerScript Networking & Communication System
 * Main coordination class for all networking operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.networking = exports.PowerScriptNetworking = void 0;
const types_1 = require("./types");
// Simple EventEmitter implementation
class SimpleEventEmitter {
    constructor() {
        this.events = new Map();
    }
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(listener);
    }
    emit(event, ...args) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    off(event, listener) {
        if (!listener) {
            this.events.delete(event);
        }
        else {
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
class PowerScriptNetworking extends SimpleEventEmitter {
    constructor() {
        super();
        this.httpProvider = null;
        this.webSocketProvider = null;
        this.graphQLProvider = null;
        this.messageQueueProvider = null;
        this.config = {};
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
        this.setupDefaultProviders();
    }
    static getInstance() {
        if (!PowerScriptNetworking.instance) {
            PowerScriptNetworking.instance = new PowerScriptNetworking();
        }
        return PowerScriptNetworking.instance;
    }
    // HTTP Operations
    async configureHTTP(config, provider) {
        try {
            this.config.http = { ...this.config.http, ...config };
            if (provider) {
                this.httpProvider = provider;
            }
            if (this.httpProvider) {
                this.httpProvider.setDefaults(this.config.http);
                this.setupHTTPInterceptors();
            }
            this.emitEvent(types_1.NetworkEventType.HTTP_REQUEST_START, 'HTTP provider configured', {
                provider: this.httpProvider?.name,
                config: this.sanitizeConfig(config)
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to configure HTTP: ${errorMessage}`, 'HTTP_CONFIG_ERROR');
        }
    }
    async request(request) {
        if (!this.httpProvider) {
            throw new types_1.NetworkError('HTTP provider not configured', 'HTTP_PROVIDER_MISSING');
        }
        const startTime = Date.now();
        this.metrics.http.requestCount++;
        try {
            this.emitEvent(types_1.NetworkEventType.HTTP_REQUEST_START, 'HTTP request started', {
                method: request.method,
                url: request.url,
                headers: this.sanitizeHeaders(request.headers)
            });
            const response = await this.httpProvider.request(request);
            const duration = Date.now() - startTime;
            this.updateHTTPMetrics(true, duration);
            this.emitEvent(types_1.NetworkEventType.HTTP_REQUEST_SUCCESS, 'HTTP request completed', {
                status: response.status,
                duration,
                cached: response.cached
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.updateHTTPMetrics(false, duration);
            this.emitEvent(types_1.NetworkEventType.HTTP_REQUEST_ERROR, 'HTTP request failed', {
                error: error instanceof Error ? error.message : String(error),
                duration,
                retryable: error?.isRetryable || false
            });
            throw error;
        }
    }
    async get(url, config) {
        return this.request({ method: 'GET', url, ...config });
    }
    async post(url, data, config) {
        return this.request({ method: 'POST', url, body: data, ...config });
    }
    async put(url, data, config) {
        return this.request({ method: 'PUT', url, body: data, ...config });
    }
    async delete(url, config) {
        return this.request({ method: 'DELETE', url, ...config });
    }
    async patch(url, data, config) {
        return this.request({ method: 'PATCH', url, body: data, ...config });
    }
    // WebSocket Operations
    async configureWebSocket(config, provider) {
        try {
            this.config.websocket = { ...this.config.websocket, ...config };
            if (provider) {
                this.webSocketProvider = provider;
            }
            if (this.webSocketProvider) {
                this.setupWebSocketEventHandlers();
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to configure WebSocket: ${errorMessage}`, 'WEBSOCKET_CONFIG_ERROR');
        }
    }
    async connectWebSocket() {
        if (!this.webSocketProvider || !this.config.websocket) {
            throw new types_1.NetworkError('WebSocket provider or config not available', 'WEBSOCKET_PROVIDER_MISSING');
        }
        try {
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_CONNECTING, 'WebSocket connecting', {
                url: this.config.websocket.url
            });
            await this.webSocketProvider.connect(this.config.websocket);
            this.metrics.websocket.connectionCount++;
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_CONNECTED, 'WebSocket connected', {
                url: this.config.websocket.url
            });
        }
        catch (error) {
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_ERROR, 'WebSocket connection failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async disconnectWebSocket(code, reason) {
        if (!this.webSocketProvider) {
            return;
        }
        try {
            await this.webSocketProvider.disconnect(code, reason);
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_DISCONNECTED, 'WebSocket disconnected', {
                code,
                reason
            });
        }
        catch (error) {
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_ERROR, 'WebSocket disconnection failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async sendWebSocketMessage(message) {
        if (!this.webSocketProvider) {
            throw new types_1.NetworkError('WebSocket provider not configured', 'WEBSOCKET_PROVIDER_MISSING');
        }
        try {
            await this.webSocketProvider.send(message);
            this.metrics.websocket.messagesSent++;
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_MESSAGE_SENT, 'WebSocket message sent', {
                messageId: message.id,
                type: message.type,
                size: this.getMessageSize(message.data)
            });
        }
        catch (error) {
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_ERROR, 'WebSocket message send failed', {
                error: error instanceof Error ? error.message : String(error),
                messageId: message.id
            });
            throw error;
        }
    }
    // GraphQL Operations
    async configureGraphQL(config, provider) {
        try {
            this.config.graphql = { ...this.config.graphql, ...config };
            if (provider) {
                this.graphQLProvider = provider;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to configure GraphQL: ${errorMessage}`, 'GRAPHQL_CONFIG_ERROR');
        }
    }
    async graphQLQuery(query) {
        if (!this.graphQLProvider) {
            throw new types_1.NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        const startTime = Date.now();
        this.metrics.graphql.queryCount++;
        try {
            this.emitEvent(types_1.NetworkEventType.GRAPHQL_QUERY_START, 'GraphQL query started', {
                operationName: query.operationName,
                variables: Object.keys(query.variables || {})
            });
            const response = await this.graphQLProvider.query(query);
            const duration = Date.now() - startTime;
            this.emitEvent(types_1.NetworkEventType.GRAPHQL_QUERY_SUCCESS, 'GraphQL query completed', {
                duration,
                hasErrors: !!response.errors?.length
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.emitEvent(types_1.NetworkEventType.GRAPHQL_QUERY_ERROR, 'GraphQL query failed', {
                error: error instanceof Error ? error.message : String(error),
                duration
            });
            throw error;
        }
    }
    async graphQLMutation(mutation) {
        if (!this.graphQLProvider) {
            throw new types_1.NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        this.metrics.graphql.mutationCount++;
        return this.graphQLProvider.mutate(mutation);
    }
    async graphQLSubscription(subscription) {
        if (!this.graphQLProvider) {
            throw new types_1.NetworkError('GraphQL provider not configured', 'GRAPHQL_PROVIDER_MISSING');
        }
        this.metrics.graphql.subscriptionCount++;
        this.emitEvent(types_1.NetworkEventType.GRAPHQL_SUBSCRIPTION_START, 'GraphQL subscription started', {
            operationName: subscription.operationName
        });
        return this.graphQLProvider.subscribe(subscription);
    }
    // Message Queue Operations
    async configureMessageQueue(config, provider) {
        try {
            this.config.messageQueue = { ...this.config.messageQueue, ...config };
            if (provider) {
                this.messageQueueProvider = provider;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to configure message queue: ${errorMessage}`, 'MESSAGE_QUEUE_CONFIG_ERROR');
        }
    }
    async connectMessageQueue() {
        if (!this.messageQueueProvider) {
            throw new types_1.NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        try {
            await this.messageQueueProvider.connect();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to connect to message queue: ${errorMessage}`, 'MESSAGE_QUEUE_CONNECTION_ERROR');
        }
    }
    async publishMessage(topic, message) {
        if (!this.messageQueueProvider) {
            throw new types_1.NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        try {
            await this.messageQueueProvider.publish(topic, message);
            this.metrics.messageQueue.messagesPublished++;
            this.emitEvent(types_1.NetworkEventType.MESSAGE_PUBLISHED, 'Message published', {
                topic,
                messageId: message.id,
                size: JSON.stringify(message).length
            });
        }
        catch (error) {
            this.emitEvent(types_1.NetworkEventType.MESSAGE_FAILED, 'Message publish failed', {
                topic,
                messageId: message.id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async subscribeToMessages(consumer) {
        if (!this.messageQueueProvider) {
            throw new types_1.NetworkError('Message queue provider not configured', 'MESSAGE_QUEUE_PROVIDER_MISSING');
        }
        try {
            // Wrap the consumer handler to track metrics
            const wrappedConsumer = {
                ...consumer,
                handler: async (message) => {
                    try {
                        await consumer.handler(message);
                        this.metrics.messageQueue.messagesConsumed++;
                        this.emitEvent(types_1.NetworkEventType.MESSAGE_CONSUMED, 'Message consumed', {
                            consumerId: consumer.id,
                            messageId: message.id,
                            topic: message.topic
                        });
                    }
                    catch (error) {
                        this.emitEvent(types_1.NetworkEventType.MESSAGE_FAILED, 'Message processing failed', {
                            consumerId: consumer.id,
                            messageId: message.id,
                            error: error instanceof Error ? error.message : String(error)
                        });
                        throw error;
                    }
                }
            };
            await this.messageQueueProvider.subscribe(wrappedConsumer);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.NetworkError(`Failed to subscribe to messages: ${errorMessage}`, 'MESSAGE_QUEUE_SUBSCRIBE_ERROR');
        }
    }
    // Health and Monitoring
    getNetworkingHealth() {
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
    getMetrics() {
        return { ...this.metrics };
    }
    resetMetrics() {
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
    setupDefaultProviders() {
        // Default providers will be loaded from their respective modules
        // This is a placeholder for the provider registration system
    }
    setupHTTPInterceptors() {
        if (!this.httpProvider)
            return;
        // Request interceptor for metrics and logging
        this.httpProvider.addRequestInterceptor(async (request) => {
            // Add default headers, authentication, etc.
            return request;
        });
        // Response interceptor for metrics and caching
        this.httpProvider.addResponseInterceptor(async (response) => {
            // Process response, update cache, etc.
            return response;
        });
    }
    setupWebSocketEventHandlers() {
        if (!this.webSocketProvider)
            return;
        this.webSocketProvider.on('message', (event) => {
            this.metrics.websocket.messagesReceived++;
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_MESSAGE_RECEIVED, 'WebSocket message received', {
                type: event.type,
                size: this.getMessageSize(event.data)
            });
        });
        this.webSocketProvider.on('reconnecting', (event) => {
            this.metrics.websocket.reconnectionCount++;
            this.emitEvent(types_1.NetworkEventType.WEBSOCKET_RECONNECTING, 'WebSocket reconnecting', {
                attempt: this.metrics.websocket.reconnectionCount
            });
        });
    }
    updateHTTPMetrics(success, duration) {
        if (success) {
            this.metrics.http.successCount++;
        }
        else {
            this.metrics.http.errorCount++;
        }
        this.metrics.http.totalResponseTime += duration;
        this.metrics.http.averageResponseTime =
            this.metrics.http.totalResponseTime / this.metrics.http.requestCount;
    }
    emitEvent(type, message, metadata) {
        const event = {
            id: `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: new Date(),
            severity: types_1.NetworkSeverity.LOW,
            message,
            metadata
        };
        this.emit('networkEvent', event);
    }
    sanitizeConfig(config) {
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
    sanitizeHeaders(headers) {
        if (!headers)
            return {};
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
    getMessageSize(data) {
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
exports.PowerScriptNetworking = PowerScriptNetworking;
// Export singleton instance
exports.networking = PowerScriptNetworking.getInstance();
