/**
 * PowerScript EventDispatcher - ActionScript 3 style event system
 * 
 * Provides the foundation for event-driven programming in PowerScript,
 * maintaining compatibility with AS3 event patterns while adding modern features.
 */

export interface IEvent {
  type: string;
  target?: any;
  currentTarget?: any;
  bubbles?: boolean;
  cancelable?: boolean;
  defaultPrevented?: boolean;
  propagationStopped?: boolean;
  immediatePropagationStopped?: boolean;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

export class Event implements IEvent {
  public target: any;
  public currentTarget: any;
  public defaultPrevented: boolean = false;
  private _propagationStopped: boolean = false;
  private _immediatePropagationStopped: boolean = false;

  constructor(
    public type: string,
    public bubbles: boolean = false,
    public cancelable: boolean = false
  ) {}

  public preventDefault(): void {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  public stopPropagation(): void {
    this._propagationStopped = true;
  }

  public stopImmediatePropagation(): void {
    this._immediatePropagationStopped = true;
    this.stopPropagation();
  }

  public get propagationStopped(): boolean {
    return this._propagationStopped;
  }

  public get immediatePropagationStopped(): boolean {
    return this._immediatePropagationStopped;
  }

  public clone(): Event {
    return new Event(this.type, this.bubbles, this.cancelable);
  }

  public toString(): string {
    return `[Event type="${this.type}" bubbles=${this.bubbles} cancelable=${this.cancelable}]`;
  }
}

export type EventListener = (event: IEvent) => void;

export interface IEventDispatcher {
  addEventListener(type: string, listener: EventListener, useCapture?: boolean, priority?: number): void;
  removeEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
  dispatchEvent(event: IEvent): boolean;
  hasEventListener(type: string): boolean;
}

/**
 * ActionScript 3 style EventDispatcher implementation
 * Supports event bubbling, capturing, and priority-based listeners
 */
export class EventDispatcher implements IEventDispatcher {
  private _listeners: Map<string, Array<{
    listener: EventListener;
    useCapture: boolean;
    priority: number;
  }>> = new Map();

  private _parent: EventDispatcher | null = null;

  /**
   * Add an event listener with optional priority and capture phase
   */
  public addEventListener(
    type: string, 
    listener: EventListener, 
    useCapture: boolean = false, 
    priority: number = 0
  ): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }

    const listeners = this._listeners.get(type)!;
    
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
  public removeEventListener(
    type: string, 
    listener: EventListener, 
    useCapture: boolean = false
  ): void {
    const listeners = this._listeners.get(type);
    if (!listeners) return;

    const index = listeners.findIndex(
      l => l.listener === listener && l.useCapture === useCapture
    );

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
  public dispatchEvent(event: IEvent): boolean {
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
  public hasEventListener(type: string): boolean {
    return this._listeners.has(type) && this._listeners.get(type)!.length > 0;
  }

  /**
   * Remove all event listeners
   */
  public removeAllEventListeners(): void {
    this._listeners.clear();
  }

  /**
   * Set the parent for event bubbling
   */
  public setParent(parent: EventDispatcher | null): void {
    this._parent = parent;
  }

  /**
   * Get all event types that have listeners
   */
  public getEventTypes(): string[] {
    return Array.from(this._listeners.keys());
  }

  /**
   * Get listener count for a specific event type
   */
  public getListenerCount(type: string): number {
    return this._listeners.get(type)?.length || 0;
  }

  private _dispatchEventCapture(event: IEvent, target: EventDispatcher): void {
    if (event.immediatePropagationStopped) return;

    // Recursively dispatch to parents first (capture phase)
    if (target._parent) {
      this._dispatchEventCapture(event, target._parent);
    }

    event.currentTarget = target;
    const listeners = target._listeners.get(event.type);
    
    if (listeners) {
      for (const listenerObj of listeners) {
        if (event.immediatePropagationStopped) break;
        
        if (listenerObj.useCapture) {
          try {
            listenerObj.listener(event);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        }
      }
    }
  }

  private _dispatchEventTarget(event: IEvent): void {
    if (event.immediatePropagationStopped) return;

    const listeners = this._listeners.get(event.type);
    if (!listeners) return;

    for (const listenerObj of listeners) {
      if (event.immediatePropagationStopped) break;
      
      if (!listenerObj.useCapture) {
        try {
          listenerObj.listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }
  }

  private _dispatchEventBubble(event: IEvent, target: EventDispatcher): void {
    if (event.immediatePropagationStopped || event.propagationStopped) return;

    event.currentTarget = target;
    const listeners = target._listeners.get(event.type);
    
    if (listeners) {
      for (const listenerObj of listeners) {
        if (event.immediatePropagationStopped) break;
        
        if (!listenerObj.useCapture) {
          try {
            listenerObj.listener(event);
          } catch (error) {
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

// Common event types (AS3 compatible)
export class EventTypes {
  public static readonly ADDED = 'added';
  public static readonly ADDED_TO_STAGE = 'addedToStage';
  public static readonly REMOVED = 'removed';
  public static readonly REMOVED_FROM_STAGE = 'removedFromStage';
  public static readonly ENTER_FRAME = 'enterFrame';
  public static readonly RESIZE = 'resize';
  public static readonly COMPLETE = 'complete';
  public static readonly ERROR = 'error';
  public static readonly PROGRESS = 'progress';
  public static readonly CHANGE = 'change';
  public static readonly CLICK = 'click';
  public static readonly MOUSE_DOWN = 'mouseDown';
  public static readonly MOUSE_UP = 'mouseUp';
  public static readonly MOUSE_MOVE = 'mouseMove';
  public static readonly MOUSE_OVER = 'mouseOver';
  public static readonly MOUSE_OUT = 'mouseOut';
  public static readonly KEY_DOWN = 'keyDown';
  public static readonly KEY_UP = 'keyUp';
  public static readonly FOCUS_IN = 'focusIn';
  public static readonly FOCUS_OUT = 'focusOut';
  public static readonly CONNECT = 'connect';
  public static readonly DISCONNECT = 'disconnect';
  public static readonly DATA = 'data';
  public static readonly CLOSE = 'close';
  public static readonly OPEN = 'open';
  public static readonly ACTIVATE = 'activate';
  public static readonly DEACTIVATE = 'deactivate';
}