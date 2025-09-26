"use strict";
/**
 * PowerScript Networking & Communication Types
 * Comprehensive type definitions for networking operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueError = exports.GraphQLClientError = exports.WebSocketError = exports.HTTPClientError = exports.NetworkError = exports.NetworkSeverity = exports.NetworkEventType = void 0;
// Networking Events
var NetworkEventType;
(function (NetworkEventType) {
    NetworkEventType["HTTP_REQUEST_START"] = "http.request.start";
    NetworkEventType["HTTP_REQUEST_SUCCESS"] = "http.request.success";
    NetworkEventType["HTTP_REQUEST_ERROR"] = "http.request.error";
    NetworkEventType["HTTP_REQUEST_RETRY"] = "http.request.retry";
    NetworkEventType["HTTP_REQUEST_TIMEOUT"] = "http.request.timeout";
    NetworkEventType["WEBSOCKET_CONNECTING"] = "websocket.connecting";
    NetworkEventType["WEBSOCKET_CONNECTED"] = "websocket.connected";
    NetworkEventType["WEBSOCKET_DISCONNECTED"] = "websocket.disconnected";
    NetworkEventType["WEBSOCKET_MESSAGE_SENT"] = "websocket.message.sent";
    NetworkEventType["WEBSOCKET_MESSAGE_RECEIVED"] = "websocket.message.received";
    NetworkEventType["WEBSOCKET_ERROR"] = "websocket.error";
    NetworkEventType["WEBSOCKET_RECONNECTING"] = "websocket.reconnecting";
    NetworkEventType["GRAPHQL_QUERY_START"] = "graphql.query.start";
    NetworkEventType["GRAPHQL_QUERY_SUCCESS"] = "graphql.query.success";
    NetworkEventType["GRAPHQL_QUERY_ERROR"] = "graphql.query.error";
    NetworkEventType["GRAPHQL_SUBSCRIPTION_START"] = "graphql.subscription.start";
    NetworkEventType["GRAPHQL_SUBSCRIPTION_DATA"] = "graphql.subscription.data";
    NetworkEventType["GRAPHQL_SUBSCRIPTION_END"] = "graphql.subscription.end";
    NetworkEventType["MESSAGE_PUBLISHED"] = "message.published";
    NetworkEventType["MESSAGE_CONSUMED"] = "message.consumed";
    NetworkEventType["MESSAGE_FAILED"] = "message.failed";
    NetworkEventType["MESSAGE_RETRY"] = "message.retry";
    NetworkEventType["MESSAGE_DEAD_LETTER"] = "message.dead_letter";
})(NetworkEventType || (exports.NetworkEventType = NetworkEventType = {}));
var NetworkSeverity;
(function (NetworkSeverity) {
    NetworkSeverity["LOW"] = "low";
    NetworkSeverity["MEDIUM"] = "medium";
    NetworkSeverity["HIGH"] = "high";
    NetworkSeverity["CRITICAL"] = "critical";
})(NetworkSeverity || (exports.NetworkSeverity = NetworkSeverity = {}));
// Error Types
class NetworkError extends Error {
    constructor(message, code, category = 'http', severity = NetworkSeverity.MEDIUM, retryable = false) {
        super(message);
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.retryable = retryable;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class HTTPClientError extends NetworkError {
    constructor(message, code = 'HTTP_ERROR', retryable = false) {
        super(message, code, 'http', NetworkSeverity.MEDIUM, retryable);
        this.name = 'HTTPClientError';
    }
}
exports.HTTPClientError = HTTPClientError;
class WebSocketError extends NetworkError {
    constructor(message, code = 'WEBSOCKET_ERROR', retryable = true) {
        super(message, code, 'websocket', NetworkSeverity.MEDIUM, retryable);
        this.name = 'WebSocketError';
    }
}
exports.WebSocketError = WebSocketError;
class GraphQLClientError extends NetworkError {
    constructor(message, code = 'GRAPHQL_ERROR', retryable = false) {
        super(message, code, 'graphql', NetworkSeverity.MEDIUM, retryable);
        this.name = 'GraphQLClientError';
    }
}
exports.GraphQLClientError = GraphQLClientError;
class MessageQueueError extends NetworkError {
    constructor(message, code = 'MESSAGE_QUEUE_ERROR', retryable = true) {
        super(message, code, 'message_queue', NetworkSeverity.MEDIUM, retryable);
        this.name = 'MessageQueueError';
    }
}
exports.MessageQueueError = MessageQueueError;
