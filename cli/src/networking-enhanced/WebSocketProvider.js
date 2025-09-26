"use strict";
/**
 * PowerScript Enhanced Networking Module - WebSocket Provider
 *
 * Enhanced WebSocket implementation with reconnection, heartbeat, and event management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptWebSocket = void 0;
const events_1 = require("events");
/**
 * Enhanced WebSocket with reconnection and heartbeat capabilities
 */
class PowerScriptWebSocket extends events_1.EventEmitter {
    constructor(config) {
        super();
        this._socket = null;
        this._reconnectAttempts = 0;
        this._reconnectTimer = null;
        this._heartbeatTimer = null;
        this._connectionTimer = null;
        this._isConnecting = false;
        this._isReconnecting = false;
        this._shouldReconnect = true;
        this._messageQueue = [];
        this._config = {
            url: config.url,
            protocols: config.protocols || [],
            reconnect: config.reconnect ?? true,
            reconnectInterval: config.reconnectInterval ?? 3000,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
            heartbeat: config.heartbeat ?? true,
            heartbeatInterval: config.heartbeatInterval ?? 30000,
            connectionTimeout: config.connectionTimeout ?? 10000,
            headers: config.headers || {}
        };
    }
    /**
     * Get current connection state
     */
    get readyState() {
        return this._socket?.readyState ?? WebSocket.CLOSED;
    }
    /**
     * Check if connected
     */
    get isConnected() {
        return this._socket?.readyState === WebSocket.OPEN;
    }
    /**
     * Check if connecting
     */
    get isConnecting() {
        return this._isConnecting;
    }
    /**
     * Check if reconnecting
     */
    get isReconnecting() {
        return this._isReconnecting;
    }
    /**
     * Get reconnection attempts
     */
    get reconnectAttempts() {
        return this._reconnectAttempts;
    }
    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this._isConnecting || this.isConnected) {
            return;
        }
        this._isConnecting = true;
        this._shouldReconnect = true;
        return new Promise((resolve, reject) => {
            try {
                // Create WebSocket connection
                this._socket = new WebSocket(this._config.url, this._config.protocols);
                // Set connection timeout
                this._connectionTimer = setTimeout(() => {
                    if (this._socket && this._socket.readyState === WebSocket.CONNECTING) {
                        this._socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, this._config.connectionTimeout);
                // Handle connection events
                this._socket.onopen = () => {
                    this._clearConnectionTimer();
                    this._isConnecting = false;
                    this._reconnectAttempts = 0;
                    if (this._isReconnecting) {
                        this._isReconnecting = false;
                        this.emit('reconnected');
                    }
                    // Start heartbeat
                    if (this._config.heartbeat) {
                        this._startHeartbeat();
                    }
                    // Send queued messages
                    this._flushMessageQueue();
                    this.emit('open');
                    resolve();
                };
                this._socket.onmessage = (event) => {
                    const message = {
                        type: typeof event.data === 'string' ? 'text' : 'binary',
                        data: event.data,
                        timestamp: Date.now()
                    };
                    this.emit('message', message);
                };
                this._socket.onclose = (event) => {
                    this._clearConnectionTimer();
                    this._clearHeartbeat();
                    this._isConnecting = false;
                    this.emit('close', event.code, event.reason);
                    // Attempt reconnection if enabled
                    if (this._shouldReconnect && this._config.reconnect) {
                        this._attemptReconnection();
                    }
                };
                this._socket.onerror = (event) => {
                    const error = new Error(`WebSocket error: ${event}`);
                    this.emit('error', error);
                    if (this._isConnecting) {
                        this._isConnecting = false;
                        reject(error);
                    }
                };
            }
            catch (error) {
                this._isConnecting = false;
                reject(error);
            }
        });
    }
    /**
     * Disconnect from WebSocket server
     * @param code Close code
     * @param reason Close reason
     */
    disconnect(code = 1000, reason = 'Normal closure') {
        this._shouldReconnect = false;
        this._clearReconnectTimer();
        this._clearHeartbeat();
        this._clearConnectionTimer();
        if (this._socket) {
            this._socket.close(code, reason);
            this._socket = null;
        }
        this._isConnecting = false;
        this._isReconnecting = false;
    }
    /**
     * Send message to server
     * @param data Data to send
     */
    send(data) {
        if (this.isConnected && this._socket) {
            this._socket.send(data);
        }
        else if (typeof data === 'string') {
            // Queue text messages for when connection is restored
            this._messageQueue.push(data);
        }
    }
    /**
     * Send JSON data
     * @param data Object to send as JSON
     */
    sendJSON(data) {
        this.send(JSON.stringify(data));
    }
    /**
     * Send ping message
     */
    ping(data = 'ping') {
        this.send(data);
    }
    /**
     * Attempt reconnection
     */
    _attemptReconnection() {
        if (this._reconnectAttempts >= this._config.maxReconnectAttempts) {
            this.emit('error', new Error('Max reconnection attempts reached'));
            return;
        }
        if (this._isReconnecting) {
            return;
        }
        this._isReconnecting = true;
        this._reconnectAttempts++;
        this.emit('reconnecting', this._reconnectAttempts);
        this._reconnectTimer = setTimeout(() => {
            this.connect().catch(error => {
                this.emit('error', error);
                // Try again if still within limits
                if (this._reconnectAttempts < this._config.maxReconnectAttempts) {
                    this._attemptReconnection();
                }
            });
        }, this._config.reconnectInterval);
    }
    /**
     * Start heartbeat timer
     */
    _startHeartbeat() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
        }
        this._heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.ping();
                this.emit('heartbeat');
            }
        }, this._config.heartbeatInterval);
    }
    /**
     * Clear heartbeat timer
     */
    _clearHeartbeat() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }
    /**
     * Clear reconnection timer
     */
    _clearReconnectTimer() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }
    /**
     * Clear connection timer
     */
    _clearConnectionTimer() {
        if (this._connectionTimer) {
            clearTimeout(this._connectionTimer);
            this._connectionTimer = null;
        }
    }
    /**
     * Flush queued messages
     */
    _flushMessageQueue() {
        while (this._messageQueue.length > 0 && this.isConnected) {
            const message = this._messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.disconnect();
        this._clearReconnectTimer();
        this._clearHeartbeat();
        this._clearConnectionTimer();
        this.removeAllListeners();
        this._messageQueue = [];
    }
}
exports.PowerScriptWebSocket = PowerScriptWebSocket;
