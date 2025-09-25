/**
 * PowerScript Animation Controller
 * Central manager for all animations and tweens in the system
 */

import { Tween, TweenOptions, TweenState } from './Tween';

/**
 * Animation controller statistics
 */
export interface AnimationStats {
    activeTweens: number;
    totalTweens: number;
    frameRate: number;
    averageFrameTime: number;
    memoryUsage: number;
}

/**
 * Global animation settings
 */
export interface AnimationSettings {
    globalTimeScale: number;
    maxTweensPerFrame: number;
    enableOptimizations: boolean;
    targetFrameRate: number;
}

/**
 * Central animation controller for managing all tweens
 */
export class AnimationController {
    private static _instance: AnimationController;
    
    private _tweens: Set<Tween> = new Set();
    private _isRunning: boolean = false;
    private _animationId: number = 0;
    private _lastFrameTime: number = 0;
    private _frameCount: number = 0;
    private _totalFrameTime: number = 0;
    
    // Settings
    private _settings: AnimationSettings = {
        globalTimeScale: 1.0,
        maxTweensPerFrame: 1000,
        enableOptimizations: true,
        targetFrameRate: 60
    };
    
    // Statistics
    private _stats: AnimationStats = {
        activeTweens: 0,
        totalTweens: 0,
        frameRate: 0,
        averageFrameTime: 0,
        memoryUsage: 0
    };
    
    /**
     * Get singleton instance
     */
    public static getInstance(): AnimationController {
        if (!AnimationController._instance) {
            AnimationController._instance = new AnimationController();
        }
        return AnimationController._instance;
    }
    
    private constructor() {
        this._startUpdateLoop();
    }
    
    /**
     * Create a new tween
     */
    public createTween(target: any, options?: TweenOptions): Tween {
        const tween = new Tween(target, options);
        this._tweens.add(tween);
        this._stats.totalTweens++;
        return tween;
    }
    
    /**
     * Remove a tween from management
     */
    public removeTween(tween: Tween): void {
        if (this._tweens.has(tween)) {
            this._tweens.delete(tween);
            tween.dispose();
        }
    }
    
    /**
     * Remove all tweens for a specific target object
     */
    public removeTweensForTarget(target: any): void {
        const tweensToRemove: Tween[] = [];
        
        for (const tween of this._tweens) {
            if (tween.getTarget() === target) {
                tweensToRemove.push(tween);
            }
        }
        
        for (const tween of tweensToRemove) {
            this.removeTween(tween);
        }
    }
    
    /**
     * Pause all animations
     */
    public pauseAll(): void {
        for (const tween of this._tweens) {
            if (tween.isPlaying()) {
                tween.pause();
            }
        }
    }
    
    /**
     * Resume all animations
     */
    public resumeAll(): void {
        for (const tween of this._tweens) {
            if (tween.getState() === TweenState.PAUSED) {
                tween.resume();
            }
        }
    }
    
    /**
     * Stop all animations
     */
    public stopAll(): void {
        for (const tween of this._tweens) {
            tween.stop();
        }
        this._tweens.clear();
    }
    
    /**
     * Get all active tweens
     */
    public getActiveTweens(): Tween[] {
        return Array.from(this._tweens).filter(tween => tween.isPlaying());
    }
    
    /**
     * Get all tweens for a specific target
     */
    public getTweensForTarget(target: any): Tween[] {
        return Array.from(this._tweens).filter(tween => tween.getTarget() === target);
    }
    
    /**
     * Set global time scale (affects all animations)
     */
    public setTimeScale(scale: number): void {
        this._settings.globalTimeScale = Math.max(0, scale);
    }
    
    /**
     * Get global time scale
     */
    public getTimeScale(): number {
        return this._settings.globalTimeScale;
    }
    
    /**
     * Update animation settings
     */
    public updateSettings(settings: Partial<AnimationSettings>): void {
        Object.assign(this._settings, settings);
    }
    
    /**
     * Get current animation settings
     */
    public getSettings(): AnimationSettings {
        return { ...this._settings };
    }
    
    /**
     * Get animation statistics
     */
    public getStats(): AnimationStats {
        return { ...this._stats };
    }
    
    /**
     * Start the animation update loop
     */
    private _startUpdateLoop(): void {
        if (this._isRunning) return;
        
        this._isRunning = true;
        this._lastFrameTime = performance.now();
        
        const update = (currentTime: number) => {
            if (!this._isRunning) return;
            
            // Calculate frame timing
            const deltaTime = currentTime - this._lastFrameTime;
            this._lastFrameTime = currentTime;
            this._frameCount++;
            this._totalFrameTime += deltaTime;
            
            // Update statistics
            this._updateStats(deltaTime);
            
            // Clean up completed tweens
            this._cleanupTweens();
            
            // Continue update loop
            this._animationId = requestAnimationFrame(update);
        };
        
        this._animationId = requestAnimationFrame(update);
    }
    
    /**
     * Stop the animation update loop
     */
    private _stopUpdateLoop(): void {
        this._isRunning = false;
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = 0;
        }
    }
    
    /**
     * Update performance statistics
     */
    private _updateStats(deltaTime: number): void {
        this._stats.activeTweens = this.getActiveTweens().length;
        this._stats.frameRate = this._frameCount > 0 ? 1000 / (this._totalFrameTime / this._frameCount) : 0;
        this._stats.averageFrameTime = this._frameCount > 0 ? this._totalFrameTime / this._frameCount : 0;
        this._stats.memoryUsage = this._tweens.size * 1024; // Rough estimate
    }
    
    /**
     * Clean up completed and disposed tweens
     */
    private _cleanupTweens(): void {
        const tweensToRemove: Tween[] = [];
        
        for (const tween of this._tweens) {
            if (tween.isComplete()) {
                tweensToRemove.push(tween);
            }
        }
        
        for (const tween of tweensToRemove) {
            this._tweens.delete(tween);
        }
    }
    
    /**
     * Dispose of the animation controller
     */
    public dispose(): void {
        this.stopAll();
        this._stopUpdateLoop();
        AnimationController._instance = null as any;
    }
}

/**
 * Convenience functions for common animation operations
 */
export class TweenManager {
    private static _controller = AnimationController.getInstance();
    
    /**
     * Create and start a tween animation
     */
    public static to(target: any, properties: { [key: string]: number }, duration: number = 1000, options?: TweenOptions): Tween {
        const tween = TweenManager._controller.createTween(target, { ...options, duration });
        return tween.to(properties, duration);
    }
    
    /**
     * Create a tween from current values to specified properties
     */
    public static from(target: any, properties: { [key: string]: number }, duration: number = 1000, options?: TweenOptions): Tween {
        // Store current values
        const currentValues: { [key: string]: number } = {};
        const targetValues: { [key: string]: number } = {};
        
        for (const prop in properties) {
            if (target.hasOwnProperty(prop)) {
                currentValues[prop] = target[prop];
                targetValues[prop] = target[prop];
                target[prop] = properties[prop]; // Set start values
            }
        }
        
        const tween = TweenManager._controller.createTween(target, { ...options, duration });
        return tween.to(targetValues, duration);
    }
    
    /**
     * Create a delayed tween
     */
    public static delayedCall(delay: number, callback: () => void): Tween {
        const dummyTarget = {};
        const tween = TweenManager._controller.createTween(dummyTarget, {
            delay,
            duration: 1,
            onComplete: callback
        });
        return tween.to({}, 1);
    }
    
    /**
     * Kill all tweens for a target
     */
    public static killTweensOf(target: any): void {
        TweenManager._controller.removeTweensForTarget(target);
    }
    
    /**
     * Kill all tweens
     */
    public static killAll(): void {
        TweenManager._controller.stopAll();
    }
    
    /**
     * Pause all tweens
     */
    public static pauseAll(): void {
        TweenManager._controller.pauseAll();
    }
    
    /**
     * Resume all tweens
     */
    public static resumeAll(): void {
        TweenManager._controller.resumeAll();
    }
    
    /**
     * Set global time scale
     */
    public static timeScale(scale: number): void {
        TweenManager._controller.setTimeScale(scale);
    }
    
    /**
     * Get animation statistics
     */
    public static getStats(): AnimationStats {
        return TweenManager._controller.getStats();
    }
}