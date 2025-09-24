"use strict";
/**
 * PowerScript Vector - ActionScript 3 style Vector implementation
 *
 * Provides AS3-compatible Vector functionality with type safety and
 * enhanced array-like operations for high-performance collections.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vector = exports.VectorEvent = void 0;
const EventDispatcher_1 = require("./EventDispatcher");
class VectorEvent extends EventDispatcher_1.Event {
    static CHANGE = 'change';
    static RESIZE = 'resize';
    constructor(type, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
    }
}
exports.VectorEvent = VectorEvent;
/**
 * ActionScript 3 style Vector class with type safety
 */
class Vector extends EventDispatcher_1.EventDispatcher {
    _items = [];
    _length = 0;
    _fixed = false;
    /**
     * Create a new Vector
     * @param length - Initial length of the vector
     * @param fixed - Whether the vector has a fixed length
     */
    constructor(length = 0, fixed = false) {
        super();
        this._length = length;
        this._fixed = fixed;
        this._items = new Array(length);
    }
    /**
     * Get the length of the vector
     */
    get length() {
        return this._length;
    }
    /**
     * Set the length of the vector
     */
    set length(value) {
        if (this._fixed) {
            throw new Error('Cannot change length of fixed vector');
        }
        const oldLength = this._length;
        this._length = Math.max(0, Math.floor(value));
        if (this._length > this._items.length) {
            this._items.length = this._length;
        }
        else if (this._length < this._items.length) {
            this._items.splice(this._length);
        }
        if (oldLength !== this._length) {
            this.dispatchEvent(new VectorEvent(VectorEvent.RESIZE));
        }
    }
    /**
     * Get whether the vector has a fixed length
     */
    get fixed() {
        return this._fixed;
    }
    /**
     * Set whether the vector has a fixed length
     */
    set fixed(value) {
        this._fixed = value;
    }
    /**
     * Get an item at the specified index
     */
    getAt(index) {
        if (index < 0 || index >= this._length) {
            throw new RangeError(`Index ${index} is out of range [0..${this._length - 1}]`);
        }
        return this._items[index];
    }
    /**
     * Set an item at the specified index
     */
    setAt(index, value) {
        if (index < 0 || index >= this._length) {
            throw new RangeError(`Index ${index} is out of range [0..${this._length - 1}]`);
        }
        const oldValue = this._items[index];
        this._items[index] = value;
        if (oldValue !== value) {
            this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        }
    }
    /**
     * Add an item to the end of the vector
     */
    push(value) {
        if (this._fixed) {
            throw new Error('Cannot push to fixed vector');
        }
        this._items[this._length] = value;
        this._length++;
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return this._length;
    }
    /**
     * Remove and return the last item
     */
    pop() {
        if (this._fixed) {
            throw new Error('Cannot pop from fixed vector');
        }
        if (this._length === 0) {
            return undefined;
        }
        this._length--;
        const value = this._items[this._length];
        delete this._items[this._length];
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return value;
    }
    /**
     * Add items to the beginning of the vector
     */
    unshift(...values) {
        if (this._fixed) {
            throw new Error('Cannot unshift to fixed vector');
        }
        this._items.unshift(...values);
        this._length += values.length;
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return this._length;
    }
    /**
     * Remove and return the first item
     */
    shift() {
        if (this._fixed) {
            throw new Error('Cannot shift from fixed vector');
        }
        if (this._length === 0) {
            return undefined;
        }
        const value = this._items.shift();
        this._length--;
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return value;
    }
    /**
     * Remove items from the vector and optionally insert new items
     */
    splice(start, deleteCount, ...items) {
        if (this._fixed && (deleteCount !== 0 || items.length !== 0)) {
            throw new Error('Cannot splice fixed vector');
        }
        start = Math.max(0, start < 0 ? this._length + start : start);
        deleteCount = deleteCount === undefined ? this._length - start : Math.max(0, deleteCount);
        const removed = this._items.splice(start, deleteCount, ...items);
        this._length = this._items.length;
        const removedVector = new Vector(removed.length);
        for (let i = 0; i < removed.length; i++) {
            removedVector.setAt(i, removed[i]);
        }
        if (removed.length > 0 || items.length > 0) {
            this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        }
        return removedVector;
    }
    /**
     * Find the index of an item
     */
    indexOf(searchElement, fromIndex = 0) {
        return this._items.indexOf(searchElement, fromIndex);
    }
    /**
     * Find the last index of an item
     */
    lastIndexOf(searchElement, fromIndex) {
        return this._items.lastIndexOf(searchElement, fromIndex);
    }
    /**
     * Check if the vector contains an item
     */
    includes(searchElement, fromIndex = 0) {
        return this._items.includes(searchElement, fromIndex);
    }
    /**
     * Execute a function for each item
     */
    forEach(callback) {
        for (let i = 0; i < this._length; i++) {
            callback(this._items[i], i, this);
        }
    }
    /**
     * Create a new vector with the results of calling a function for each item
     */
    map(callback) {
        const result = new Vector(this._length);
        for (let i = 0; i < this._length; i++) {
            result.setAt(i, callback(this._items[i], i, this));
        }
        return result;
    }
    /**
     * Create a new vector with items that pass a test
     */
    filter(callback) {
        const filtered = [];
        for (let i = 0; i < this._length; i++) {
            if (callback(this._items[i], i, this)) {
                filtered.push(this._items[i]);
            }
        }
        const result = new Vector(filtered.length);
        for (let i = 0; i < filtered.length; i++) {
            result.setAt(i, filtered[i]);
        }
        return result;
    }
    /**
     * Test whether at least one item passes a test
     */
    some(callback) {
        for (let i = 0; i < this._length; i++) {
            if (callback(this._items[i], i, this)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Test whether all items pass a test
     */
    every(callback) {
        for (let i = 0; i < this._length; i++) {
            if (!callback(this._items[i], i, this)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Find the first item that satisfies a test
     */
    find(callback) {
        for (let i = 0; i < this._length; i++) {
            if (callback(this._items[i], i, this)) {
                return this._items[i];
            }
        }
        return undefined;
    }
    /**
     * Find the index of the first item that satisfies a test
     */
    findIndex(callback) {
        for (let i = 0; i < this._length; i++) {
            if (callback(this._items[i], i, this)) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Reduce the vector to a single value
     */
    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (let i = 0; i < this._length; i++) {
            accumulator = callback(accumulator, this._items[i], i, this);
        }
        return accumulator;
    }
    /**
     * Sort the vector in place
     */
    sort(compareFunction) {
        if (this._fixed) {
            throw new Error('Cannot sort fixed vector');
        }
        this._items.sort(compareFunction);
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return this;
    }
    /**
     * Reverse the vector in place
     */
    reverse() {
        if (this._fixed) {
            throw new Error('Cannot reverse fixed vector');
        }
        this._items.reverse();
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
        return this;
    }
    /**
     * Create a shallow copy of the vector
     */
    slice(start, end) {
        const sliced = this._items.slice(start, end);
        const result = new Vector(sliced.length);
        for (let i = 0; i < sliced.length; i++) {
            result.setAt(i, sliced[i]);
        }
        return result;
    }
    /**
     * Join all items into a string
     */
    join(separator = ',') {
        return this._items.slice(0, this._length).join(separator);
    }
    /**
     * Concatenate with other vectors or arrays
     */
    concat(...items) {
        const combined = [...this._items.slice(0, this._length)];
        for (const item of items) {
            if (item instanceof Vector) {
                for (let i = 0; i < item.length; i++) {
                    combined.push(item.getAt(i));
                }
            }
            else if (Array.isArray(item)) {
                combined.push(...item);
            }
            else {
                combined.push(item);
            }
        }
        const result = new Vector(combined.length);
        for (let i = 0; i < combined.length; i++) {
            result.setAt(i, combined[i]);
        }
        return result;
    }
    /**
     * Convert to a regular array
     */
    toArray() {
        return this._items.slice(0, this._length);
    }
    /**
     * Clear all items from the vector
     */
    clear() {
        if (this._fixed) {
            throw new Error('Cannot clear fixed vector');
        }
        this._items = [];
        this._length = 0;
        this.dispatchEvent(new VectorEvent(VectorEvent.CHANGE));
    }
    /**
     * Iterator support for for...of loops
     */
    *[Symbol.iterator]() {
        for (let i = 0; i < this._length; i++) {
            yield this._items[i];
        }
    }
    /**
     * Create a Vector from an array
     */
    static fromArray(array, fixed = false) {
        const vector = new Vector(array.length, fixed);
        for (let i = 0; i < array.length; i++) {
            vector.setAt(i, array[i]);
        }
        return vector;
    }
    /**
     * Create a Vector with a range of numbers
     */
    static range(start, end, step = 1) {
        const items = [];
        for (let i = start; i < end; i += step) {
            items.push(i);
        }
        return Vector.fromArray(items);
    }
    /**
     * Create a Vector filled with a specific value
     */
    static fill(value, length) {
        const vector = new Vector(length);
        for (let i = 0; i < length; i++) {
            vector.setAt(i, value);
        }
        return vector;
    }
    toString() {
        return `[Vector length=${this._length} fixed=${this._fixed}]`;
    }
    valueOf() {
        return this.toArray();
    }
}
exports.Vector = Vector;
//# sourceMappingURL=Vector.js.map