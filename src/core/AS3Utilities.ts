/**
 * PowerScript AS3 Utilities Module
 * 
 * This module provides PowerScript compatible utility classes and functions
 * including Timer, enhanced Math, Array, Vector, and ByteArray utilities.
 */

// AS3 Timer Implementation
export class Timer {
    private _delay: number;
    private _repeatCount: number;
    private _currentCount: number = 0;
    private _running: boolean = false;
    private _timerId: any | null = null;
    private _listeners: { [event: string]: Function[] } = {};

    constructor(delay: number, repeatCount: number = 0) {
        this._delay = delay;
        this._repeatCount = repeatCount;
    }

    get delay(): number {
        return this._delay;
    }

    set delay(value: number) {
        this._delay = value;
        if (this._running) {
            this.stop();
            this.start();
        }
    }

    get repeatCount(): number {
        return this._repeatCount;
    }

    set repeatCount(value: number) {
        this._repeatCount = value;
    }

    get currentCount(): number {
        return this._currentCount;
    }

    get running(): boolean {
        return this._running;
    }

    public start(): void {
        if (this._running) return;
        
        this._running = true;
        this._scheduleNext();
    }

    public stop(): void {
        if (!this._running) return;
        
        this._running = false;
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = null;
        }
    }

    public reset(): void {
        this.stop();
        this._currentCount = 0;
    }

    public addEventListener(type: string, listener: Function): void {
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
    }

    public removeEventListener(type: string, listener: Function): void {
        if (!this._listeners[type]) return;
        
        const index = this._listeners[type].indexOf(listener);
        if (index !== -1) {
            this._listeners[type].splice(index, 1);
        }
    }

    private _scheduleNext(): void {
        if (!this._running) return;

        this._timerId = setTimeout(() => {
            this._currentCount++;
            this._dispatchEvent('timer');

            // Check if we should continue
            if (this._repeatCount > 0 && this._currentCount >= this._repeatCount) {
                this._running = false;
                this._dispatchEvent('timerComplete');
            } else if (this._running) {
                this._scheduleNext();
            }
        }, this._delay);
    }

    private _dispatchEvent(type: string): void {
        if (this._listeners[type]) {
            this._listeners[type].forEach(listener => {
                try {
                    listener({ type, target: this });
                } catch (error) {
                    console.error(`Timer event listener error:`, error);
                }
            });
        }
    }
}

// Enhanced Math utilities (AS3 compatible)
export class PSMath {
    // AS3 Math constants
    public static readonly E = Math.E;
    public static readonly LN10 = Math.LN10;
    public static readonly LN2 = Math.LN2;
    public static readonly LOG10E = Math.LOG10E;
    public static readonly LOG2E = Math.LOG2E;
    public static readonly PI = Math.PI;
    public static readonly SQRT1_2 = Math.SQRT1_2;
    public static readonly SQRT2 = Math.SQRT2;

    // AS3 Math methods (static)
    public static abs = Math.abs;
    public static acos = Math.acos;
    public static asin = Math.asin;
    public static atan = Math.atan;
    public static atan2 = Math.atan2;
    public static ceil = Math.ceil;
    public static cos = Math.cos;
    public static exp = Math.exp;
    public static floor = Math.floor;
    public static log = Math.log;
    public static max = Math.max;
    public static min = Math.min;
    public static pow = Math.pow;
    public static random = Math.random;
    public static round = Math.round;
    public static sin = Math.sin;
    public static sqrt = Math.sqrt;
    public static tan = Math.tan;

    // Additional AS3-style utilities
    public static randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    public static randomInt(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min + 1));
    }

    public static degrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    public static radians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    public static lerp(start: number, end: number, factor: number): number {
        return start + (end - start) * factor;
    }

    public static sign(value: number): number {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    }
}

// Enhanced Array utilities (AS3 compatible)
export class PSArray<T> extends Array<T> {
    constructor(...items: T[]) {
        super(...items);
        Object.setPrototypeOf(this, PSArray.prototype);
    }

    // AS3 Array methods
    public sortOn(fieldName: string | string[], options?: number): PSArray<T> {
        const fields = Array.isArray(fieldName) ? fieldName : [fieldName];
        
        this.sort((a: any, b: any) => {
            for (const field of fields) {
                const aVal = a[field];
                const bVal = b[field];
                
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
            }
            return 0;
        });
        
        return this;
    }

    public removeItemAt(index: number): T | undefined {
        if (index < 0 || index >= this.length) return undefined;
        return this.splice(index, 1)[0];
    }

    public insertItemAt(item: T, index: number): void {
        if (index < 0) index = 0;
        if (index > this.length) index = this.length;
        this.splice(index, 0, item);
    }

    public addItem(item: T): void {
        this.push(item);
    }

    public addItemAt(item: T, index: number): void {
        this.insertItemAt(item, index);
    }

    public removeItem(item: T): boolean {
        const index = this.indexOf(item);
        if (index !== -1) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }

    public removeAll(): void {
        this.length = 0;
    }

    public getItemAt(index: number): T | undefined {
        return this[index];
    }

    public setItemAt(item: T, index: number): void {
        this[index] = item;
    }

    public getItemIndex(item: T): number {
        return this.indexOf(item);
    }

    public contains(item: T): boolean {
        return this.indexOf(item) !== -1;
    }

    public toArray(): T[] {
        return [...this];
    }
}

// Vector implementation (AS3 compatible)
export class PSVector<T> {
    private _items: T[] = [];
    private _fixed: boolean = false;

    constructor(length?: number, fixed: boolean = false) {
        if (length !== undefined) {
            this._items = new Array(length);
        }
        this._fixed = fixed;
    }

    get length(): number {
        return this._items.length;
    }

    set length(value: number) {
        if (this._fixed) {
            throw new Error("Cannot change length of fixed Vector");
        }
        this._items.length = value;
    }

    get fixed(): boolean {
        return this._fixed;
    }

    set fixed(value: boolean) {
        this._fixed = value;
    }

    public push(...items: T[]): number {
        if (this._fixed) {
            throw new Error("Cannot push to fixed Vector");
        }
        return this._items.push(...items);
    }

    public pop(): T | undefined {
        if (this._fixed) {
            throw new Error("Cannot pop from fixed Vector");
        }
        return this._items.pop();
    }

    public shift(): T | undefined {
        if (this._fixed) {
            throw new Error("Cannot shift from fixed Vector");
        }
        return this._items.shift();
    }

    public unshift(...items: T[]): number {
        if (this._fixed) {
            throw new Error("Cannot unshift to fixed Vector");
        }
        return this._items.unshift(...items);
    }

    public splice(start: number, deleteCount?: number, ...items: T[]): PSVector<T> {
        if (this._fixed && (deleteCount !== 0 || items.length > 0)) {
            throw new Error("Cannot modify fixed Vector");
        }
        const removed = this._items.splice(start, deleteCount || 0, ...items);
        return new PSVector<T>().concat(removed);
    }

    public slice(start?: number, end?: number): PSVector<T> {
        const sliced = this._items.slice(start, end);
        return new PSVector<T>().concat(sliced);
    }

    public concat(...items: (T | PSVector<T> | T[])[]): PSVector<T> {
        const result = new PSVector<T>();
        result._items = [...this._items];
        
        for (const item of items) {
            if (item instanceof PSVector) {
                result._items.push(...item._items);
            } else if (Array.isArray(item)) {
                result._items.push(...item);
            } else {
                result._items.push(item);
            }
        }
        
        return result;
    }

    public indexOf(searchElement: T, fromIndex?: number): number {
        return this._items.indexOf(searchElement, fromIndex);
    }

    public lastIndexOf(searchElement: T, fromIndex?: number): number {
        return this._items.lastIndexOf(searchElement, fromIndex);
    }

    public reverse(): PSVector<T> {
        this._items.reverse();
        return this;
    }

    public sort(compareFn?: (a: T, b: T) => number): PSVector<T> {
        this._items.sort(compareFn);
        return this;
    }

    public every(callbackfn: (value: T, index: number, vector: PSVector<T>) => boolean): boolean {
        return this._items.every((value, index) => callbackfn(value, index, this));
    }

    public some(callbackfn: (value: T, index: number, vector: PSVector<T>) => boolean): boolean {
        return this._items.some((value, index) => callbackfn(value, index, this));
    }

    public forEach(callbackfn: (value: T, index: number, vector: PSVector<T>) => void): void {
        this._items.forEach((value, index) => callbackfn(value, index, this));
    }

    public map<U>(callbackfn: (value: T, index: number, vector: PSVector<T>) => U): PSVector<U> {
        const result = new PSVector<U>();
        result._items = this._items.map((value, index) => callbackfn(value, index, this));
        return result;
    }

    public filter(callbackfn: (value: T, index: number, vector: PSVector<T>) => boolean): PSVector<T> {
        const result = new PSVector<T>();
        result._items = this._items.filter((value, index) => callbackfn(value, index, this));
        return result;
    }

    public reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, vector: PSVector<T>) => U, initialValue: U): U {
        return this._items.reduce((prev, curr, index) => callbackfn(prev, curr, index, this), initialValue);
    }

    // Array-like access
    public get(index: number): T {
        return this._items[index];
    }

    public set(index: number, value: T): void {
        this._items[index] = value;
    }

    // Convert to regular array
    public toArray(): T[] {
        return [...this._items];
    }

    // Iterator support
    public *[Symbol.iterator](): Iterator<T> {
        for (const item of this._items) {
            yield item;
        }
    }
}

// ByteArray implementation (AS3 compatible)
export class PSByteArray {
    private _buffer: ArrayBuffer;
    private _view: DataView;
    private _position: number = 0;
    private _endian: string = 'bigEndian';

    constructor(buffer?: ArrayBuffer) {
        this._buffer = buffer || new ArrayBuffer(0);
        this._view = new DataView(this._buffer);
    }

    get length(): number {
        return this._buffer.byteLength;
    }

    set length(value: number) {
        if (value !== this._buffer.byteLength) {
            const newBuffer = new ArrayBuffer(value);
            const newView = new DataView(newBuffer);
            
            // Copy existing data
            const copyLength = Math.min(value, this._buffer.byteLength);
            const oldArray = new Uint8Array(this._buffer, 0, copyLength);
            const newArray = new Uint8Array(newBuffer, 0, copyLength);
            newArray.set(oldArray);
            
            this._buffer = newBuffer;
            this._view = newView;
            this._position = Math.min(this._position, value);
        }
    }

    get position(): number {
        return this._position;
    }

    set position(value: number) {
        this._position = Math.max(0, Math.min(value, this.length));
    }

    get bytesAvailable(): number {
        return this.length - this._position;
    }

    get endian(): string {
        return this._endian;
    }

    set endian(value: string) {
        this._endian = value;
    }

    private get _littleEndian(): boolean {
        return this._endian === 'littleEndian';
    }

    public readByte(): number {
        if (this._position >= this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        return this._view.getInt8(this._position++);
    }

    public readUnsignedByte(): number {
        if (this._position >= this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        return this._view.getUint8(this._position++);
    }

    public readShort(): number {
        if (this._position + 2 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getInt16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }

    public readUnsignedShort(): number {
        if (this._position + 2 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getUint16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }

    public readInt(): number {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getInt32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }

    public readUnsignedInt(): number {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getUint32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }

    public readFloat(): number {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getFloat32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }

    public readDouble(): number {
        if (this._position + 8 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getFloat64(this._position, this._littleEndian);
        this._position += 8;
        return value;
    }

    public readUTF(): string {
        const length = this.readUnsignedShort();
        const bytes = new Uint8Array(this._buffer, this._position, length);
        this._position += length;
        return new TextDecoder('utf-8').decode(bytes);
    }

    public readUTFBytes(length: number): string {
        if (this._position + length > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const bytes = new Uint8Array(this._buffer, this._position, length);
        this._position += length;
        return new TextDecoder('utf-8').decode(bytes);
    }

    public readBytes(bytes: PSByteArray, offset: number = 0, length?: number): void {
        if (length === undefined) {
            length = this.bytesAvailable;
        }
        
        if (this._position + length > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }

        // Ensure target ByteArray is large enough
        const requiredLength = offset + length;
        if (bytes.length < requiredLength) {
            bytes.length = requiredLength;
        }

        // Copy bytes
        const sourceArray = new Uint8Array(this._buffer, this._position, length);
        const targetArray = new Uint8Array(bytes._buffer, offset, length);
        targetArray.set(sourceArray);
        
        this._position += length;
    }

    public writeByte(value: number): void {
        this._ensureCapacity(1);
        this._view.setInt8(this._position++, value);
    }

    public writeUnsignedByte(value: number): void {
        this._ensureCapacity(1);
        this._view.setUint8(this._position++, value);
    }

    public writeShort(value: number): void {
        this._ensureCapacity(2);
        this._view.setInt16(this._position, value, this._littleEndian);
        this._position += 2;
    }

    public writeUnsignedShort(value: number): void {
        this._ensureCapacity(2);
        this._view.setUint16(this._position, value, this._littleEndian);
        this._position += 2;
    }

    public writeInt(value: number): void {
        this._ensureCapacity(4);
        this._view.setInt32(this._position, value, this._littleEndian);
        this._position += 4;
    }

    public writeUnsignedInt(value: number): void {
        this._ensureCapacity(4);
        this._view.setUint32(this._position, value, this._littleEndian);
        this._position += 4;
    }

    public writeFloat(value: number): void {
        this._ensureCapacity(4);
        this._view.setFloat32(this._position, value, this._littleEndian);
        this._position += 4;
    }

    public writeDouble(value: number): void {
        this._ensureCapacity(8);
        this._view.setFloat64(this._position, value, this._littleEndian);
        this._position += 8;
    }

    public writeUTF(value: string): void {
        const bytes = new TextEncoder().encode(value);
        this.writeUnsignedShort(bytes.length);
        this.writeBytes(new PSByteArray(bytes.buffer));
    }

    public writeUTFBytes(value: string): void {
        const bytes = new TextEncoder().encode(value);
        this.writeBytes(new PSByteArray(bytes.buffer));
    }

    public writeBytes(bytes: PSByteArray, offset: number = 0, length?: number): void {
        if (length === undefined) {
            length = bytes.length - offset;
        }
        
        this._ensureCapacity(length);
        
        const sourceArray = new Uint8Array(bytes._buffer, offset, length);
        const targetArray = new Uint8Array(this._buffer, this._position, length);
        targetArray.set(sourceArray);
        
        this._position += length;
    }

    public clear(): void {
        this._buffer = new ArrayBuffer(0);
        this._view = new DataView(this._buffer);
        this._position = 0;
    }

    public compress(algorithm: string = 'zlib'): void {
        // Placeholder - would need compression library
        console.warn(`ByteArray.compress(${algorithm}) not yet implemented`);
    }

    public uncompress(algorithm: string = 'zlib'): void {
        // Placeholder - would need compression library
        console.warn(`ByteArray.uncompress(${algorithm}) not yet implemented`);
    }

    private _ensureCapacity(additionalBytes: number): void {
        const requiredLength = this._position + additionalBytes;
        if (requiredLength > this.length) {
            // Grow buffer by doubling or required size, whichever is larger
            const newLength = Math.max(requiredLength, this.length * 2);
            this.length = newLength;
        }
    }

    public toArrayBuffer(): ArrayBuffer {
        return this._buffer.slice(0);
    }

    public toString(): string {
        const array = new Uint8Array(this._buffer);
        return Array.from(array, byte => String.fromCharCode(byte)).join('');
    }
}

// Export all utilities for convenience
export { Timer as PSTimer };
export { PSMath as Math };
export { PSArray as Array };
export { PSVector as Vector };
export { PSByteArray as ByteArray };