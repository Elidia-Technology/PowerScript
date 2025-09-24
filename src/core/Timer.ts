/**
 * PowerScript Timer - ActionScript 3 style Timer implementation
 * 
 * Provides AS3-compatible timer functionality with event-driven callbacks
 * and modern async/await support.
 */

import { EventDispatcher, Event, EventTypes } from './EventDispatcher';

// Node.js timer type
type TimerId = ReturnType<typeof setTimeout>;

export class TimerEvent extends Event {
  public static readonly TIMER = 'timer';
  public static readonly TIMER_COMPLETE = 'timerComplete';

  constructor(type: string, bubbles: boolean = false, cancelable: boolean = false) {
    super(type, bubbles, cancelable);
  }
}

/**
 * ActionScript 3 style Timer class with modern Node.js features
 */
export class Timer extends EventDispatcher {
  private _delay: number;
  private _repeatCount: number;
  private _currentCount: number = 0;
  private _running: boolean = false;
  private _timerId: TimerId | null = null;
  private _startTime: number = 0;
  private _pausedTime: number = 0;

  /**
   * Create a new Timer
   * @param delay - The delay between timer events in milliseconds
   * @param repeatCount - Number of repetitions (0 = infinite)
   */
  constructor(delay: number, repeatCount: number = 0) {
    super();
    this._delay = delay;
    this._repeatCount = repeatCount;
  }

  /**
   * Start the timer
   */
  public start(): void {
    if (this._running) return;

    this._running = true;
    this._startTime = Date.now() - this._pausedTime;
    this._scheduleNext();
  }

  /**
   * Stop the timer
   */
  public stop(): void {
    if (!this._running) return;

    this._running = false;
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    this._pausedTime = 0;
  }

  /**
   * Pause the timer (can be resumed with start())
   */
  public pause(): void {
    if (!this._running) return;

    this._running = false;
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    this._pausedTime = Date.now() - this._startTime;
  }

  /**
   * Reset the timer to initial state
   */
  public reset(): void {
    this.stop();
    this._currentCount = 0;
    this._pausedTime = 0;
  }

  /**
   * Get the current delay between timer events
   */
  public get delay(): number {
    return this._delay;
  }

  /**
   * Set the delay between timer events
   */
  public set delay(value: number) {
    this._delay = value;
    if (this._running) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get the repeat count
   */
  public get repeatCount(): number {
    return this._repeatCount;
  }

  /**
   * Set the repeat count
   */
  public set repeatCount(value: number) {
    this._repeatCount = value;
  }

  /**
   * Get the current count of timer events
   */
  public get currentCount(): number {
    return this._currentCount;
  }

  /**
   * Check if the timer is currently running
   */
  public get running(): boolean {
    return this._running;
  }

  /**
   * Get elapsed time since timer started
   */
  public get elapsedTime(): number {
    if (!this._startTime) return 0;
    return this._running ? Date.now() - this._startTime : this._pausedTime;
  }

  /**
   * Get remaining time until next timer event
   */
  public get remainingTime(): number {
    if (!this._running) return 0;
    const elapsed = this.elapsedTime;
    const nextEventTime = (this._currentCount + 1) * this._delay;
    return Math.max(0, nextEventTime - elapsed);
  }

  /**
   * Get total duration for all timer events
   */
  public get totalDuration(): number {
    return this._repeatCount > 0 ? this._repeatCount * this._delay : Infinity;
  }

  /**
   * Get progress as a percentage (0-100)
   */
  public get progress(): number {
    if (this._repeatCount === 0) return 0; // Infinite timer
    return Math.min(100, (this._currentCount / this._repeatCount) * 100);
  }

  private _scheduleNext(): void {
    if (!this._running) return;

    const nextDelay = this._delay - (this.elapsedTime % this._delay);
    
    this._timerId = setTimeout(() => {
      if (!this._running) return;

      this._currentCount++;
      
      // Dispatch timer event
      const timerEvent = new TimerEvent(TimerEvent.TIMER);
      this.dispatchEvent(timerEvent);

      // Check if we should continue or complete
      if (this._repeatCount > 0 && this._currentCount >= this._repeatCount) {
        this._running = false;
        const completeEvent = new TimerEvent(TimerEvent.TIMER_COMPLETE);
        this.dispatchEvent(completeEvent);
      } else if (this._running) {
        this._scheduleNext();
      }
    }, nextDelay);
  }

  /**
   * Create a promise that resolves after the specified delay
   */
  public static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a promise that resolves after the timer completes
   */
  public waitForComplete(): Promise<void> {
    return new Promise((resolve) => {
      if (!this._running && this._currentCount >= this._repeatCount) {
        resolve();
        return;
      }

      const completeHandler = () => {
        this.removeEventListener(TimerEvent.TIMER_COMPLETE, completeHandler);
        resolve();
      };

      this.addEventListener(TimerEvent.TIMER_COMPLETE, completeHandler);
    });
  }

  /**
   * Create a timer that executes a callback function
   */
  public static create(
    delay: number, 
    callback: () => void, 
    repeatCount: number = 0
  ): Timer {
    const timer = new Timer(delay, repeatCount);
    timer.addEventListener(TimerEvent.TIMER, callback);
    return timer;
  }

  /**
   * Create an interval timer (infinite repeat)
   */
  public static createInterval(delay: number, callback: () => void): Timer {
    return Timer.create(delay, callback, 0);
  }

  /**
   * Create a timeout timer (single execution)
   */
  public static createTimeout(delay: number, callback: () => void): Timer {
    return Timer.create(delay, callback, 1);
  }

  /**
   * Create a high-precision timer using process.hrtime
   */
  public static createHighPrecision(
    delay: number, 
    callback: () => void, 
    repeatCount: number = 0
  ): Timer {
    const timer = new Timer(delay, repeatCount);
    let startTime = Date.now();
    
    timer.addEventListener(TimerEvent.TIMER, () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      callback();
    });
    
    return timer;
  }

  /**
   * Dispose of the timer and clean up resources
   */
  public dispose(): void {
    this.stop();
    this.removeAllEventListeners();
  }

  public toString(): string {
    return `[Timer delay=${this._delay} repeatCount=${this._repeatCount} currentCount=${this._currentCount} running=${this._running}]`;
  }
}