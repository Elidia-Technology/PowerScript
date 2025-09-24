/**
 * PowerScript Mock WebSocket Provider
 * Implementation of WebSocket client (mock for demo purposes)
 */

import {
    WebSocketProvider, WebSocketConfig, WebSocketMessage, WebSocketEvent,
    WebSocketError, NetworkSeverity
} from '../types';

export class MockWebSocketProvider implements WebSocketProvider {
    public readonly name = 'MockWebSocketProvider';
    public readonly version = '1.0.0';
    
    private config?: WebSocketConfig;
    private readyState: number = 3; // CLOSED
    private eventHandlers: Map<string, Set<(event: WebSocketEvent) => void>> = new Map();
    private messageQueue: WebSocketMessage[] = [];
    private heartbeatInterval?: any;
    private reconnectTimeout?: any;
    private reconnectAttempts = 0;
    
    // WebSocket ready states
    private static readonly CONNECTING = 0;
    private static readonly OPEN = 1;
    private static readonly CLOSING = 2;
    private static readonly CLOSED = 3;
    
    public async connect(config: WebSocketConfig): Promise<void> {
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
            
        } catch (error) {
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
            
            throw new WebSocketError(`Failed to connect to ${config.url}`, 'CONNECTION_FAILED');
        }
    }
    
    public async disconnect(code?: number, reason?: string): Promise<void> {
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
    
    public async send(message: WebSocketMessage): Promise<void> {
        if (this.readyState !== MockWebSocketProvider.OPEN) {
            if (this.config?.messageQueue?.enabled) {
                this.queueMessage(message);
                return;
            } else {
                throw new WebSocketError('WebSocket is not connected', 'NOT_CONNECTED');
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
            
        } catch (error) {
            throw new WebSocketError(
                `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
                'SEND_FAILED'
            );
        }
    }
    
    public async sendText(data: string): Promise<void> {
        const message: WebSocketMessage = {
            id: this.generateMessageId(),
            type: 'text',
            data,
            timestamp: new Date()
        };
        
        return this.send(message);
    }
    
    public async sendBinary(data: ArrayBuffer): Promise<void> {
        const message: WebSocketMessage = {
            id: this.generateMessageId(),
            type: 'binary',
            data,
            timestamp: new Date()
        };
        
        return this.send(message);
    }
    
    public isConnected(): boolean {
        return this.readyState === MockWebSocketProvider.OPEN;
    }
    
    public getReadyState(): number {
        return this.readyState;
    }
    
    public on(event: string, handler: (event: WebSocketEvent) => void): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);
    }
    
    public off(event: string, handler?: (event: WebSocketEvent) => void): void {
        if (!handler) {
            this.eventHandlers.delete(event);
        } else {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.eventHandlers.delete(event);
                }
            }
        }
    }
    
    public queueMessage(message: WebSocketMessage): void {
        if (!this.config?.messageQueue?.enabled) {
            throw new WebSocketError('Message queuing is not enabled', 'QUEUE_DISABLED');
        }
        
        const maxSize = this.config.messageQueue.maxSize || 1000;
        if (this.messageQueue.length >= maxSize) {
            // Remove oldest message to make room
            this.messageQueue.shift();
        }
        
        this.messageQueue.push(message);
    }
    
    public async flushQueue(): Promise<void> {
        if (this.readyState !== MockWebSocketProvider.OPEN) {
            throw new WebSocketError('Cannot flush queue: WebSocket not connected', 'NOT_CONNECTED');
        }
        
        const messages = [...this.messageQueue];
        this.messageQueue.length = 0;
        
        for (const message of messages) {
            try {
                await this.send(message);
            } catch (error) {
                // Re-queue failed messages if persistence is enabled
                if (this.config?.messageQueue?.persistOffline) {
                    this.queueMessage(message);
                }
                throw error;
            }
        }
    }
    
    public clearQueue(): void {
        this.messageQueue.length = 0;
    }
    
    private emitEvent(eventType: string, event: WebSocketEvent): void {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Error in WebSocket event handler for ${eventType}:`, error);
                }
            });
        }
    }
    
    private startHeartbeat(): void {
        if (!this.config?.heartbeat?.enabled) {
            return;
        }
        
        const interval = this.config.heartbeat.interval || 30000;
        const message = this.config.heartbeat.message || 'ping';
        
        this.heartbeatInterval = setInterval(async () => {
            if (this.readyState === MockWebSocketProvider.OPEN) {
                try {
                    const heartbeatMessage: WebSocketMessage = {
                        id: this.generateMessageId(),
                        type: 'ping',
                        data: message,
                        timestamp: new Date()
                    };
                    
                    await this.send(heartbeatMessage);
                } catch (error) {
                    console.error('Heartbeat failed:', error);
                    // Connection might be broken, attempt reconnection
                    if (this.config?.reconnect?.enabled) {
                        this.scheduleReconnect();
                    }
                }
            }
        }, interval);
    }
    
    private scheduleReconnect(): void {
        if (!this.config?.reconnect?.enabled) {
            return;
        }
        
        const maxAttempts = this.config.reconnect.maxAttempts || 5;
        if (this.reconnectAttempts >= maxAttempts) {
            this.emitEvent('error', {
                type: 'error',
                error: new WebSocketError('Max reconnection attempts reached', 'RECONNECT_FAILED'),
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
            } catch (error) {
                // Reconnection failed, schedule another attempt
                this.scheduleReconnect();
            }
        }, delay);
    }
    
    private calculateReconnectDelay(): number {
        if (!this.config?.reconnect) {
            return 1000;
        }
        
        const baseDelay = this.config.reconnect.delay || 1000;
        const multiplier = this.config.reconnect.backoffMultiplier || 2;
        const maxDelay = this.config.reconnect.maxDelay || 30000;
        
        const delay = baseDelay * Math.pow(multiplier, this.reconnectAttempts - 1);
        return Math.min(delay, maxDelay);
    }
    
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}