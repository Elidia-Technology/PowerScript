/**
 * PowerScript Networking & Communication Types
 * Comprehensive type definitions for networking operations
 */

// HTTP Types
export interface HTTPConfig {
    baseURL?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    maxConcurrentRequests?: number;
    connectionPool?: {
        enabled: boolean;
        maxConnections: number;
        keepAliveTimeout: number;
    };
    compression?: {
        enabled: boolean;
        algorithms: ('gzip' | 'deflate' | 'brotli')[];
    };
    proxy?: {
        enabled: boolean;
        host: string;
        port: number;
        auth?: {
            username: string;
            password: string;
        };
    };
    ssl?: {
        enabled: boolean;
        certificatePinning?: string[];
        verifyHostname: boolean;
        allowSelfSigned: boolean;
    };
}

export interface HTTPRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string | number | boolean>;
    timeout?: number;
    retries?: number;
    metadata?: Record<string, any>;
}

export interface HTTPResponse<T = any> {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: T;
    config: HTTPRequest;
    duration: number;
    cached?: boolean;
    retryCount?: number;
}

export interface HTTPError extends Error {
    request?: HTTPRequest;
    response?: HTTPResponse;
    code?: string;
    isTimeout?: boolean;
    isNetworkError?: boolean;
    isRetryable?: boolean;
}

// WebSocket Types
export interface WebSocketConfig {
    url: string;
    protocols?: string[];
    reconnect?: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoffMultiplier: number;
        maxDelay: number;
    };
    heartbeat?: {
        enabled: boolean;
        interval: number;
        timeout: number;
        message: string | Buffer;
    };
    compression?: {
        enabled: boolean;
        threshold: number;
    };
    messageQueue?: {
        enabled: boolean;
        maxSize: number;
        persistOffline: boolean;
    };
}

export interface WebSocketMessage {
    id?: string;
    type: 'text' | 'binary' | 'ping' | 'pong' | 'close';
    data: string | Buffer | ArrayBuffer;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface WebSocketEvent {
    type: 'open' | 'close' | 'message' | 'error' | 'reconnecting' | 'reconnected';
    data?: any;
    error?: Error;
    timestamp: Date;
}

// GraphQL Types
export interface GraphQLConfig {
    endpoint: string;
    headers?: Record<string, string>;
    caching?: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        strategy: 'memory' | 'disk' | 'hybrid';
    };
    subscriptions?: {
        enabled: boolean;
        transport: 'websocket' | 'sse';
        url?: string;
    };
    persisted?: {
        enabled: boolean;
        queries: Record<string, string>;
    };
    introspection?: {
        enabled: boolean;
        cache: boolean;
    };
}

export interface GraphQLQuery {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
    extensions?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
    data?: T;
    errors?: GraphQLError[];
    extensions?: Record<string, any>;
}

export interface GraphQLError {
    message: string;
    locations?: { line: number; column: number }[];
    path?: (string | number)[];
    extensions?: Record<string, any>;
}

// Message Queue Types
export interface MessageQueueConfig {
    provider: 'rabbitmq' | 'kafka' | 'redis' | 'sqs' | 'memory';
    connection: {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        ssl?: boolean;
        vhost?: string; // RabbitMQ
        cluster?: string[]; // Kafka
        region?: string; // SQS
    };
    serialization?: {
        format: 'json' | 'msgpack' | 'protobuf' | 'avro';
        compression?: boolean;
    };
    retry?: {
        enabled: boolean;
        maxAttempts: number;
        backoffStrategy: 'fixed' | 'exponential' | 'linear';
        initialDelay: number;
        maxDelay: number;
    };
    deadLetter?: {
        enabled: boolean;
        queue: string;
        maxRetries: number;
    };
}

export interface Message {
    id: string;
    topic: string;
    data: any;
    headers?: Record<string, string>;
    timestamp: Date;
    priority?: number;
    ttl?: number;
    retryCount?: number;
    metadata?: Record<string, any>;
}

export interface MessageConsumer {
    id: string;
    topics: string[];
    handler: (message: Message) => Promise<void>;
    options?: {
        concurrency: number;
        autoAck: boolean;
        prefetch: number;
    };
}

// Network Provider Interfaces
export interface HTTPProvider {
    name: string;
    version: string;
    
    request<T = any>(request: HTTPRequest): Promise<HTTPResponse<T>>;
    get<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>>;
    post<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>>;
    put<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>>;
    delete<T = any>(url: string, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: Partial<HTTPRequest>): Promise<HTTPResponse<T>>;
    
    // Interceptors
    addRequestInterceptor(handler: (request: HTTPRequest) => HTTPRequest | Promise<HTTPRequest>): void;
    addResponseInterceptor(handler: (response: HTTPResponse) => HTTPResponse | Promise<HTTPResponse>): void;
    
    // Configuration
    setDefaults(config: Partial<HTTPConfig>): void;
    getDefaults(): HTTPConfig;
}

export interface WebSocketProvider {
    name: string;
    version: string;
    
    connect(config: WebSocketConfig): Promise<void>;
    disconnect(code?: number, reason?: string): Promise<void>;
    
    send(message: WebSocketMessage): Promise<void>;
    sendText(data: string): Promise<void>;
    sendBinary(data: Buffer | ArrayBuffer): Promise<void>;
    
    isConnected(): boolean;
    getReadyState(): number;
    
    // Event handling
    on(event: string, handler: (event: WebSocketEvent) => void): void;
    off(event: string, handler?: (event: WebSocketEvent) => void): void;
    
    // Message queue management
    queueMessage(message: WebSocketMessage): void;
    flushQueue(): Promise<void>;
    clearQueue(): void;
}

export interface GraphQLProvider {
    name: string;
    version: string;
    
    query<T = any>(query: GraphQLQuery): Promise<GraphQLResponse<T>>;
    mutate<T = any>(mutation: GraphQLQuery): Promise<GraphQLResponse<T>>;
    subscribe<T = any>(subscription: GraphQLQuery): AsyncIterableIterator<GraphQLResponse<T>>;
    
    // Schema operations
    introspect(): Promise<any>;
    validateQuery(query: string): Promise<GraphQLError[]>;
    
    // Cache management
    clearCache(): void;
    getCacheSize(): number;
}

export interface MessageQueueProvider {
    name: string;
    version: string;
    
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    
    // Publishing
    publish(topic: string, message: Message): Promise<void>;
    publishBatch(topic: string, messages: Message[]): Promise<void>;
    
    // Consuming
    subscribe(consumer: MessageConsumer): Promise<void>;
    unsubscribe(consumerId: string): Promise<void>;
    
    // Queue management
    createTopic(topic: string, options?: any): Promise<void>;
    deleteTopic(topic: string): Promise<void>;
    getTopics(): Promise<string[]>;
    
    // Health and monitoring
    isConnected(): boolean;
    getStats(): Promise<Record<string, any>>;
}

// Networking Events
export enum NetworkEventType {
    HTTP_REQUEST_START = 'http.request.start',
    HTTP_REQUEST_SUCCESS = 'http.request.success',
    HTTP_REQUEST_ERROR = 'http.request.error',
    HTTP_REQUEST_RETRY = 'http.request.retry',
    HTTP_REQUEST_TIMEOUT = 'http.request.timeout',
    
    WEBSOCKET_CONNECTING = 'websocket.connecting',
    WEBSOCKET_CONNECTED = 'websocket.connected',
    WEBSOCKET_DISCONNECTED = 'websocket.disconnected',
    WEBSOCKET_MESSAGE_SENT = 'websocket.message.sent',
    WEBSOCKET_MESSAGE_RECEIVED = 'websocket.message.received',
    WEBSOCKET_ERROR = 'websocket.error',
    WEBSOCKET_RECONNECTING = 'websocket.reconnecting',
    
    GRAPHQL_QUERY_START = 'graphql.query.start',
    GRAPHQL_QUERY_SUCCESS = 'graphql.query.success',
    GRAPHQL_QUERY_ERROR = 'graphql.query.error',
    GRAPHQL_SUBSCRIPTION_START = 'graphql.subscription.start',
    GRAPHQL_SUBSCRIPTION_DATA = 'graphql.subscription.data',
    GRAPHQL_SUBSCRIPTION_END = 'graphql.subscription.end',
    
    MESSAGE_PUBLISHED = 'message.published',
    MESSAGE_CONSUMED = 'message.consumed',
    MESSAGE_FAILED = 'message.failed',
    MESSAGE_RETRY = 'message.retry',
    MESSAGE_DEAD_LETTER = 'message.dead_letter'
}

export enum NetworkSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface NetworkEvent {
    id: string;
    type: NetworkEventType;
    timestamp: Date;
    severity: NetworkSeverity;
    message: string;
    metadata: Record<string, any>;
    provider?: string;
    duration?: number;
    error?: Error;
}

// Error Types
export class NetworkError extends Error {
    constructor(
        message: string,
        public code: string,
        public category: 'http' | 'websocket' | 'graphql' | 'message_queue' = 'http',
        public severity: NetworkSeverity = NetworkSeverity.MEDIUM,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class HTTPClientError extends NetworkError {
    constructor(message: string, code: string = 'HTTP_ERROR', retryable: boolean = false) {
        super(message, code, 'http', NetworkSeverity.MEDIUM, retryable);
        this.name = 'HTTPClientError';
    }
}

export class WebSocketError extends NetworkError {
    constructor(message: string, code: string = 'WEBSOCKET_ERROR', retryable: boolean = true) {
        super(message, code, 'websocket', NetworkSeverity.MEDIUM, retryable);
        this.name = 'WebSocketError';
    }
}

export class GraphQLClientError extends NetworkError {
    constructor(message: string, code: string = 'GRAPHQL_ERROR', retryable: boolean = false) {
        super(message, code, 'graphql', NetworkSeverity.MEDIUM, retryable);
        this.name = 'GraphQLClientError';
    }
}

export class MessageQueueError extends NetworkError {
    constructor(message: string, code: string = 'MESSAGE_QUEUE_ERROR', retryable: boolean = true) {
        super(message, code, 'message_queue', NetworkSeverity.MEDIUM, retryable);
        this.name = 'MessageQueueError';
    }
}