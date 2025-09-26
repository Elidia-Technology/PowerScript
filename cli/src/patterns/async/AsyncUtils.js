"use strict";
/**
 * PowerScript Async Utilities
 * Advanced async/await patterns and utilities for robust operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncUtils = exports.AsyncUtils = exports.ThrottleUtility = exports.DebounceUtility = exports.TimeoutUtility = exports.CircuitBreaker = exports.RetryUtility = void 0;
/**
 * Retry Utility Implementation
 */
class RetryUtility {
    static async execute(fn, config) {
        const { maxAttempts, baseDelay, maxDelay = 30000, backoffFactor = 2, retryCondition = () => true } = config;
        let lastError;
        let delay = baseDelay;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
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
        throw new Error(`Max retry attempts (${maxAttempts}) exceeded. Last error: ${lastError.message}`);
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryUtility = RetryUtility;
/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
    constructor(fn, config) {
        this.fn = fn;
        this.config = config;
        this.state = 'CLOSED';
        this.failures = 0;
        this.lastFailureTime = 0;
        this.successCount = 0;
    }
    async execute() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await this.fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) { // Require 3 successes to close
                this.state = 'CLOSED';
            }
        }
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Timeout Utility
 */
class TimeoutUtility {
    static async execute(promise, timeoutMs, timeoutMessage = 'Operation timed out') {
        return new Promise((resolve, reject) => {
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
exports.TimeoutUtility = TimeoutUtility;
/**
 * Debounce Utility
 */
class DebounceUtility {
    static create(fn, delay, key) {
        const timerKey = key || fn.toString();
        return ((...args) => {
            const existingTimer = this.timers.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            const timer = setTimeout(() => {
                this.timers.delete(timerKey);
                fn(...args);
            }, delay);
            this.timers.set(timerKey, timer);
        });
    }
    static clear(key) {
        if (key) {
            const timer = this.timers.get(key);
            if (timer) {
                clearTimeout(timer);
                this.timers.delete(key);
            }
        }
        else {
            this.timers.forEach(timer => clearTimeout(timer));
            this.timers.clear();
        }
    }
}
exports.DebounceUtility = DebounceUtility;
DebounceUtility.timers = new Map();
/**
 * Throttle Utility
 */
class ThrottleUtility {
    static create(fn, interval, key) {
        const throttleKey = key || fn.toString();
        return ((...args) => {
            const now = Date.now();
            const lastTime = this.lastExecuted.get(throttleKey) || 0;
            if (now - lastTime >= interval) {
                this.lastExecuted.set(throttleKey, now);
                return fn(...args);
            }
        });
    }
    static clear(key) {
        if (key) {
            this.lastExecuted.delete(key);
        }
        else {
            this.lastExecuted.clear();
        }
    }
}
exports.ThrottleUtility = ThrottleUtility;
ThrottleUtility.lastExecuted = new Map();
/**
 * Async Utilities Implementation
 */
class AsyncUtils {
    async retry(fn, config) {
        return RetryUtility.execute(fn, config);
    }
    async timeout(promise, timeoutMs) {
        return TimeoutUtility.execute(promise, timeoutMs);
    }
    circuitBreaker(fn, config) {
        const breaker = new CircuitBreaker(fn, config);
        return () => breaker.execute();
    }
    debounce(fn, delay) {
        return DebounceUtility.create(fn, delay);
    }
    throttle(fn, interval) {
        return ThrottleUtility.create(fn, interval);
    }
    /**
     * Execute promises in parallel with concurrency limit
     */
    async parallelLimit(tasks, concurrency) {
        if (concurrency <= 0) {
            throw new Error('Concurrency must be greater than 0');
        }
        const results = [];
        const executing = [];
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
    async sequence(tasks) {
        const results = [];
        for (const task of tasks) {
            const result = await task();
            results.push(result);
        }
        return results;
    }
    /**
     * Race with timeout
     */
    async raceWithTimeout(promises, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Race timed out')), timeoutMs);
        });
        return Promise.race([...promises, timeoutPromise]);
    }
    /**
     * Async map with concurrency control
     */
    async map(items, mapper, concurrency = 10) {
        const tasks = items.map((item, index) => () => mapper(item, index));
        return this.parallelLimit(tasks, concurrency);
    }
    /**
     * Async filter
     */
    async filter(items, predicate) {
        const results = await Promise.all(items.map(async (item, index) => ({
            item,
            include: await predicate(item, index)
        })));
        return results.filter(({ include }) => include).map(({ item }) => item);
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create a cancellable promise
     */
    cancellable(promise) {
        let cancelled = false;
        let cancelReject;
        const cancellablePromise = new Promise((resolve, reject) => {
            cancelReject = reject;
            promise
                .then(result => {
                if (!cancelled)
                    resolve(result);
            })
                .catch(error => {
                if (!cancelled)
                    reject(error);
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
    async isResolved(promise) {
        try {
            await Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 0))
            ]);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.AsyncUtils = AsyncUtils;
/**
 * Global Async Utilities Instance
 */
exports.asyncUtils = new AsyncUtils();
