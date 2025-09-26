/**
 * PowerScript Vector - PowerScript style Vector implementation
 * 
 * Provides AS3-compatible Vector functionality with type safety and
 * enhanced array-like operations for high-performance collections.
 */

import { EventDispatcher, Event } from './EventDispatcher';

export class VectorEvent extends Event {
  public static readonly CHANGE = 'change';
  public static readonly RESIZE = 'resize';

  constructor(type: string, bubbles: boolean = false, cancelable: boolean = false) {
    super(type, bubbles, cancelable);
  }
}

/**
 * PowerScript style Vector class with type safety
 */
export class Vector<T> extends EventDispatcher implements Iterable<T> {
  private _items: T[] = [];
  private _length: number = 0;
  private _fixed: boolean = false;

  /**
   * Create a new Vector
   * @param length - Initial length of the vector
   * @param fixed - Whether the vector has a fixed length
   */
  constructor(length: number = 0, fixed: boolean = false) {
    super();
    this._length = length;
    this._fixed = fixed;
    this._items = new Array(length);
  }

  /**
   * Get the length of the vector
   */
  public get length(): number {
    return this._length;
  }

  /**
   * Set the length of the vector
   */
  public set length(value: number) {
    if (this._fixed) {
      throw new Error('Cannot change length of fixed vector');
    }

    const oldLength = this._length;
    this._length = Math.max(0, Math.floor(value));

    if (this._length > this._items.length) {
      this._items.length = this._length;
    } else if (this._length < this._items.length) {
      this._items.splice(this._length);
    }

    if (oldLength !== this._length) {
      this.dispatchEvent(new VectorEvent(VectorEvent.RESIZE));
    }
  }

  /**
   * Get whether the vector has a fixed length
   */
  public get fixed(): boolean {
    return this._fixed;
  }

  /**
   * Set whether the vector has a fixed length
   */
  public set fixed(value: boolean) {
    this._fixed = value;
  }

  /**
   * Get an item at the specified index
   */
  public getAt(index: number): T | undefined {
    if (index < 0 || index >= this._length) {
      throw new RangeError(`Index ${index} is out of range [0..${this._length - 1}]`);
    }
    return this._items[index];
  }

  /**
   * Set an item at the specified index
   */
  public setAt(index: number, value: T): void {
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
  public push(value: T): number {
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
  public pop(): T | undefined {
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
  public unshift(...values: T[]): number {
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
  public shift(): T | undefined {
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
  public splice(start: number, deleteCount?: number, ...items: T[]): Vector<T> {
    if (this._fixed && (deleteCount !== 0 || items.length !== 0)) {
      throw new Error('Cannot splice fixed vector');
    }

    start = Math.max(0, start < 0 ? this._length + start : start);
    deleteCount = deleteCount === undefined ? this._length - start : Math.max(0, deleteCount);

    const removed = this._items.splice(start, deleteCount, ...items);
    this._length = this._items.length;

    const removedVector = new Vector<T>(removed.length);
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
  public indexOf(searchElement: T, fromIndex: number = 0): number {
    return this._items.indexOf(searchElement, fromIndex);
  }

  /**
   * Find the last index of an item
   */
  public lastIndexOf(searchElement: T, fromIndex?: number): number {
    return this._items.lastIndexOf(searchElement, fromIndex);
  }

  /**
   * Check if the vector contains an item
   */
  public includes(searchElement: T, fromIndex: number = 0): boolean {
    return this._items.includes(searchElement, fromIndex);
  }

  /**
   * Execute a function for each item
   */
  public forEach(callback: (value: T, index: number, vector: Vector<T>) => void): void {
    for (let i = 0; i < this._length; i++) {
      callback(this._items[i], i, this);
    }
  }

  /**
   * Create a new vector with the results of calling a function for each item
   */
  public map<U>(callback: (value: T, index: number, vector: Vector<T>) => U): Vector<U> {
    const result = new Vector<U>(this._length);
    for (let i = 0; i < this._length; i++) {
      result.setAt(i, callback(this._items[i], i, this));
    }
    return result;
  }

  /**
   * Create a new vector with items that pass a test
   */
  public filter(callback: (value: T, index: number, vector: Vector<T>) => boolean): Vector<T> {
    const filtered: T[] = [];
    for (let i = 0; i < this._length; i++) {
      if (callback(this._items[i], i, this)) {
        filtered.push(this._items[i]);
      }
    }
    
    const result = new Vector<T>(filtered.length);
    for (let i = 0; i < filtered.length; i++) {
      result.setAt(i, filtered[i]);
    }
    return result;
  }

  /**
   * Test whether at least one item passes a test
   */
  public some(callback: (value: T, index: number, vector: Vector<T>) => boolean): boolean {
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
  public every(callback: (value: T, index: number, vector: Vector<T>) => boolean): boolean {
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
  public find(callback: (value: T, index: number, vector: Vector<T>) => boolean): T | undefined {
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
  public findIndex(callback: (value: T, index: number, vector: Vector<T>) => boolean): number {
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
  public reduce<U>(
    callback: (accumulator: U, currentValue: T, currentIndex: number, vector: Vector<T>) => U,
    initialValue: U
  ): U {
    let accumulator = initialValue;
    for (let i = 0; i < this._length; i++) {
      accumulator = callback(accumulator, this._items[i], i, this);
    }
    return accumulator;
  }

  /**
   * Sort the vector in place
   */
  public sort(compareFunction?: (a: T, b: T) => number): Vector<T> {
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
  public reverse(): Vector<T> {
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
  public slice(start?: number, end?: number): Vector<T> {
    const sliced = this._items.slice(start, end);
    const result = new Vector<T>(sliced.length);
    for (let i = 0; i < sliced.length; i++) {
      result.setAt(i, sliced[i]);
    }
    return result;
  }

  /**
   * Join all items into a string
   */
  public join(separator: string = ','): string {
    return this._items.slice(0, this._length).join(separator);
  }

  /**
   * Concatenate with other vectors or arrays
   */
  public concat(...items: (Vector<T> | T[] | T)[]): Vector<T> {
    const combined: T[] = [...this._items.slice(0, this._length)];
    
    for (const item of items) {
      if (item instanceof Vector) {
        for (let i = 0; i < item.length; i++) {
          combined.push(item.getAt(i)!);
        }
      } else if (Array.isArray(item)) {
        combined.push(...item);
      } else {
        combined.push(item);
      }
    }

    const result = new Vector<T>(combined.length);
    for (let i = 0; i < combined.length; i++) {
      result.setAt(i, combined[i]);
    }
    return result;
  }

  /**
   * Convert to a regular array
   */
  public toArray(): T[] {
    return this._items.slice(0, this._length);
  }

  /**
   * Clear all items from the vector
   */
  public clear(): void {
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
  public *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._length; i++) {
      yield this._items[i];
    }
  }

  /**
   * Create a Vector from an array
   */
  public static fromArray<T>(array: T[], fixed: boolean = false): Vector<T> {
    const vector = new Vector<T>(array.length, fixed);
    for (let i = 0; i < array.length; i++) {
      vector.setAt(i, array[i]);
    }
    return vector;
  }

  /**
   * Create a Vector with a range of numbers
   */
  public static range(start: number, end: number, step: number = 1): Vector<number> {
    const items: number[] = [];
    for (let i = start; i < end; i += step) {
      items.push(i);
    }
    return Vector.fromArray(items);
  }

  /**
   * Create a Vector filled with a specific value
   */
  public static fill<T>(value: T, length: number): Vector<T> {
    const vector = new Vector<T>(length);
    for (let i = 0; i < length; i++) {
      vector.setAt(i, value);
    }
    return vector;
  }

  public toString(): string {
    return `[Vector length=${this._length} fixed=${this._fixed}]`;
  }

  public valueOf(): T[] {
    return this.toArray();
  }
}