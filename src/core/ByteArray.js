"use strict";
/**
 * PowerScript ByteArray - PowerScript style ByteArray implementation
 *
 * Provides AS3-compatible binary data manipulation functionality
 * using modern JavaScript ArrayBuffer, Uint8Array, and DataView.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteArray = exports.ByteArrayEvent = exports.Endian = void 0;
const EventDispatcher_1 = require("./EventDispatcher");
var Endian;
(function (Endian) {
    Endian["BIG_ENDIAN"] = "bigEndian";
    Endian["LITTLE_ENDIAN"] = "littleEndian";
})(Endian || (exports.Endian = Endian = {}));
class ByteArrayEvent extends EventDispatcher_1.Event {
    static CHANGE = 'change';
    static RESIZE = 'resize';
    constructor(type, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
    }
}
exports.ByteArrayEvent = ByteArrayEvent;
/**
 * PowerScript style ByteArray implementation using ArrayBuffer and DataView
 */
class ByteArray extends EventDispatcher_1.EventDispatcher {
    _buffer;
    _view;
    _uint8View;
    _position = 0;
    _endian = Endian.BIG_ENDIAN;
    /**
     * Create a new ByteArray
     * @param data - Optional initial data
     */
    constructor(data) {
        super();
        if (data instanceof ArrayBuffer) {
            this._buffer = data.slice(0);
        }
        else if (data instanceof Uint8Array) {
            const buffer = data.buffer;
            if (buffer instanceof ArrayBuffer) {
                this._buffer = buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            }
            else {
                // Handle SharedArrayBuffer case
                this._buffer = new ArrayBuffer(data.byteLength);
                new Uint8Array(this._buffer).set(data);
            }
        }
        else if (Array.isArray(data)) {
            this._buffer = new ArrayBuffer(data.length);
            const view = new Uint8Array(this._buffer);
            for (let i = 0; i < data.length; i++) {
                view[i] = data[i] & 0xFF;
            }
        }
        else if (typeof data === 'string') {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(data);
            this._buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
        }
        else {
            this._buffer = new ArrayBuffer(0);
        }
        this._updateViews();
    }
    _updateViews() {
        this._view = new DataView(this._buffer);
        this._uint8View = new Uint8Array(this._buffer);
    }
    /**
     * Get the length of the ByteArray
     */
    get length() {
        return this._buffer.byteLength;
    }
    /**
     * Set the length of the ByteArray
     */
    set length(value) {
        const oldLength = this._buffer.byteLength;
        if (value !== oldLength) {
            const newBuffer = new ArrayBuffer(value);
            const newView = new Uint8Array(newBuffer);
            const copyLength = Math.min(value, oldLength);
            if (copyLength > 0) {
                newView.set(this._uint8View.subarray(0, copyLength));
            }
            this._buffer = newBuffer;
            this._updateViews();
            if (this._position > value) {
                this._position = value;
            }
            this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.RESIZE));
        }
    }
    /**
     * Get the current position in the ByteArray
     */
    get position() {
        return this._position;
    }
    /**
     * Set the current position in the ByteArray
     */
    set position(value) {
        this._position = Math.max(0, Math.min(value, this._buffer.byteLength));
    }
    /**
     * Get the number of bytes available for reading
     */
    get bytesAvailable() {
        return Math.max(0, this._buffer.byteLength - this._position);
    }
    /**
     * Get the endianness
     */
    get endian() {
        return this._endian;
    }
    /**
     * Set the endianness
     */
    set endian(value) {
        this._endian = value;
    }
    get _littleEndian() {
        return this._endian === Endian.LITTLE_ENDIAN;
    }
    /**
     * Read a byte (unsigned 8-bit integer)
     */
    readUnsignedByte() {
        if (this._position >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        return this._view.getUint8(this._position++);
    }
    /**
     * Read a signed byte (signed 8-bit integer)
     */
    readByte() {
        if (this._position >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        return this._view.getInt8(this._position++);
    }
    /**
     * Read an unsigned short (unsigned 16-bit integer)
     */
    readUnsignedShort() {
        if (this._position + 1 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getUint16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }
    /**
     * Read a signed short (signed 16-bit integer)
     */
    readShort() {
        if (this._position + 1 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getInt16(this._position, this._littleEndian);
        this._position += 2;
        return value;
    }
    /**
     * Read an unsigned int (unsigned 32-bit integer)
     */
    readUnsignedInt() {
        if (this._position + 3 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getUint32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    /**
     * Read a signed int (signed 32-bit integer)
     */
    readInt() {
        if (this._position + 3 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getInt32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    /**
     * Read a float (32-bit floating point)
     */
    readFloat() {
        if (this._position + 3 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getFloat32(this._position, this._littleEndian);
        this._position += 4;
        return value;
    }
    /**
     * Read a double (64-bit floating point)
     */
    readDouble() {
        if (this._position + 7 >= this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const value = this._view.getFloat64(this._position, this._littleEndian);
        this._position += 8;
        return value;
    }
    /**
     * Read a UTF-8 string
     */
    readUTF() {
        const length = this.readUnsignedShort();
        return this.readUTFBytes(length);
    }
    /**
     * Read a UTF-8 string with specified byte length
     */
    readUTFBytes(length) {
        if (this._position + length > this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        const bytes = this._uint8View.subarray(this._position, this._position + length);
        const decoder = new TextDecoder('utf-8');
        const value = decoder.decode(bytes);
        this._position += length;
        return value;
    }
    /**
     * Read bytes into another ByteArray
     */
    readBytes(bytes, offset = 0, length) {
        if (length === undefined) {
            length = this.bytesAvailable;
        }
        if (this._position + length > this._buffer.byteLength) {
            throw new Error('End of buffer reached');
        }
        bytes._expandToFit(offset + length);
        const sourceBytes = this._uint8View.subarray(this._position, this._position + length);
        bytes._uint8View.set(sourceBytes, offset);
        this._position += length;
        bytes.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write a byte (unsigned 8-bit integer)
     */
    writeByte(value) {
        this._expandToFit(this._position + 1);
        this._view.setUint8(this._position++, value & 0xFF);
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write an unsigned short (unsigned 16-bit integer)
     */
    writeShort(value) {
        this._expandToFit(this._position + 2);
        this._view.setUint16(this._position, value & 0xFFFF, this._littleEndian);
        this._position += 2;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write an unsigned int (unsigned 32-bit integer)
     */
    writeUnsignedInt(value) {
        this._expandToFit(this._position + 4);
        this._view.setUint32(this._position, value >>> 0, this._littleEndian);
        this._position += 4;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write a signed int (signed 32-bit integer)
     */
    writeInt(value) {
        this._expandToFit(this._position + 4);
        this._view.setInt32(this._position, value | 0, this._littleEndian);
        this._position += 4;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write a float (32-bit floating point)
     */
    writeFloat(value) {
        this._expandToFit(this._position + 4);
        this._view.setFloat32(this._position, value, this._littleEndian);
        this._position += 4;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write a double (64-bit floating point)
     */
    writeDouble(value) {
        this._expandToFit(this._position + 8);
        this._view.setFloat64(this._position, value, this._littleEndian);
        this._position += 8;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write a UTF-8 string with length prefix
     */
    writeUTF(value) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(value);
        this.writeShort(encoded.length);
        this.writeUTFBytes(value);
    }
    /**
     * Write a UTF-8 string without length prefix
     */
    writeUTFBytes(value) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(value);
        this._expandToFit(this._position + encoded.length);
        this._uint8View.set(encoded, this._position);
        this._position += encoded.length;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Write bytes from another ByteArray
     */
    writeBytes(bytes, offset = 0, length) {
        if (length === undefined) {
            length = bytes.length - offset;
        }
        this._expandToFit(this._position + length);
        const sourceBytes = bytes._uint8View.subarray(offset, offset + length);
        this._uint8View.set(sourceBytes, this._position);
        this._position += length;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Clear all data
     */
    clear() {
        this._buffer = new ArrayBuffer(0);
        this._updateViews();
        this._position = 0;
        this.dispatchEvent(new ByteArrayEvent(ByteArrayEvent.CHANGE));
    }
    /**
     * Get a copy of the underlying ArrayBuffer
     */
    getArrayBuffer() {
        return this._buffer.slice(0);
    }
    /**
     * Convert to Uint8Array
     */
    toUint8Array() {
        return new Uint8Array(this.getArrayBuffer());
    }
    /**
     * Convert to hex string
     */
    toHexString() {
        const hex = [];
        for (let i = 0; i < this._uint8View.length; i++) {
            hex.push(this._uint8View[i].toString(16).padStart(2, '0'));
        }
        return hex.join('');
    }
    /**
     * Convert to base64 string
     */
    toBase64() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < this._uint8View.length) {
            const a = this._uint8View[i++];
            const b = this._uint8View[i++] || 0;
            const c = this._uint8View[i++] || 0;
            result += chars[a >> 2];
            result += chars[((a & 3) << 4) | (b >> 4)];
            result += chars[((b & 15) << 2) | (c >> 6)];
            result += chars[c & 63];
        }
        const padding = (3 - ((this._uint8View.length % 3) || 3)) % 3;
        return result.slice(0, result.length - padding) + '='.repeat(padding);
    }
    /**
     * Create ByteArray from hex string
     */
    static fromHexString(hex) {
        const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
        const bytes = [];
        for (let i = 0; i < cleaned.length; i += 2) {
            bytes.push(parseInt(cleaned.substr(i, 2), 16));
        }
        return new ByteArray(bytes);
    }
    /**
     * Create ByteArray from base64 string
     */
    static fromBase64(base64) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const bytes = [];
        let i = 0;
        const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '');
        while (i < cleaned.length) {
            const a = chars.indexOf(cleaned[i++]);
            const b = chars.indexOf(cleaned[i++]);
            const c = chars.indexOf(cleaned[i++]);
            const d = chars.indexOf(cleaned[i++]);
            bytes.push((a << 2) | (b >> 4));
            if (c !== -1)
                bytes.push(((b & 15) << 4) | (c >> 2));
            if (d !== -1)
                bytes.push(((c & 3) << 6) | d);
        }
        return new ByteArray(bytes);
    }
    /**
     * Create ByteArray from string with encoding
     */
    static fromString(str) {
        return new ByteArray(str);
    }
    _expandToFit(size) {
        if (size > this._buffer.byteLength) {
            const newSize = Math.max(size, this._buffer.byteLength * 2);
            const newBuffer = new ArrayBuffer(newSize);
            const newView = new Uint8Array(newBuffer);
            newView.set(this._uint8View);
            this._buffer = newBuffer;
            this._updateViews();
        }
    }
    toString() {
        return `[ByteArray length=${this.length} position=${this.position}]`;
    }
    valueOf() {
        return this.getArrayBuffer();
    }
}
exports.ByteArray = ByteArray;
//# sourceMappingURL=ByteArray.js.map