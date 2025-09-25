/**
 * PowerScript Async Utilities
 * Advanced async/await patterns and utilities for robust operations
 */

import { 
    IAsyncUtils, 
    IRetryConfig, 
    ICircuitBreakerConfig, 
    AsyncFunction 
} from '../types';

/**
 * Retry Utility Implementation
 */
export class RetryUtility {
    static async execute<T>(
        fn: AsyncFunction<T>,
        config: IRetryConfig
    ): Promise<T> {
        const {
            maxAttempts,
            baseDelay,
            maxDelay = 30000,
            backoffFactor = 2,
            retryCondition = () => true
        } = config;

        let lastError: Error;
        let delay = baseDelay;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                // Check if we should retry this error
                if (!retryCondition(lastError)) {
                    throw lastError;
                }

                // Don't delay on last attempt
                if (attempt === maxAttempts) {
                    break;
                }

                // Wait before next attempt
                await this.sleep(Math.min(delay, maxDelay));
                delay *= backoffFactor;
            }
        }

        throw new Error(`Max retry attempts (${maxAttempts}) exceeded. Last error: ${lastError!.message}`);
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Circuit Breaker Implementation
 */
export class CircuitBreaker<T> {
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private failures = 0;
    private lastFailureTime = 0;
    private successCount = 0;

    constructor(
        private fn: AsyncFunction<T>,
        private config: ICircuitBreakerConfig
    ) {}

    async execute(): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await this.fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) { // Require 3 successes to close
                this.state = 'CLOSED';
            }
        }
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }

    getState(): { 
        state: string; 
        failures: number; 
        successCount: number; 
        lastFailureTime: number; 
    } {
        return {
            state: this.state,
            failures: this.failures,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}

/**
 * Timeout Utility
 */
export class TimeoutUtility {
    static async execute<T>(
        promise: Promise<T>,
        timeoutMs: number,
        timeoutMessage = 'Operation timed out'
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);

            promise
                .then(result => {
                    clearTimeout(timeoutHandle);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutHandle);
                    reject(error);
                });
        });
    }
}

/**
 * Debounce Utility
 */
export class DebounceUtility {
    private static timers = new Map<string, NodeJS.Timeout>();

    static create<T extends (...args: any[]) => any>(
        fn: T,
        delay: number,
        key?: string
    ): T {
        const timerKey = key || fn.toString();

        return ((...args: Parameters<T>) => {
            const existingTimer = this.timers.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                this.timers.delete(timerKey);
                fn(...args);
            }, delay);

            this.timers.set(timerKey, timer);
        }) as T;
    }

    static clear(key?: string): void {
        if (key) {
            const timer = this.timers.get(key);
            if (timer) {
                clearTimeout(timer);
                this.timers.delete(key);
            }
        } else {
            this.timers.forEach(timer => clearTimeout(timer));
            this.timers.clear();
        }
    }
}

/**
 * Throttle Utility
 */
export class ThrottleUtility {
    private static lastExecuted = new Map<string, number>();

    static create<T extends (...args: any[]) => any>(
        fn: T,
        interval: number,
        key?: string
    ): T {
        const throttleKey = key || fn.toString();

        return ((...args: Parameters<T>) => {
            const now = Date.now();
            const lastTime = this.lastExecuted.get(throttleKey) || 0;

            if (now - lastTime >= interval) {
                this.lastExecuted.set(throttleKey, now);
                return fn(...args);
            }
        }) as T;
    }

    static clear(key?: string): void {
        if (key) {
            this.lastExecuted.delete(key);
        } else {
            this.lastExecuted.clear();
        }
    }
}

/**
 * Async Utilities Implementation
 */
export class AsyncUtils implements IAsyncUtils {
    async retry<T>(fn: AsyncFunction<T>, config: IRetryConfig): Promise<T> {
        return RetryUtility.execute(fn, config);
    }

    async timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return TimeoutUtility.execute(promise, timeoutMs);
    }

    circuitBreaker<T>(fn: AsyncFunction<T>, config: ICircuitBreakerConfig): AsyncFunction<T> {
        const breaker = new CircuitBreaker(fn, config);
        return () => breaker.execute();
    }

    debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
        return DebounceUtility.create(fn, delay);
    }

    throttle<T extends (...args: any[]) => any>(fn: T, interval: number): T {
        return ThrottleUtility.create(fn, interval);
    }

    /**
     * Execute promises in parallel with concurrency limit
     */
    async parallelLimit<T>(
        tasks: (() => Promise<T>)[],
        concurrency: number
    ): Promise<T[]> {
        if (concurrency <= 0) {
            throw new Error('Concurrency must be greater than 0');
        }

        const results: T[] = [];
        const executing: Promise<void>[] = [];

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            
            const promise = task().then(result => {
                results[i] = result;
            });

            executing.push(promise);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
                // Remove completed promises
                for (let j = executing.length - 1; j >= 0; j--) {
                    if (await this.isResolved(executing[j])) {
                        executing.splice(j, 1);
                    }
                }
            }
        }

        await Promise.all(executing);
        return results;
    }

    /**
     * Execute promises in sequence
     */
    async sequence<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
        const results: T[] = [];
        
        for (const task of tasks) {
            const result = await task();
            results.push(result);
        }
        
        return results;
    }

    /**
     * Race with timeout
     */
    async raceWithTimeout<T>(
        promises: Promise<T>[],
        timeoutMs: number
    ): Promise<T> {
        const timeoutPromise = new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error('Race timed out')), timeoutMs);
        });

        return Promise.race([...promises, timeoutPromise]);
    }

    /**
     * Async map with concurrency control
     */
    async map<T, U>(
        items: T[],
        mapper: (item: T, index: number) => Promise<U>,
        concurrency = 10
    ): Promise<U[]> {
        const tasks = items.map((item, index) => () => mapper(item, index));
        return this.parallelLimit(tasks, concurrency);
    }

    /**
     * Async filter
     */
    async filter<T>(
        items: T[],
        predicate: (item: T, index: number) => Promise<boolean>
    ): Promise<T[]> {
        const results = await Promise.all(
            items.map(async (item, index) => ({
                item,
                include: await predicate(item, index)
            }))
        );

        return results.filter(({ include }) => include).map(({ item }) => item);
    }

    /**
     * Sleep utility
     */
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a cancellable promise
     */
    cancellable<T>(promise: Promise<T>): {
        promise: Promise<T>;
        cancel: () => void;
        isCancelled: () => boolean;
    } {
        let cancelled = false;
        let cancelReject: (reason?: any) => void;

        const cancellablePromise = new Promise<T>((resolve, reject) => {
            cancelReject = reject;

            promise
                .then(result => {
                    if (!cancelled) resolve(result);
                })
                .catch(error => {
                    if (!cancelled) reject(error);
                });
        });

        return {
            promise: cancellablePromise,
            cancel: () => {
                cancelled = true;
                cancelReject(new Error('Operation cancelled'));
            },
            isCancelled: () => cancelled
        };
    }

    private async isResolved(promise: Promise<void>): Promise<boolean> {
        try {
            await Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 0))
            ]);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Global Async Utilities Instance
 */
export const asyncUtils = new AsyncUtils();