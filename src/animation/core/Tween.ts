/**
 * PowerScript Tween - Core animation and interpolation engine
 * Provides smooth property animation with easing support
 */

import { Easing, EasingFunction } from '../easing/EasingFunctions';

/**
 * Tween configuration options
 */
export interface TweenOptions {
    duration?: number;
    delay?: number;
    ease?: EasingFunction | string;
    repeat?: number;
    yoyo?: boolean;
    autoPlay?: boolean;
    onStart?: () => void;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
    onRepeat?: () => void;
}

/**
 * Tween state enumeration
 */
export enum TweenState {
    IDLE = 'idle',
    DELAYED = 'delayed',
    PLAYING = 'playing',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

/**
 * Property interpolation data
 */
interface PropertyTween {
    target: any;
    property: string;
    startValue: number;
    endValue: number;
    currentValue: number;
}

/**
 * Core Tween class for animating object properties
 */
export class Tween {
    private _target: any;
    private _properties: PropertyTween[] = [];
    private _duration: number = 1000; // milliseconds
    private _delay: number = 0;
    private _ease: EasingFunction = Easing.linear;
    private _repeat: number = 0;
    private _yoyo: boolean = false;
    private _autoPlay: boolean = true;
    
    // State management
    private _state: TweenState = TweenState.IDLE;
    private _startTime: number = 0;
    private _pauseTime: number = 0;
    private _currentTime: number = 0;
    private _progress: number = 0;
    private _isReversed: boolean = false;
    private _currentRepeat: number = 0;
    
    // Callbacks
    private _onStart?: () => void;
    private _onUpdate?: (progress: number) => void;
    private _onComplete?: () => void;
    private _onRepeat?: () => void;
    
    // Animation frame management
    private _animationId: number = 0;
    
    /**
     * Create a new tween for the specified target object
     */
    constructor(target: any, options: TweenOptions = {}) {
        this._target = target;
        this._applyOptions(options);
    }
    
    /**
     * Apply configuration options
     */
    private _applyOptions(options: TweenOptions): void {
        if (options.duration !== undefined) this._duration = options.duration;
        if (options.delay !== undefined) this._delay = options.delay;
        if (options.repeat !== undefined) this._repeat = options.repeat;
        if (options.yoyo !== undefined) this._yoyo = options.yoyo;
        if (options.autoPlay !== undefined) this._autoPlay = options.autoPlay;
        
        if (options.ease !== undefined) {
            if (typeof options.ease === 'string') {
                this._ease = Easing.getEasing(options.ease);
            } else {
                this._ease = options.ease;
            }
        }
        
        this._onStart = options.onStart;
        this._onUpdate = options.onUpdate;
        this._onComplete = options.onComplete;
        this._onRepeat = options.onRepeat;
    }
    
    /**
     * Set target properties to animate
     */
    public to(properties: { [key: string]: number }, duration?: number): Tween {
        if (duration !== undefined) {
            this._duration = duration;
        }
        
        // Store target properties for animation
        this._properties = [];
        for (const property in properties) {
            if (this._target.hasOwnProperty(property)) {
                this._properties.push({
                    target: this._target,
                    property,
                    startValue: this._target[property],
                    endValue: properties[property],
                    currentValue: this._target[property]
                });
            }
        }
        
        if (this._autoPlay) {
            this.play();
        }
        
        return this;
    }
    
    /**
     * Start the animation
     */
    public play(): Tween {
        if (this._state === TweenState.PLAYING) return this;
        
        this._state = this._delay > 0 ? TweenState.DELAYED : TweenState.PLAYING;
        this._startTime = performance.now();
        this._currentTime = 0;
        this._progress = 0;
        
        // Start animation loop
        this._startAnimation();
        
        return this;
    }
    
    /**
     * Pause the animation
     */
    public pause(): Tween {
        if (this._state !== TweenState.PLAYING) return this;
        
        this._state = TweenState.PAUSED;
        this._pauseTime = performance.now();
        
        // Cancel animation frame
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = 0;
        }
        
        return this;
    }
    
    /**
     * Resume the animation
     */
    public resume(): Tween {
        if (this._state !== TweenState.PAUSED) return this;
        
        this._state = TweenState.PLAYING;
        
        // Adjust start time to account for pause duration
        const pauseDuration = performance.now() - this._pauseTime;
        this._startTime += pauseDuration;
        
        // Resume animation loop
        this._startAnimation();
        
        return this;
    }
    
    /**
     * Stop the animation
     */
    public stop(): Tween {
        this._state = TweenState.IDLE;
        this._currentTime = 0;
        this._progress = 0;
        this._currentRepeat = 0;
        this._isReversed = false;
        
        // Cancel animation frame
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = 0;
        }
        
        return this;
    }
    
    /**
     * Reverse the animation direction
     */
    public reverse(): Tween {
        this._isReversed = !this._isReversed;
        return this;
    }
    
    /**
     * Set the animation progress (0-1)
     */
    public progress(value?: number): number | Tween {
        if (value === undefined) {
            return this._progress;
        }
        
        this._progress = Math.max(0, Math.min(1, value));
        this._updateProperties();
        
        return this;
    }
    
    /**
     * Get current animation state
     */
    public getState(): TweenState {
        return this._state;
    }
    
    /**
     * Check if animation is playing
     */
    public isPlaying(): boolean {
        return this._state === TweenState.PLAYING;
    }
    
    /**
     * Check if animation is complete
     */
    public isComplete(): boolean {
        return this._state === TweenState.COMPLETED;
    }
    
    /**
     * Get the target object
     */
    public getTarget(): any {
        return this._target;
    }
    
    /**
     * Set easing function
     */
    public ease(easing: EasingFunction | string): Tween {
        if (typeof easing === 'string') {
            this._ease = Easing.getEasing(easing);
        } else {
            this._ease = easing;
        }
        return this;
    }
    
    /**
     * Set animation duration
     */
    public duration(ms: number): Tween {
        this._duration = ms;
        return this;
    }
    
    /**
     * Set animation delay
     */
    public delay(ms: number): Tween {
        this._delay = ms;
        return this;
    }
    
    /**
     * Set repeat count
     */
    public repeat(count: number): Tween {
        this._repeat = count;
        return this;
    }
    
    /**
     * Set yoyo mode (reverse on repeat)
     */
    public yoyo(enabled: boolean): Tween {
        this._yoyo = enabled;
        return this;
    }
    
    /**
     * Set callback functions
     */
    public onStart(callback: () => void): Tween {
        this._onStart = callback;
        return this;
    }
    
    public onUpdate(callback: (progress: number) => void): Tween {
        this._onUpdate = callback;
        return this;
    }
    
    public onComplete(callback: () => void): Tween {
        this._onComplete = callback;
        return this;
    }
    
    public onRepeat(callback: () => void): Tween {
        this._onRepeat = callback;
        return this;
    }
    
    /**
     * Create a promise that resolves when animation completes
     */
    public promise(): Promise<void> {
        return new Promise((resolve) => {
            this.onComplete(resolve);
        });
    }
    
    /**
     * Start the animation loop
     */
    private _startAnimation(): void {
        const animate = (currentTime: number) => {
            this._currentTime = currentTime - this._startTime;
            
            // Handle delay
            if (this._state === TweenState.DELAYED) {
                if (this._currentTime < this._delay) {
                    this._animationId = requestAnimationFrame(animate);
                    return;
                }
                this._state = TweenState.PLAYING;
                this._startTime += this._delay;
                this._currentTime = currentTime - this._startTime;
                
                // Call start callback
                if (this._onStart) {
                    this._onStart();
                }
            }
            
            // Calculate progress
            const rawProgress = this._currentTime / this._duration;
            
            if (rawProgress >= 1) {
                this._handleCompletion();
            } else {
                this._progress = rawProgress;
                this._updateProperties();
                
                // Continue animation
                if (this._state === TweenState.PLAYING) {
                    this._animationId = requestAnimationFrame(animate);
                }
            }
        };
        
        this._animationId = requestAnimationFrame(animate);
    }
    
    /**
     * Update target object properties
     */
    private _updateProperties(): void {
        let progress = this._progress;
        
        // Apply easing
        progress = this._ease(progress);
        
        // Reverse if needed
        if (this._isReversed) {
            progress = 1 - progress;
        }
        
        // Interpolate and apply property values
        for (const prop of this._properties) {
            const value = this._interpolate(prop.startValue, prop.endValue, progress);
            prop.currentValue = value;
            prop.target[prop.property] = value;
        }
        
        // Call update callback
        if (this._onUpdate) {
            this._onUpdate(this._progress);
        }
    }
    
    /**
     * Handle animation completion
     */
    private _handleCompletion(): void {
        this._progress = 1;
        this._updateProperties();
        
        // Handle repeats
        if (this._currentRepeat < this._repeat) {
            this._currentRepeat++;
            
            // Handle yoyo mode
            if (this._yoyo) {
                this._isReversed = !this._isReversed;
            } else {
                // Reset to start values
                for (const prop of this._properties) {
                    prop.target[prop.property] = prop.startValue;
                }
            }
            
            // Restart animation
            this._startTime = performance.now();
            this._currentTime = 0;
            this._progress = 0;
            
            if (this._onRepeat) {
                this._onRepeat();
            }
            
            this._startAnimation();
        } else {
            // Complete the animation
            this._state = TweenState.COMPLETED;
            
            if (this._onComplete) {
                this._onComplete();
            }
        }
    }
    
    /**
     * Linear interpolation between two values
     */
    private _interpolate(start: number, end: number, progress: number): number {
        return start + (end - start) * progress;
    }
    
    /**
     * Dispose of the tween
     */
    public dispose(): void {
        this.stop();
        this._properties = [];
        this._onStart = undefined;
        this._onUpdate = undefined;
        this._onComplete = undefined;
        this._onRepeat = undefined;
    }
}