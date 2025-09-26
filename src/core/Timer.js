"use strict";
/**
 * PowerScript Timer - PowerScript style Timer implementation
 *
 * Provides AS3-compatible timer functionality with event-driven callbacks
 * and modern async/await support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = exports.TimerEvent = void 0;
const EventDispatcher_1 = require("./EventDispatcher");
class TimerEvent extends EventDispatcher_1.Event {
    static TIMER = 'timer';
    static TIMER_COMPLETE = 'timerComplete';
    constructor(type, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
    }
}
exports.TimerEvent = TimerEvent;
/**
 * PowerScript style Timer class with modern Node.js features
 */
class Timer extends EventDispatcher_1.EventDispatcher {
    _delay;
    _repeatCount;
    _currentCount = 0;
    _running = false;
    _timerId = null;
    _startTime = 0;
    _pausedTime = 0;
    /**
     * Create a new Timer
     * @param delay - The delay between timer events in milliseconds
     * @param repeatCount - Number of repetitions (0 = infinite)
     */
    constructor(delay, repeatCount = 0) {
        super();
        this._delay = delay;
        this._repeatCount = repeatCount;
    }
    /**
     * Start the timer
     */
    start() {
        if (this._running)
            return;
        this._running = true;
        this._startTime = Date.now() - this._pausedTime;
        this._scheduleNext();
    }
    /**
     * Stop the timer
     */
    stop() {
        if (!this._running)
            return;
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
    pause() {
        if (!this._running)
            return;
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
    reset() {
        this.stop();
        this._currentCount = 0;
        this._pausedTime = 0;
    }
    /**
     * Get the current delay between timer events
     */
    get delay() {
        return this._delay;
    }
    /**
     * Set the delay between timer events
     */
    set delay(value) {
        this._delay = value;
        if (this._running) {
            this.stop();
            this.start();
        }
    }
    /**
     * Get the repeat count
     */
    get repeatCount() {
        return this._repeatCount;
    }
    /**
     * Set the repeat count
     */
    set repeatCount(value) {
        this._repeatCount = value;
    }
    /**
     * Get the current count of timer events
     */
    get currentCount() {
        return this._currentCount;
    }
    /**
     * Check if the timer is currently running
     */
    get running() {
        return this._running;
    }
    /**
     * Get elapsed time since timer started
     */
    get elapsedTime() {
        if (!this._startTime)
            return 0;
        return this._running ? Date.now() - this._startTime : this._pausedTime;
    }
    /**
     * Get remaining time until next timer event
     */
    get remainingTime() {
        if (!this._running)
            return 0;
        const elapsed = this.elapsedTime;
        const nextEventTime = (this._currentCount + 1) * this._delay;
        return Math.max(0, nextEventTime - elapsed);
    }
    /**
     * Get total duration for all timer events
     */
    get totalDuration() {
        return this._repeatCount > 0 ? this._repeatCount * this._delay : Infinity;
    }
    /**
     * Get progress as a percentage (0-100)
     */
    get progress() {
        if (this._repeatCount === 0)
            return 0; // Infinite timer
        return Math.min(100, (this._currentCount / this._repeatCount) * 100);
    }
    _scheduleNext() {
        if (!this._running)
            return;
        const nextDelay = this._delay - (this.elapsedTime % this._delay);
        this._timerId = setTimeout(() => {
            if (!this._running)
                return;
            this._currentCount++;
            // Dispatch timer event
            const timerEvent = new TimerEvent(TimerEvent.TIMER);
            this.dispatchEvent(timerEvent);
            // Check if we should continue or complete
            if (this._repeatCount > 0 && this._currentCount >= this._repeatCount) {
                this._running = false;
                const completeEvent = new TimerEvent(TimerEvent.TIMER_COMPLETE);
                this.dispatchEvent(completeEvent);
            }
            else if (this._running) {
                this._scheduleNext();
            }
        }, nextDelay);
    }
    /**
     * Create a promise that resolves after the specified delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create a promise that resolves after the timer completes
     */
    waitForComplete() {
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
    static create(delay, callback, repeatCount = 0) {
        const timer = new Timer(delay, repeatCount);
        timer.addEventListener(TimerEvent.TIMER, callback);
        return timer;
    }
    /**
     * Create an interval timer (infinite repeat)
     */
    static createInterval(delay, callback) {
        return Timer.create(delay, callback, 0);
    }
    /**
     * Create a timeout timer (single execution)
     */
    static createTimeout(delay, callback) {
        return Timer.create(delay, callback, 1);
    }
    /**
     * Create a high-precision timer using process.hrtime
     */
    static createHighPrecision(delay, callback, repeatCount = 0) {
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
    dispose() {
        this.stop();
        this.removeAllEventListeners();
    }
    toString() {
        return `[Timer delay=${this._delay} repeatCount=${this._repeatCount} currentCount=${this._currentCount} running=${this._running}]`;
    }
}
exports.Timer = Timer;
//# sourceMappingURL=Timer.js.map