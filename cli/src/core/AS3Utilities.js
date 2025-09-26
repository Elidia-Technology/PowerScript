"use strict";
/**
 * PowerScript AS3 Utilities Module
 *
 * This module provides PowerScript compatible utility classes and functions
 * including Timer, enhanced Math, Array, Vector, and ByteArray utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteArray = exports.Vector = exports.Array = exports.Math = exports.PSTimer = exports.PSByteArray = exports.PSVector = exports.PSArray = exports.PSMath = exports.Timer = void 0;
// AS3 Timer Implementation
class Timer {
    constructor(delay, repeatCount = 0) {
        this._currentCount = 0;
        this._running = false;
        this._timerId = null;
        this._listeners = {};
        this._delay = delay;
        this._repeatCount = repeatCount;
    }
    get delay() {
        return this._delay;
    }
    set delay(value) {
        this._delay = value;
        if (this._running) {
            this.stop();
            this.start();
        }
    }
    get repeatCount() {
        return this._repeatCount;
    }
    set repeatCount(value) {
        this._repeatCount = value;
    }
    get currentCount() {
        return this._currentCount;
    }
    get running() {
        return this._running;
    }
    start() {
        if (this._running)
            return;
        this._running = true;
        this._scheduleNext();
    }
    stop() {
        if (!this._running)
            return;
        this._running = false;
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = null;
        }
    }
    reset() {
        this.stop();
        this._currentCount = 0;
    }
    addEventListener(type, listener) {
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
    }
    removeEventListener(type, listener) {
        if (!this._listeners[type])
            return;
        const index = this._listeners[type].indexOf(listener);
        if (index !== -1) {
            this._listeners[type].splice(index, 1);
        }
    }
    _scheduleNext() {
        if (!this._running)
            return;
        this._timerId = setTimeout(() => {
            this._currentCount++;
            this._dispatchEvent('timer');
            // Check if we should continue
            if (this._repeatCount > 0 && this._currentCount >= this._repeatCount) {
                this._running = false;
                this._dispatchEvent('timerComplete');
            }
            else if (this._running) {
                this._scheduleNext();
            }
        }, this._delay);
    }
    _dispatchEvent(type) {
        if (this._listeners[type]) {
            this._listeners[type].forEach(listener => {
                try {
                    listener({ type, target: this });
                }
                catch (error) {
                    console.error(`Timer event listener error:`, error);
                }
            });
        }
    }
}
exports.Timer = Timer;
exports.PSTimer = Timer;
// Enhanced Math utilities (AS3 compatible)
class PSMath {
    // Additional AS3-style utilities
    static randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
    static randomInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
    static degrees(radians) {
        return radians * (180 / Math.PI);
    }
    static radians(degrees) {
        return degrees * (Math.PI / 180);
    }
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    static sign(value) {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    }
}
exports.PSMath = PSMath;
exports.Math = PSMath;
// AS3 Math constants
PSMath.E = Math.E;
PSMath.LN10 = Math.LN10;
PSMath.LN2 = Math.LN2;
PSMath.LOG10E = Math.LOG10E;
PSMath.LOG2E = Math.LOG2E;
PSMath.PI = Math.PI;
PSMath.SQRT1_2 = Math.SQRT1_2;
PSMath.SQRT2 = Math.SQRT2;
// AS3 Math methods (static)
PSMath.abs = Math.abs;
PSMath.acos = Math.acos;
PSMath.asin = Math.asin;
PSMath.atan = Math.atan;
PSMath.atan2 = Math.atan2;
PSMath.ceil = Math.ceil;
PSMath.cos = Math.cos;
PSMath.exp = Math.exp;
PSMath.floor = Math.floor;
PSMath.log = Math.log;
PSMath.max = Math.max;
PSMath.min = Math.min;
PSMath.pow = Math.pow;
PSMath.random = Math.random;
PSMath.round = Math.round;
PSMath.sin = Math.sin;
PSMath.sqrt = Math.sqrt;
PSMath.tan = Math.tan;
// Enhanced Array utilities (AS3 compatible)
class PSArray extends Array {
    constructor(...items) {
        super(...items);
        Object.setPrototypeOf(this, PSArray.prototype);
    }
    // AS3 Array methods
    sortOn(fieldName, options) {
        const fields = Array.isArray(fieldName) ? fieldName : [fieldName];
        this.sort((a, b) => {
            for (const field of fields) {
                const aVal = a[field];
                const bVal = b[field];
                if (aVal < bVal)
                    return -1;
                if (aVal > bVal)
                    return 1;
            }
            return 0;
        });
        return this;
    }
    removeItemAt(index) {
        if (index < 0 || index >= this.length)
            return undefined;
        return this.splice(index, 1)[0];
    }
    insertItemAt(item, index) {
        if (index < 0)
            index = 0;
        if (index > this.length)
            index = this.length;
        this.splice(index, 0, item);
    }
    addItem(item) {
        this.push(item);
    }
    addItemAt(item, index) {
        this.insertItemAt(item, index);
    }
    removeItem(item) {
        const index = this.indexOf(item);
        if (index !== -1) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }
    removeAll() {
        this.length = 0;
    }
    getItemAt(index) {
        return this[index];
    }
    setItemAt(item, index) {
        this[index] = item;
    }
    getItemIndex(item) {
        return this.indexOf(item);
    }
    contains(item) {
        return this.indexOf(item) !== -1;
    }
    toArray() {
        return [...this];
    }
}
exports.PSArray = PSArray;
exports.Array = PSArray;
// Vector implementation (AS3 compatible)
class PSVector {
    constructor(length, fixed = false) {
        this._items = [];
        this._fixed = false;
        if (length !== undefined) {
            this._items = new Array(length);
        }
        this._fixed = fixed;
    }
    get length() {
        return this._items.length;
    }
    set length(value) {
        if (this._fixed) {
            throw new Error("Cannot change length of fixed Vector");
        }
        this._items.length = value;
    }
    get fixed() {
        return this._fixed;
    }
    set fixed(value) {
        this._fixed = value;
    }
    push(...items) {
        if (this._fixed) {
            throw new Error("Cannot push to fixed Vector");
        }
        return this._items.push(...items);
    }
    pop() {
        if (this._fixed) {
            throw new Error("Cannot pop from fixed Vector");
        }
        return this._items.pop();
    }
    shift() {
        if (this._fixed) {
            throw new Error("Cannot shift from fixed Vector");
        }
        return this._items.shift();
    }
    unshift(...items) {
        if (this._fixed) {
            throw new Error("Cannot unshift to fixed Vector");
        }
        return this._items.unshift(...items);
    }
    splice(start, deleteCount, ...items) {
        if (this._fixed && (deleteCount !== 0 || items.length > 0)) {
            throw new Error("Cannot modify fixed Vector");
        }
        const removed = this._items.splice(start, deleteCount || 0, ...items);
        return new PSVector().concat(removed);
    }
    slice(start, end) {
        const sliced = this._items.slice(start, end);
        return new PSVector().concat(sliced);
    }
    concat(...items) {
        const result = new PSVector();
        result._items = [...this._items];
        for (const item of items) {
            if (item instanceof PSVector) {
                result._items.push(...item._items);
            }
            else if (Array.isArray(item)) {
                result._items.push(...item);
            }
            else {
                result._items.push(item);
            }
        }
        return result;
    }
    indexOf(searchElement, fromIndex) {
        return this._items.indexOf(searchElement, fromIndex);
    }
    lastIndexOf(searchElement, fromIndex) {
        return this._items.lastIndexOf(searchElement, fromIndex);
    }
    reverse() {
        this._items.reverse();
        return this;
    }
    sort(compareFn) {
        this._items.sort(compareFn);
        return this;
    }
    every(callbackfn) {
        return this._items.every((value, index) => callbackfn(value, index, this));
    }
    some(callbackfn) {
        return this._items.some((value, index) => callbackfn(value, index, this));
    }
    forEach(callbackfn) {
        this._items.forEach((value, index) => callbackfn(value, index, this));
    }
    map(callbackfn) {
        const result = new PSVector();
        result._items = this._items.map((value, index) => callbackfn(value, index, this));
        return result;
    }
    filter(callbackfn) {
        const result = new PSVector();
        result._items = this._items.filter((value, index) => callbackfn(value, index, this));
        return result;
    }
    reduce(callbackfn, initialValue) {
        return this._items.reduce((prev, curr, index) => callbackfn(prev, curr, index, this), initialValue);
    }
    // Array-like access
    get(index) {
        return this._items[index];
    }
    set(index, value) {
        this._items[index] = value;
    }
    // Convert to regular array
    toArray() {
        return [...this._items];
    }
    // Iterator support
    *[Symbol.iterator]() {
        for (const item of this._items) {
            yield item;
        }
    }
}
exports.PSVector = PSVector;
exports.Vector = PSVector;
// ByteArray implementation (AS3 compatible)
class PSByteArray {
    constructor(buffer) {
        this._position = 0;
        this._endian = 'bigEndian';
        this._buffer = buffer || new ArrayBuffer(0);
        this._view = new DataView(this._buffer);
    }
    get length() {
        return this._buffer.byteLength;
    }
    set length(value) {
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
    get position() {
        return this._position;
    }
    set position(value) {
        this._position = Math.max(0, Math.min(value, this.length));
    }
    get bytesAvailable() {
        return this.length - this._position;
    }
    get endian() {
        return this._endian;
    }
    set endian(value) {
        this._endian = value;
    }
    get _littleEndian() {
        return this._endian === 'littleEndian';
    }
    readByte() {
        if (this._position >= this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        return this._view.getInt8(this._position++);
    }
    readUnsignedByte() {
        if (this._position >= this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        return this._view.getUint8(this._position++);
    }
    readShort() {
        if (this._position + 2 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getInt16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }
    readUnsignedShort() {
        if (this._position + 2 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getUint16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }
    readInt() {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getInt32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    readUnsignedInt() {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getUint32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    readFloat() {
        if (this._position + 4 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getFloat32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    readDouble() {
        if (this._position + 8 > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const value = this._view.getFloat64(this._position, this._littleEndian);
        this._position += 8;
        return value;
    }
    readUTF() {
        const length = this.readUnsignedShort();
        const bytes = new Uint8Array(this._buffer, this._position, length);
        this._position += length;
        return new TextDecoder('utf-8').decode(bytes);
    }
    readUTFBytes(length) {
        if (this._position + length > this.length) {
            throw new Error("EOF: Attempting to read beyond end of ByteArray");
        }
        const bytes = new Uint8Array(this._buffer, this._position, length);
        this._position += length;
        return new TextDecoder('utf-8').decode(bytes);
    }
    readBytes(bytes, offset = 0, length) {
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
    writeByte(value) {
        this._ensureCapacity(1);
        this._view.setInt8(this._position++, value);
    }
    writeUnsignedByte(value) {
        this._ensureCapacity(1);
        this._view.setUint8(this._position++, value);
    }
    writeShort(value) {
        this._ensureCapacity(2);
        this._view.setInt16(this._position, value, this._littleEndian);
        this._position += 2;
    }
    writeUnsignedShort(value) {
        this._ensureCapacity(2);
        this._view.setUint16(this._position, value, this._littleEndian);
        this._position += 2;
    }
    writeInt(value) {
        this._ensureCapacity(4);
        this._view.setInt32(this._position, value, this._littleEndian);
        this._position += 4;
    }
    writeUnsignedInt(value) {
        this._ensureCapacity(4);
        this._view.setUint32(this._position, value, this._littleEndian);
        this._position += 4;
    }
    writeFloat(value) {
        this._ensureCapacity(4);
        this._view.setFloat32(this._position, value, this._littleEndian);
        this._position += 4;
    }
    writeDouble(value) {
        this._ensureCapacity(8);
        this._view.setFloat64(this._position, value, this._littleEndian);
        this._position += 8;
    }
    writeUTF(value) {
        const bytes = new TextEncoder().encode(value);
        this.writeUnsignedShort(bytes.length);
        this.writeBytes(new PSByteArray(bytes.buffer));
    }
    writeUTFBytes(value) {
        const bytes = new TextEncoder().encode(value);
        this.writeBytes(new PSByteArray(bytes.buffer));
    }
    writeBytes(bytes, offset = 0, length) {
        if (length === undefined) {
            length = bytes.length - offset;
        }
        this._ensureCapacity(length);
        const sourceArray = new Uint8Array(bytes._buffer, offset, length);
        const targetArray = new Uint8Array(this._buffer, this._position, length);
        targetArray.set(sourceArray);
        this._position += length;
    }
    clear() {
        this._buffer = new ArrayBuffer(0);
        this._view = new DataView(this._buffer);
        this._position = 0;
    }
    compress(algorithm = 'zlib') {
        // Placeholder - would need compression library
        console.warn(`ByteArray.compress(${algorithm}) not yet implemented`);
    }
    uncompress(algorithm = 'zlib') {
        // Placeholder - would need compression library
        console.warn(`ByteArray.uncompress(${algorithm}) not yet implemented`);
    }
    _ensureCapacity(additionalBytes) {
        const requiredLength = this._position + additionalBytes;
        if (requiredLength > this.length) {
            // Grow buffer by doubling or required size, whichever is larger
            const newLength = Math.max(requiredLength, this.length * 2);
            this.length = newLength;
        }
    }
    toArrayBuffer() {
        return this._buffer.slice(0);
    }
    toString() {
        const array = new Uint8Array(this._buffer);
        return Array.from(array, byte => String.fromCharCode(byte)).join('');
    }
}
exports.PSByteArray = PSByteArray;
exports.ByteArray = PSByteArray;
