"use strict";
/**
 * PowerScript Core Design Patterns
 * Implementation of essential design patterns for the framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueChangeCommand = exports.SimpleCommand = exports.SortStrategy = exports.CommandInvoker = exports.Context = exports.Factory = exports.Subject = exports.Singleton = void 0;
/**
 * Singleton Pattern Implementation
 */
class Singleton {
    static create(key, factory, config = {}) {
        const finalConfig = { lazy: true, threadSafe: true, ...config };
        if (!finalConfig.lazy || !this.instances.has(key)) {
            if (!this.instances.has(key)) {
                const instance = factory();
                this.instances.set(key, instance);
            }
        }
        return this.instances.get(key);
    }
    getInstance() {
        throw new Error('Use Singleton.create() instead of getInstance()');
    }
    static clear(key) {
        if (key) {
            this.instances.delete(key);
        }
        else {
            this.instances.clear();
        }
    }
    static getRegisteredKeys() {
        return Array.from(this.instances.keys());
    }
}
exports.Singleton = Singleton;
Singleton.instances = new Map();
/**
 * Observer Pattern Implementation
 */
class Subject {
    constructor(config = {}) {
        this.observers = [];
        this.config = {
            async: false,
            errorHandling: 'continue',
            ...config
        };
    }
    attach(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }
    detach(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }
    async notify(data) {
        if (this.observers.length === 0)
            return;
        const errors = [];
        if (this.config.async) {
            // Parallel execution
            const promises = this.observers.map(async (observer) => {
                try {
                    await observer.update(data);
                }
                catch (error) {
                    if (this.config.errorHandling === 'collect') {
                        errors.push(error);
                    }
                    else if (this.config.errorHandling === 'stop') {
                        throw error;
                    }
                    // 'continue' - silently ignore errors
                }
            });
            await Promise.all(promises);
        }
        else {
            // Sequential execution
            for (const observer of this.observers) {
                try {
                    const result = observer.update(data);
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                }
                catch (error) {
                    if (this.config.errorHandling === 'collect') {
                        errors.push(error);
                    }
                    else if (this.config.errorHandling === 'stop') {
                        throw error;
                    }
                    // 'continue' - silently ignore errors
                }
            }
        }
        if (errors.length > 0 && this.config.errorHandling === 'collect') {
            throw new Error(`Observer errors: ${errors.map(e => e.message).join(', ')}`);
        }
    }
    getObserverCount() {
        return this.observers.length;
    }
    clear() {
        this.observers = [];
    }
}
exports.Subject = Subject;
/**
 * Factory Pattern Implementation
 */
class Factory {
    constructor(config = {}) {
        this.constructors = new Map();
        this.config = {
            allowOverride: false,
            validateTypes: true,
            ...config
        };
    }
    register(type, constructor) {
        if (!this.config.allowOverride && this.constructors.has(type)) {
            throw new Error(`Type '${type}' is already registered`);
        }
        if (this.config.validateTypes && typeof constructor !== 'function') {
            throw new Error(`Constructor for type '${type}' must be a function`);
        }
        this.constructors.set(type, constructor);
    }
    create(type, ...args) {
        const Constructor = this.constructors.get(type);
        if (!Constructor) {
            throw new Error(`Unknown type: ${type}`);
        }
        try {
            return new Constructor(...args);
        }
        catch (error) {
            throw new Error(`Failed to create instance of type '${type}': ${error.message}`);
        }
    }
    hasType(type) {
        return this.constructors.has(type);
    }
    getRegisteredTypes() {
        return Array.from(this.constructors.keys());
    }
    unregister(type) {
        return this.constructors.delete(type);
    }
    clear() {
        this.constructors.clear();
    }
}
exports.Factory = Factory;
/**
 * Strategy Pattern Implementation
 */
class Context {
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    async executeStrategy(input) {
        if (!this.strategy) {
            throw new Error('No strategy set');
        }
        const result = this.strategy.execute(input);
        // Handle both sync and async strategies
        return result instanceof Promise ? result : Promise.resolve(result);
    }
    hasStrategy() {
        return this.strategy !== undefined;
    }
}
exports.Context = Context;
/**
 * Command Pattern Implementation
 */
class CommandInvoker {
    constructor(maxHistorySize = 100) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
    }
    async execute(command) {
        try {
            await command.execute();
            // Add to history (remove redo history if we're not at the end)
            if (this.currentIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.currentIndex + 1);
            }
            this.history.push(command);
            this.currentIndex++;
            // Maintain max history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.currentIndex--;
            }
        }
        catch (error) {
            throw new Error(`Command execution failed: ${error.message}`);
        }
    }
    async undo() {
        if (this.currentIndex < 0) {
            throw new Error('Nothing to undo');
        }
        const command = this.history[this.currentIndex];
        if (!command.undo) {
            throw new Error('Command does not support undo');
        }
        if (command.canUndo && !command.canUndo()) {
            throw new Error('Command cannot be undone in current state');
        }
        try {
            await command.undo();
            this.currentIndex--;
        }
        catch (error) {
            throw new Error(`Undo failed: ${error.message}`);
        }
    }
    async redo() {
        if (this.currentIndex >= this.history.length - 1) {
            throw new Error('Nothing to redo');
        }
        const command = this.history[this.currentIndex + 1];
        try {
            await command.execute();
            this.currentIndex++;
        }
        catch (error) {
            throw new Error(`Redo failed: ${error.message}`);
        }
    }
    getHistory() {
        return [...this.history];
    }
    canUndo() {
        return this.currentIndex >= 0 &&
            this.history[this.currentIndex]?.undo !== undefined;
    }
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
    getStats() {
        return {
            historySize: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}
exports.CommandInvoker = CommandInvoker;
/**
 * Example Strategy Implementations
 */
class SortStrategy {
}
exports.SortStrategy = SortStrategy;
SortStrategy.BUBBLE_SORT = {
    execute: (input) => {
        const arr = [...input];
        const n = arr.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                }
            }
        }
        return arr;
    }
};
SortStrategy.QUICK_SORT = {
    execute: (input) => {
        if (input.length <= 1)
            return input;
        const pivot = input[Math.floor(input.length / 2)];
        const left = input.filter(x => x < pivot);
        const middle = input.filter(x => x === pivot);
        const right = input.filter(x => x > pivot);
        const leftSorted = SortStrategy.QUICK_SORT.execute(left);
        const rightSorted = SortStrategy.QUICK_SORT.execute(right);
        return [
            ...leftSorted,
            ...middle,
            ...rightSorted
        ];
    }
};
/**
 * Example Command Implementations
 */
class SimpleCommand {
    constructor(action, undoAction) {
        this.action = action;
        this.undoAction = undoAction;
    }
    async execute() {
        await this.action();
    }
    async undo() {
        if (!this.undoAction) {
            throw new Error('Undo action not provided');
        }
        await this.undoAction();
    }
    canUndo() {
        return this.undoAction !== undefined;
    }
}
exports.SimpleCommand = SimpleCommand;
class ValueChangeCommand {
    constructor(target, newValue) {
        this.target = target;
        this.newValue = newValue;
        this.oldValue = target.value;
    }
    async execute() {
        this.target.value = this.newValue;
    }
    async undo() {
        this.target.value = this.oldValue;
    }
    canUndo() {
        return true;
    }
}
exports.ValueChangeCommand = ValueChangeCommand;
