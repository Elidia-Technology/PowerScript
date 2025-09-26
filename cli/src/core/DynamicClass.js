"use strict";
/**
 * PowerScript AS3 Dynamic Classes Support
 *
 * Provides dynamic class creation and runtime manipulation capabilities
 * similar to PowerScript's dynamic classes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicClassFactory = exports.DynamicClass = void 0;
exports.dynamic = dynamic;
exports.sealed = sealed;
exports.hasOwnProperty = hasOwnProperty;
exports.getEnumerableProperties = getEnumerableProperties;
exports.deleteProperty = deleteProperty;
/**
 * Dynamic class that allows runtime property and method addition
 */
class DynamicClass {
    constructor(options = {}) {
        this._sealed = false;
        this._dynamicProperties = new Map();
        this._dynamicMethods = new Map();
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
    seal() {
        this._sealed = true;
    }
    /**
     * Check if object is sealed
     */
    isSealed() {
        return this._sealed;
    }
    /**
     * Add a dynamic property
     */
    addProperty(name, value) {
        if (this._sealed || !this._options.allowDynamicProperties) {
            throw new Error(`Cannot add dynamic property '${name}': object is sealed or dynamic properties are disabled`);
        }
        this._dynamicProperties.set(name, value);
    }
    /**
     * Add a dynamic method
     */
    addMethod(name, method) {
        if (this._sealed || !this._options.allowDynamicMethods) {
            throw new Error(`Cannot add dynamic method '${name}': object is sealed or dynamic methods are disabled`);
        }
        this._dynamicMethods.set(name, method);
    }
    /**
     * Remove a dynamic property
     */
    removeProperty(name) {
        if (this._sealed) {
            throw new Error(`Cannot remove property '${name}': object is sealed`);
        }
        return this._dynamicProperties.delete(name) || this._dynamicMethods.delete(name);
    }
    /**
     * Check if property exists
     */
    hasProperty(name) {
        return this._hasProperty(this, name);
    }
    /**
     * Get all dynamic property names
     */
    getDynamicProperties() {
        return [...this._dynamicProperties.keys(), ...this._dynamicMethods.keys()];
    }
    /**
     * Get all property names (including static ones)
     */
    getAllProperties() {
        const staticProps = Object.getOwnPropertyNames(this);
        const dynamicProps = this.getDynamicProperties();
        return [...new Set([...staticProps, ...dynamicProps])];
    }
    // Proxy handlers
    _getProperty(target, prop, receiver) {
        const propName = String(prop);
        // Check for special methods
        if (propName === 'seal')
            return this.seal.bind(this);
        if (propName === 'isSealed')
            return this.isSealed.bind(this);
        if (propName === 'addProperty')
            return this.addProperty.bind(this);
        if (propName === 'addMethod')
            return this.addMethod.bind(this);
        if (propName === 'removeProperty')
            return this.removeProperty.bind(this);
        if (propName === 'hasProperty')
            return this.hasProperty.bind(this);
        if (propName === 'getDynamicProperties')
            return this.getDynamicProperties.bind(this);
        if (propName === 'getAllProperties')
            return this.getAllProperties.bind(this);
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
    _setProperty(target, prop, value, receiver) {
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
        }
        else {
            if (!this._options.allowDynamicProperties) {
                throw new Error(`Cannot set dynamic property '${propName}': dynamic properties are disabled`);
            }
            this._dynamicProperties.set(propName, value);
        }
        return true;
    }
    _hasProperty(target, prop) {
        const propName = String(prop);
        return prop in target ||
            this._dynamicProperties.has(propName) ||
            this._dynamicMethods.has(propName);
    }
    _getOwnKeys(target) {
        const staticKeys = Reflect.ownKeys(target);
        const dynamicKeys = [...this._dynamicProperties.keys(), ...this._dynamicMethods.keys()];
        return [...staticKeys, ...dynamicKeys];
    }
    _getOwnPropertyDescriptor(target, prop) {
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
    _defineProperty(target, prop, descriptor) {
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
            }
            else {
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
exports.DynamicClass = DynamicClass;
/**
 * Dynamic class factory
 */
class DynamicClassFactory {
    /**
     * Create a new dynamic class
     */
    static create(options) {
        return new DynamicClass(options);
    }
    /**
     * Make an existing object dynamic
     */
    static makeDynamic(obj, options) {
        const dynamicClass = new DynamicClass(options);
        // Copy existing properties
        for (const key of Object.keys(obj)) {
            dynamicClass[key] = obj[key];
        }
        return dynamicClass;
    }
    /**
     * Create dynamic class from template
     */
    static fromTemplate(template, options) {
        const dynamicClass = new DynamicClass(options);
        // Apply template properties
        for (const [key, value] of Object.entries(template)) {
            if (typeof value === 'function') {
                dynamicClass.addMethod(key, value);
            }
            else {
                dynamicClass.addProperty(key, value);
            }
        }
        return dynamicClass;
    }
}
exports.DynamicClassFactory = DynamicClassFactory;
/**
 * AS3-style dynamic decorator
 */
function dynamic(options) {
    return function (constructor) {
        return class extends constructor {
            constructor(...args) {
                super(...args);
                // Make this instance dynamic
                const dynamicInstance = DynamicClassFactory.makeDynamic(this, options);
                return dynamicInstance;
            }
        };
    };
}
/**
 * AS3-style sealed decorator
 */
function sealed(constructor) {
    return class extends constructor {
        constructor(...args) {
            super(...args);
            // Seal the object
            Object.seal(this);
        }
    };
}
// Utility functions for AS3 compatibility
/**
 * Check if object has property (AS3 hasOwnProperty equivalent)
 */
function hasOwnProperty(obj, prop) {
    if (obj instanceof DynamicClass) {
        return obj.hasProperty(prop);
    }
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
/**
 * Get all enumerable properties (AS3 for...in equivalent)
 */
function getEnumerableProperties(obj) {
    if (obj instanceof DynamicClass) {
        return obj.getAllProperties().filter(prop => {
            const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return descriptor?.enumerable !== false;
        });
    }
    const props = [];
    for (const prop in obj) {
        props.push(prop);
    }
    return props;
}
/**
 * Delete property (AS3 delete operator equivalent)
 */
function deleteProperty(obj, prop) {
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
exports.default = DynamicClass;
