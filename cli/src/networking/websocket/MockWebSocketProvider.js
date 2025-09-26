"use strict";
/**
 * PowerScript Mock WebSocket Provider
 * Implementation of WebSocket client (mock for demo purposes)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWebSocketProvider = void 0;
const types_1 = require("../types");
class MockWebSocketProvider {
    constructor() {
        this.name = 'MockWebSocketProvider';
        this.version = '1.0.0';
        this.readyState = 3; // CLOSED
        this.eventHandlers = new Map();
        this.messageQueue = [];
        this.reconnectAttempts = 0;
    }
    async connect(config) {
        this.config = config;
        this.readyState = MockWebSocketProvider.CONNECTING;
        this.emitEvent('reconnecting', {
            type: 'reconnecting',
            timestamp: new Date()
        });
        try {
            // Simulate connection delay
            await this.sleep(100);
            this.readyState = MockWebSocketProvider.OPEN;
            this.reconnectAttempts = 0;
            this.emitEvent('open', {
                type: 'open',
                timestamp: new Date()
            });
            // Start heartbeat if configured
            if (config.heartbeat?.enabled) {
                this.startHeartbeat();
            }
            // Process queued messages
            if (this.messageQueue.length > 0) {
                await this.flushQueue();
            }
        }
        catch (error) {
            this.readyState = MockWebSocketProvider.CLOSED;
            this.emitEvent('error', {
                type: 'error',
                error: error instanceof Error ? error : new Error(String(error)),
                timestamp: new Date()
            });
            // Attempt reconnection if configured
            if (config.reconnect?.enabled) {
                this.scheduleReconnect();
            }
            throw new types_1.WebSocketError(`Failed to connect to ${config.url}`, 'CONNECTION_FAILED');
        }
    }
    async disconnect(code, reason) {
        if (this.readyState === MockWebSocketProvider.CLOSED) {
            return;
        }
        this.readyState = MockWebSocketProvider.CLOSING;
        // Clear intervals and timeouts
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = undefined;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
        // Simulate disconnection delay
        await this.sleep(50);
        this.readyState = MockWebSocketProvider.CLOSED;
        this.emitEvent('close', {
            type: 'close',
            data: { code, reason },
            timestamp: new Date()
        });
    }
    async send(message) {
        if (this.readyState !== MockWebSocketProvider.OPEN) {
            if (this.config?.messageQueue?.enabled) {
                this.queueMessage(message);
                return;
            }
            else {
                throw new types_1.WebSocketError('WebSocket is not connected', 'NOT_CONNECTED');
            }
        }
        try {
            // Simulate message sending
            await this.sleep(10);
            // Echo the message back as a received message (for demo)
            setTimeout(() => {
                this.emitEvent('message', {
                    type: 'message',
                    data: `Echo: ${message.data}`,
                    timestamp: new Date()
                });
            }, 100);
        }
        catch (error) {
            throw new types_1.WebSocketError(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`, 'SEND_FAILED');
        }
    }
    async sendText(data) {
        const message = {
            id: this.generateMessageId(),
            type: 'text',
            data,
            timestamp: new Date()
        };
        return this.send(message);
    }
    async sendBinary(data) {
        const message = {
            id: this.generateMessageId(),
            type: 'binary',
            data,
            timestamp: new Date()
        };
        return this.send(message);
    }
    isConnected() {
        return this.readyState === MockWebSocketProvider.OPEN;
    }
    getReadyState() {
        return this.readyState;
    }
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }
    off(event, handler) {
        if (!handler) {
            this.eventHandlers.delete(event);
        }
        else {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.eventHandlers.delete(event);
                }
            }
        }
    }
    queueMessage(message) {
        if (!this.config?.messageQueue?.enabled) {
            throw new types_1.WebSocketError('Message queuing is not enabled', 'QUEUE_DISABLED');
        }
        const maxSize = this.config.messageQueue.maxSize || 1000;
        if (this.messageQueue.length >= maxSize) {
            // Remove oldest message to make room
            this.messageQueue.shift();
        }
        this.messageQueue.push(message);
    }
    async flushQueue() {
        if (this.readyState !== MockWebSocketProvider.OPEN) {
            throw new types_1.WebSocketError('Cannot flush queue: WebSocket not connected', 'NOT_CONNECTED');
        }
        const messages = [...this.messageQueue];
        this.messageQueue.length = 0;
        for (const message of messages) {
            try {
                await this.send(message);
            }
            catch (error) {
                // Re-queue failed messages if persistence is enabled
                if (this.config?.messageQueue?.persistOffline) {
                    this.queueMessage(message);
                }
                throw error;
            }
        }
    }
    clearQueue() {
        this.messageQueue.length = 0;
    }
    emitEvent(eventType, event) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Error in WebSocket event handler for ${eventType}:`, error);
                }
            });
        }
    }
    startHeartbeat() {
        if (!this.config?.heartbeat?.enabled) {
            return;
        }
        const interval = this.config.heartbeat.interval || 30000;
        const message = this.config.heartbeat.message || 'ping';
        this.heartbeatInterval = setInterval(async () => {
            if (this.readyState === MockWebSocketProvider.OPEN) {
                try {
                    const heartbeatMessage = {
                        id: this.generateMessageId(),
                        type: 'ping',
                        data: message,
                        timestamp: new Date()
                    };
                    await this.send(heartbeatMessage);
                }
                catch (error) {
                    console.error('Heartbeat failed:', error);
                    // Connection might be broken, attempt reconnection
                    if (this.config?.reconnect?.enabled) {
                        this.scheduleReconnect();
                    }
                }
            }
        }, interval);
    }
    scheduleReconnect() {
        if (!this.config?.reconnect?.enabled) {
            return;
        }
        const maxAttempts = this.config.reconnect.maxAttempts || 5;
        if (this.reconnectAttempts >= maxAttempts) {
            this.emitEvent('error', {
                type: 'error',
                error: new types_1.WebSocketError('Max reconnection attempts reached', 'RECONNECT_FAILED'),
                timestamp: new Date()
            });
            return;
        }
        this.reconnectAttempts++;
        const delay = this.calculateReconnectDelay();
        this.emitEvent('reconnecting', {
            type: 'reconnecting',
            data: { attempt: this.reconnectAttempts, delay },
            timestamp: new Date()
        });
        this.reconnectTimeout = setTimeout(async () => {
            try {
                if (this.config) {
                    await this.connect(this.config);
                    this.emitEvent('reconnected', {
                        type: 'reconnected',
                        data: { attempts: this.reconnectAttempts },
                        timestamp: new Date()
                    });
                }
            }
            catch (error) {
                // Reconnection failed, schedule another attempt
                this.scheduleReconnect();
            }
        }, delay);
    }
    calculateReconnectDelay() {
        if (!this.config?.reconnect) {
            return 1000;
        }
        const baseDelay = this.config.reconnect.delay || 1000;
        const multiplier = this.config.reconnect.backoffMultiplier || 2;
        const maxDelay = this.config.reconnect.maxDelay || 30000;
        const delay = baseDelay * Math.pow(multiplier, this.reconnectAttempts - 1);
        return Math.min(delay, maxDelay);
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockWebSocketProvider = MockWebSocketProvider;
// WebSocket ready states
MockWebSocketProvider.CONNECTING = 0;
MockWebSocketProvider.OPEN = 1;
MockWebSocketProvider.CLOSING = 2;
MockWebSocketProvider.CLOSED = 3;
