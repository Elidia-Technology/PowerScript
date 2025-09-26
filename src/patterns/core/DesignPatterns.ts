/**
 * PowerScript Core Design Patterns
 * Implementation of essential design patterns for the framework
 */

import { 
    ISingleton, 
    SingletonConfig,
    IObserver, 
    ISubject, 
    ObserverConfig,
    IFactory,
    FactoryConfig,
    IStrategy,
    IContext,
    ICommand,
    ICommandInvoker
} from '../types';

/**
 * Singleton Pattern Implementation
 */
export class Singleton implements ISingleton {
    private static instances = new Map<string, any>();
    
    static create<T>(
        key: string,
        factory: () => T,
        config: SingletonConfig = {}
    ): T {
        const finalConfig = { lazy: true, threadSafe: true, ...config };
        
        if (!finalConfig.lazy || !this.instances.has(key)) {
            if (!this.instances.has(key)) {
                const instance = factory();
                this.instances.set(key, instance);
            }
        }
        
        return this.instances.get(key);
    }

    getInstance(): any {
        throw new Error('Use Singleton.create() instead of getInstance()');
    }

    static clear(key?: string): void {
        if (key) {
            this.instances.delete(key);
        } else {
            this.instances.clear();
        }
    }

    static getRegisteredKeys(): string[] {
        return Array.from(this.instances.keys());
    }
}

/**
 * Observer Pattern Implementation
 */
export class Subject<T = any> implements ISubject<T> {
    private observers: IObserver<T>[] = [];
    private config: ObserverConfig;

    constructor(config: ObserverConfig = {}) {
        this.config = {
            async: false,
            errorHandling: 'continue',
            ...config
        };
    }

    attach(observer: IObserver<T>): void {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    detach(observer: IObserver<T>): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    async notify(data: T): Promise<void> {
        if (this.observers.length === 0) return;

        const errors: Error[] = [];

        if (this.config.async) {
            // Parallel execution
            const promises = this.observers.map(async observer => {
                try {
                    await observer.update(data);
                } catch (error) {
                    if (this.config.errorHandling === 'collect') {
                        errors.push(error as Error);
                    } else if (this.config.errorHandling === 'stop') {
                        throw error;
                    }
                    // 'continue' - silently ignore errors
                }
            });

            await Promise.all(promises);
        } else {
            // Sequential execution
            for (const observer of this.observers) {
                try {
                    const result = observer.update(data);
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                } catch (error) {
                    if (this.config.errorHandling === 'collect') {
                        errors.push(error as Error);
                    } else if (this.config.errorHandling === 'stop') {
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

    getObserverCount(): number {
        return this.observers.length;
    }

    clear(): void {
        this.observers = [];
    }
}

/**
 * Factory Pattern Implementation
 */
export class Factory<T = any> implements IFactory<T> {
    private constructors = new Map<string, new (...args: any[]) => T>();
    private config: FactoryConfig;

    constructor(config: FactoryConfig = {}) {
        this.config = {
            allowOverride: false,
            validateTypes: true,
            ...config
        };
    }

    register(type: string, constructor: new (...args: any[]) => T): void {
        if (!this.config.allowOverride && this.constructors.has(type)) {
            throw new Error(`Type '${type}' is already registered`);
        }

        if (this.config.validateTypes && typeof constructor !== 'function') {
            throw new Error(`Constructor for type '${type}' must be a function`);
        }

        this.constructors.set(type, constructor);
    }

    create(type: string, ...args: any[]): T {
        const Constructor = this.constructors.get(type);
        
        if (!Constructor) {
            throw new Error(`Unknown type: ${type}`);
        }

        try {
            return new Constructor(...args);
        } catch (error) {
            throw new Error(`Failed to create instance of type '${type}': ${(error as Error).message}`);
        }
    }

    hasType(type: string): boolean {
        return this.constructors.has(type);
    }

    getRegisteredTypes(): string[] {
        return Array.from(this.constructors.keys());
    }

    unregister(type: string): boolean {
        return this.constructors.delete(type);
    }

    clear(): void {
        this.constructors.clear();
    }
}

/**
 * Strategy Pattern Implementation
 */
export class Context<TInput = any, TOutput = any> implements IContext<TInput, TOutput> {
    private strategy?: IStrategy<TInput, TOutput>;

    setStrategy(strategy: IStrategy<TInput, TOutput>): void {
        this.strategy = strategy;
    }

    async executeStrategy(input: TInput): Promise<TOutput> {
        if (!this.strategy) {
            throw new Error('No strategy set');
        }

        const result = this.strategy.execute(input);
        
        // Handle both sync and async strategies
        return result instanceof Promise ? result : Promise.resolve(result);
    }

    hasStrategy(): boolean {
        return this.strategy !== undefined;
    }
}

/**
 * Command Pattern Implementation
 */
export class CommandInvoker implements ICommandInvoker {
    private history: ICommand[] = [];
    private currentIndex = -1;
    private maxHistorySize: number;

    constructor(maxHistorySize: number = 100) {
        this.maxHistorySize = maxHistorySize;
    }

    async execute(command: ICommand): Promise<void> {
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
        } catch (error) {
            throw new Error(`Command execution failed: ${(error as Error).message}`);
        }
    }

    async undo(): Promise<void> {
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
        } catch (error) {
            throw new Error(`Undo failed: ${(error as Error).message}`);
        }
    }

    async redo(): Promise<void> {
        if (this.currentIndex >= this.history.length - 1) {
            throw new Error('Nothing to redo');
        }

        const command = this.history[this.currentIndex + 1];
        
        try {
            await command.execute();
            this.currentIndex++;
        } catch (error) {
            throw new Error(`Redo failed: ${(error as Error).message}`);
        }
    }

    getHistory(): ICommand[] {
        return [...this.history];
    }

    canUndo(): boolean {
        return this.currentIndex >= 0 && 
               this.history[this.currentIndex]?.undo !== undefined;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }

    getStats(): {
        historySize: number;
        currentIndex: number;
        canUndo: boolean;
        canRedo: boolean;
    } {
        return {
            historySize: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}

/**
 * Example Strategy Implementations
 */
export class SortStrategy {
    static BUBBLE_SORT: IStrategy<number[], number[]> = {
        execute: (input: number[]) => {
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

    static QUICK_SORT: IStrategy<number[], number[]> = {
        execute: (input: number[]): number[] => {
            if (input.length <= 1) return input;
            
            const pivot = input[Math.floor(input.length / 2)];
            const left = input.filter(x => x < pivot);
            const middle = input.filter(x => x === pivot);
            const right = input.filter(x => x > pivot);
            
            const leftSorted = SortStrategy.QUICK_SORT.execute(left) as number[];
            const rightSorted = SortStrategy.QUICK_SORT.execute(right) as number[];
            
            return [
                ...leftSorted,
                ...middle,
                ...rightSorted
            ];
        }
    };
}

/**
 * Example Command Implementations
 */
export class SimpleCommand implements ICommand {
    constructor(
        private action: () => void | Promise<void>,
        private undoAction?: () => void | Promise<void>
    ) {}

    async execute(): Promise<void> {
        await this.action();
    }

    async undo(): Promise<void> {
        if (!this.undoAction) {
            throw new Error('Undo action not provided');
        }
        await this.undoAction();
    }

    canUndo(): boolean {
        return this.undoAction !== undefined;
    }
}

export class ValueChangeCommand<T> implements ICommand {
    private oldValue: T;
    
    constructor(
        private target: { value: T },
        private newValue: T
    ) {
        this.oldValue = target.value;
    }

    async execute(): Promise<void> {
        this.target.value = this.newValue;
    }

    async undo(): Promise<void> {
        this.target.value = this.oldValue;
    }

    canUndo(): boolean {
        return true;
    }
}