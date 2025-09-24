/**
 * PowerScript AS3 Dynamic Classes Support
 * 
 * Provides dynamic class creation and runtime manipulation capabilities
 * similar to ActionScript 3's dynamic classes.
 */

export interface DynamicClassOptions {
    allowDynamicProperties?: boolean;
    allowDynamicMethods?: boolean;
    sealedAfterConstruction?: boolean;
    enableEventDispatcher?: boolean;
}

export interface DynamicPropertyDescriptor {
    value?: any;
    get?: () => any;
    set?: (value: any) => void;
    enumerable?: boolean;
    configurable?: boolean;
}

/**
 * Dynamic class that allows runtime property and method addition
 */
export class DynamicClass {
    private _sealed: boolean = false;
    private _options: DynamicClassOptions;
    private _dynamicProperties: Map<string, any> = new Map();
    private _dynamicMethods: Map<string, Function> = new Map();

    constructor(options: DynamicClassOptions = {}) {
        this._options = {
            allowDynamicProperties: true,
            allowDynamicMethods: true,
            sealedAfterConstruction: false,
            enableEventDispatcher: false,
            ...options
        };

        // Create proxy to intercept property access
        return new Proxy(this, {
            get: (target, prop, receiver) => this._getProperty(target, prop, receiver),
            set: (target, prop, value, receiver) => this._setProperty(target, prop, value, receiver),
            has: (target, prop) => this._hasProperty(target, prop),
            ownKeys: (target) => this._getOwnKeys(target),
            getOwnPropertyDescriptor: (target, prop) => this._getOwnPropertyDescriptor(target, prop),
            defineProperty: (target, prop, descriptor) => this._defineProperty(target, prop, descriptor)
        });
    }

    /**
     * Seal the object to prevent further dynamic modifications
     */
    public seal(): void {
        this._sealed = true;
    }

    /**
     * Check if object is sealed
     */
    public isSealed(): boolean {
        return this._sealed;
    }

    /**
     * Add a dynamic property
     */
    public addProperty(name: string, value: any): void {
        if (this._sealed || !this._options.allowDynamicProperties) {
            throw new Error(`Cannot add dynamic property '${name}': object is sealed or dynamic properties are disabled`);
        }

        this._dynamicProperties.set(name, value);
    }

    /**
     * Add a dynamic method
     */
    public addMethod(name: string, method: Function): void {
        if (this._sealed || !this._options.allowDynamicMethods) {
            throw new Error(`Cannot add dynamic method '${name}': object is sealed or dynamic methods are disabled`);
        }

        this._dynamicMethods.set(name, method);
    }

    /**
     * Remove a dynamic property
     */
    public removeProperty(name: string): boolean {
        if (this._sealed) {
            throw new Error(`Cannot remove property '${name}': object is sealed`);
        }

        return this._dynamicProperties.delete(name) || this._dynamicMethods.delete(name);
    }

    /**
     * Check if property exists
     */
    public hasProperty(name: string): boolean {
        return this._hasProperty(this, name);
    }

    /**
     * Get all dynamic property names
     */
    public getDynamicProperties(): string[] {
        return [...this._dynamicProperties.keys(), ...this._dynamicMethods.keys()];
    }

    /**
     * Get all property names (including static ones)
     */
    public getAllProperties(): string[] {
        const staticProps = Object.getOwnPropertyNames(this);
        const dynamicProps = this.getDynamicProperties();
        return [...new Set([...staticProps, ...dynamicProps])];
    }

    // Proxy handlers
    private _getProperty(target: any, prop: string | symbol, receiver: any): any {
        const propName = String(prop);

        // Check for special methods
        if (propName === 'seal') return this.seal.bind(this);
        if (propName === 'isSealed') return this.isSealed.bind(this);
        if (propName === 'addProperty') return this.addProperty.bind(this);
        if (propName === 'addMethod') return this.addMethod.bind(this);
        if (propName === 'removeProperty') return this.removeProperty.bind(this);
        if (propName === 'hasProperty') return this.hasProperty.bind(this);
        if (propName === 'getDynamicProperties') return this.getDynamicProperties.bind(this);
        if (propName === 'getAllProperties') return this.getAllProperties.bind(this);

        // Check dynamic methods first
        if (this._dynamicMethods.has(propName)) {
            const method = this._dynamicMethods.get(propName);
            return method?.bind(this);
        }

        // Check dynamic properties
        if (this._dynamicProperties.has(propName)) {
            return this._dynamicProperties.get(propName);
        }

        // Check static properties
        if (prop in target) {
            return Reflect.get(target, prop, receiver);
        }

        // Return undefined for non-existent properties
        return undefined;
    }

    private _setProperty(target: any, prop: string | symbol, value: any, receiver: any): boolean {
        const propName = String(prop);

        // Prevent setting special properties
        if (propName.startsWith('_') || propName === 'constructor') {
            return Reflect.set(target, prop, value, receiver);
        }

        // If property exists statically, set it normally
        if (prop in target) {
            return Reflect.set(target, prop, value, receiver);
        }

        // Handle dynamic property setting
        if (this._sealed) {
            throw new Error(`Cannot set property '${propName}': object is sealed`);
        }

        if (typeof value === 'function') {
            if (!this._options.allowDynamicMethods) {
                throw new Error(`Cannot set dynamic method '${propName}': dynamic methods are disabled`);
            }
            this._dynamicMethods.set(propName, value);
        } else {
            if (!this._options.allowDynamicProperties) {
                throw new Error(`Cannot set dynamic property '${propName}': dynamic properties are disabled`);
            }
            this._dynamicProperties.set(propName, value);
        }

        return true;
    }

    private _hasProperty(target: any, prop: string | symbol): boolean {
        const propName = String(prop);
        return prop in target || 
               this._dynamicProperties.has(propName) || 
               this._dynamicMethods.has(propName);
    }

    private _getOwnKeys(target: any): (string | symbol)[] {
        const staticKeys = Reflect.ownKeys(target);
        const dynamicKeys = [...this._dynamicProperties.keys(), ...this._dynamicMethods.keys()];
        return [...staticKeys, ...dynamicKeys];
    }

    private _getOwnPropertyDescriptor(target: any, prop: string | symbol): PropertyDescriptor | undefined {
        const propName = String(prop);

        // Check dynamic properties
        if (this._dynamicProperties.has(propName)) {
            return {
                value: this._dynamicProperties.get(propName),
                writable: !this._sealed,
                enumerable: true,
                configurable: !this._sealed
            };
        }

        // Check dynamic methods
        if (this._dynamicMethods.has(propName)) {
            return {
                value: this._dynamicMethods.get(propName),
                writable: !this._sealed,
                enumerable: true,
                configurable: !this._sealed
            };
        }

        // Check static properties
        return Reflect.getOwnPropertyDescriptor(target, prop);
    }

    private _defineProperty(target: any, prop: string | symbol, descriptor: PropertyDescriptor): boolean {
        const propName = String(prop);

        if (this._sealed) {
            throw new Error(`Cannot define property '${propName}': object is sealed`);
        }

        // If it's a static property, define it normally
        if (prop in target) {
            return Reflect.defineProperty(target, prop, descriptor);
        }

        // Handle dynamic property definition
        if (descriptor.value !== undefined) {
            if (typeof descriptor.value === 'function') {
                if (!this._options.allowDynamicMethods) {
                    throw new Error(`Cannot define dynamic method '${propName}': dynamic methods are disabled`);
                }
                this._dynamicMethods.set(propName, descriptor.value);
            } else {
                if (!this._options.allowDynamicProperties) {
                    throw new Error(`Cannot define dynamic property '${propName}': dynamic properties are disabled`);
                }
                this._dynamicProperties.set(propName, descriptor.value);
            }
            return true;
        }

        // Handle getter/setter properties
        if (descriptor.get || descriptor.set) {
            const accessorObj = {
                get: descriptor.get,
                set: descriptor.set
            };
            this._dynamicProperties.set(propName, accessorObj);
            return true;
        }

        return false;
    }
}

/**
 * Dynamic class factory
 */
export class DynamicClassFactory {
    /**
     * Create a new dynamic class
     */
    public static create<T = any>(options?: DynamicClassOptions): T & DynamicClass {
        return new DynamicClass(options) as T & DynamicClass;
    }

    /**
     * Make an existing object dynamic
     */
    public static makeDynamic<T>(obj: T, options?: DynamicClassOptions): T & DynamicClass {
        const dynamicClass = new DynamicClass(options);
        
        // Copy existing properties
        for (const key of Object.keys(obj as any)) {
            (dynamicClass as any)[key] = (obj as any)[key];
        }

        return dynamicClass as T & DynamicClass;
    }

    /**
     * Create dynamic class from template
     */
    public static fromTemplate<T>(
        template: Partial<T>, 
        options?: DynamicClassOptions
    ): T & DynamicClass {
        const dynamicClass = new DynamicClass(options);
        
        // Apply template properties
        for (const [key, value] of Object.entries(template)) {
            if (typeof value === 'function') {
                dynamicClass.addMethod(key, value);
            } else {
                dynamicClass.addProperty(key, value);
            }
        }

        return dynamicClass as T & DynamicClass;
    }
}

/**
 * AS3-style dynamic decorator
 */
export function dynamic(options?: DynamicClassOptions) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                
                // Make this instance dynamic
                const dynamicInstance = DynamicClassFactory.makeDynamic(this, options);
                return dynamicInstance;
            }
        } as any;
    };
}

/**
 * AS3-style sealed decorator
 */
export function sealed<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        constructor(...args: any[]) {
            super(...args);
            
            // Seal the object
            Object.seal(this);
        }
    } as any;
}

// Utility functions for AS3 compatibility

/**
 * Check if object has property (AS3 hasOwnProperty equivalent)
 */
export function hasOwnProperty(obj: any, prop: string): boolean {
    if (obj instanceof DynamicClass) {
        return obj.hasProperty(prop);
    }
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Get all enumerable properties (AS3 for...in equivalent)
 */
export function getEnumerableProperties(obj: any): string[] {
    if (obj instanceof DynamicClass) {
        return obj.getAllProperties().filter(prop => {
            const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return descriptor?.enumerable !== false;
        });
    }
    
    const props: string[] = [];
    for (const prop in obj) {
        props.push(prop);
    }
    return props;
}

/**
 * Delete property (AS3 delete operator equivalent)
 */
export function deleteProperty(obj: any, prop: string): boolean {
    if (obj instanceof DynamicClass) {
        return obj.removeProperty(prop);
    }
    
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        delete obj[prop];
        return true;
    }
    
    return false;
}

// Export everything
export default DynamicClass;