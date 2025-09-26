"use strict";
/**
 * PowerScript EventDispatcher - PowerScript style event system
 *
 * Provides the foundation for event-driven programming in PowerScript,
 * maintaining compatibility with AS3 event patterns while adding modern features.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = exports.EventDispatcher = exports.Event = void 0;
class Event {
    type;
    bubbles;
    cancelable;
    target;
    currentTarget;
    defaultPrevented = false;
    _propagationStopped = false;
    _immediatePropagationStopped = false;
    constructor(type, bubbles = false, cancelable = false) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
    }
    preventDefault() {
        if (this.cancelable) {
            this.defaultPrevented = true;
        }
    }
    stopPropagation() {
        this._propagationStopped = true;
    }
    stopImmediatePropagation() {
        this._immediatePropagationStopped = true;
        this.stopPropagation();
    }
    get propagationStopped() {
        return this._propagationStopped;
    }
    get immediatePropagationStopped() {
        return this._immediatePropagationStopped;
    }
    clone() {
        return new Event(this.type, this.bubbles, this.cancelable);
    }
    toString() {
        return `[Event type="${this.type}" bubbles=${this.bubbles} cancelable=${this.cancelable}]`;
    }
}
exports.Event = Event;
/**
 * PowerScript style EventDispatcher implementation
 * Supports event bubbling, capturing, and priority-based listeners
 */
class EventDispatcher {
    _listeners = new Map();
    _parent = null;
    /**
     * Add an event listener with optional priority and capture phase
     */
    addEventListener(type, listener, useCapture = false, priority = 0) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        const listeners = this._listeners.get(type);
        // Check if listener already exists
        if (listeners.some(l => l.listener === listener && l.useCapture === useCapture)) {
            return;
        }
        // Insert listener based on priority (higher priority first)
        const listenerObj = { listener, useCapture, priority };
        let inserted = false;
        for (let i = 0; i < listeners.length; i++) {
            if (priority > listeners[i].priority) {
                listeners.splice(i, 0, listenerObj);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            listeners.push(listenerObj);
        }
    }
    /**
     * Remove an event listener
     */
    removeEventListener(type, listener, useCapture = false) {
        const listeners = this._listeners.get(type);
        if (!listeners)
            return;
        const index = listeners.findIndex(l => l.listener === listener && l.useCapture === useCapture);
        if (index !== -1) {
            listeners.splice(index, 1);
            // Clean up empty listener arrays
            if (listeners.length === 0) {
                this._listeners.delete(type);
            }
        }
    }
    /**
     * Dispatch an event through the event system
     */
    dispatchEvent(event) {
        event.target = this;
        event.currentTarget = this;
        // Capture phase (if there's a parent)
        if (event.bubbles && this._parent) {
            this._dispatchEventCapture(event, this._parent);
        }
        // Target phase
        this._dispatchEventTarget(event);
        // Bubble phase
        if (event.bubbles && !event.propagationStopped && this._parent) {
            this._dispatchEventBubble(event, this._parent);
        }
        return !event.defaultPrevented;
    }
    /**
     * Check if any listeners exist for the specified event type
     */
    hasEventListener(type) {
        return this._listeners.has(type) && this._listeners.get(type).length > 0;
    }
    /**
     * Remove all event listeners
     */
    removeAllEventListeners() {
        this._listeners.clear();
    }
    /**
     * Set the parent for event bubbling
     */
    setParent(parent) {
        this._parent = parent;
    }
    /**
     * Get all event types that have listeners
     */
    getEventTypes() {
        return Array.from(this._listeners.keys());
    }
    /**
     * Get listener count for a specific event type
     */
    getListenerCount(type) {
        return this._listeners.get(type)?.length || 0;
    }
    _dispatchEventCapture(event, target) {
        if (event.immediatePropagationStopped)
            return;
        // Recursively dispatch to parents first (capture phase)
        if (target._parent) {
            this._dispatchEventCapture(event, target._parent);
        }
        event.currentTarget = target;
        const listeners = target._listeners.get(event.type);
        if (listeners) {
            for (const listenerObj of listeners) {
                if (event.immediatePropagationStopped)
                    break;
                if (listenerObj.useCapture) {
                    try {
                        listenerObj.listener(event);
                    }
                    catch (error) {
                        console.error('Error in event listener:', error);
                    }
                }
            }
        }
    }
    _dispatchEventTarget(event) {
        if (event.immediatePropagationStopped)
            return;
        const listeners = this._listeners.get(event.type);
        if (!listeners)
            return;
        for (const listenerObj of listeners) {
            if (event.immediatePropagationStopped)
                break;
            if (!listenerObj.useCapture) {
                try {
                    listenerObj.listener(event);
                }
                catch (error) {
                    console.error('Error in event listener:', error);
                }
            }
        }
    }
    _dispatchEventBubble(event, target) {
        if (event.immediatePropagationStopped || event.propagationStopped)
            return;
        event.currentTarget = target;
        const listeners = target._listeners.get(event.type);
        if (listeners) {
            for (const listenerObj of listeners) {
                if (event.immediatePropagationStopped)
                    break;
                if (!listenerObj.useCapture) {
                    try {
                        listenerObj.listener(event);
                    }
                    catch (error) {
                        console.error('Error in event listener:', error);
                    }
                }
            }
        }
        // Continue bubbling up
        if (!event.propagationStopped && target._parent) {
            this._dispatchEventBubble(event, target._parent);
        }
    }
}
exports.EventDispatcher = EventDispatcher;
// Common event types (AS3 compatible)
class EventTypes {
    static ADDED = 'added';
    static ADDED_TO_STAGE = 'addedToStage';
    static REMOVED = 'removed';
    static REMOVED_FROM_STAGE = 'removedFromStage';
    static ENTER_FRAME = 'enterFrame';
    static RESIZE = 'resize';
    static COMPLETE = 'complete';
    static ERROR = 'error';
    static PROGRESS = 'progress';
    static CHANGE = 'change';
    static CLICK = 'click';
    static MOUSE_DOWN = 'mouseDown';
    static MOUSE_UP = 'mouseUp';
    static MOUSE_MOVE = 'mouseMove';
    static MOUSE_OVER = 'mouseOver';
    static MOUSE_OUT = 'mouseOut';
    static KEY_DOWN = 'keyDown';
    static KEY_UP = 'keyUp';
    static FOCUS_IN = 'focusIn';
    static FOCUS_OUT = 'focusOut';
    static CONNECT = 'connect';
    static DISCONNECT = 'disconnect';
    static DATA = 'data';
    static CLOSE = 'close';
    static OPEN = 'open';
    static ACTIVATE = 'activate';
    static DEACTIVATE = 'deactivate';
}
exports.EventTypes = EventTypes;
//# sourceMappingURL=EventDispatcher.js.map