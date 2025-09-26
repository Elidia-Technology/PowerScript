"use strict";
/**
 * PowerScript Rectangle - Rectangle geometry class
 *
 * AS3-compatible Rectangle class for representing rectangular areas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rectangle = void 0;
const Point_1 = require("./Point");
class Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    /**
     * Get the left edge of the rectangle
     */
    get left() {
        return this.x;
    }
    set left(value) {
        this.width += this.x - value;
        this.x = value;
    }
    /**
     * Get the right edge of the rectangle
     */
    get right() {
        return this.x + this.width;
    }
    set right(value) {
        this.width = value - this.x;
    }
    /**
     * Get the top edge of the rectangle
     */
    get top() {
        return this.y;
    }
    set top(value) {
        this.height += this.y - value;
        this.y = value;
    }
    /**
     * Get the bottom edge of the rectangle
     */
    get bottom() {
        return this.y + this.height;
    }
    set bottom(value) {
        this.height = value - this.y;
    }
    /**
     * Get the top-left corner as a Point
     */
    get topLeft() {
        return new Point_1.Point(this.x, this.y);
    }
    set topLeft(value) {
        this.left = value.x;
        this.top = value.y;
    }
    /**
     * Get the bottom-right corner as a Point
     */
    get bottomRight() {
        return new Point_1.Point(this.right, this.bottom);
    }
    set bottomRight(value) {
        this.right = value.x;
        this.bottom = value.y;
    }
    /**
     * Get the center point of the rectangle
     */
    get center() {
        return new Point_1.Point(this.x + this.width / 2, this.y + this.height / 2);
    }
    /**
     * Get the size of the rectangle as a Point
     */
    get size() {
        return new Point_1.Point(this.width, this.height);
    }
    set size(value) {
        this.width = value.x;
        this.height = value.y;
    }
    /**
     * Check if the rectangle is empty (zero width or height)
     */
    isEmpty() {
        return this.width <= 0 || this.height <= 0;
    }
    /**
     * Create a copy of this rectangle
     */
    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
    /**
     * Copy values from another rectangle
     */
    copyFrom(sourceRect) {
        this.x = sourceRect.x;
        this.y = sourceRect.y;
        this.width = sourceRect.width;
        this.height = sourceRect.height;
    }
    /**
     * Set the values of this rectangle
     */
    setTo(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    /**
     * Set this rectangle to empty (zero size)
     */
    setEmpty() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
    /**
     * Check if a point is contained within this rectangle
     */
    contains(x, y) {
        return x >= this.x && x < this.right && y >= this.y && y < this.bottom;
    }
    /**
     * Check if a point is contained within this rectangle
     */
    containsPoint(point) {
        return this.contains(point.x, point.y);
    }
    /**
     * Check if another rectangle is completely contained within this rectangle
     */
    containsRect(rect) {
        return rect.x >= this.x &&
            rect.y >= this.y &&
            rect.right <= this.right &&
            rect.bottom <= this.bottom;
    }
    /**
     * Check if this rectangle intersects with another rectangle
     */
    intersects(rect) {
        return !(rect.x >= this.right ||
            rect.right <= this.x ||
            rect.y >= this.bottom ||
            rect.bottom <= this.y);
    }
    /**
     * Get the intersection of this rectangle with another rectangle
     */
    intersection(rect) {
        if (!this.intersects(rect)) {
            return new Rectangle();
        }
        const x = Math.max(this.x, rect.x);
        const y = Math.max(this.y, rect.y);
        const right = Math.min(this.right, rect.right);
        const bottom = Math.min(this.bottom, rect.bottom);
        return new Rectangle(x, y, right - x, bottom - y);
    }
    /**
     * Get the union of this rectangle with another rectangle
     */
    union(rect) {
        if (this.isEmpty()) {
            return rect.clone();
        }
        if (rect.isEmpty()) {
            return this.clone();
        }
        const x = Math.min(this.x, rect.x);
        const y = Math.min(this.y, rect.y);
        const right = Math.max(this.right, rect.right);
        const bottom = Math.max(this.bottom, rect.bottom);
        return new Rectangle(x, y, right - x, bottom - y);
    }
    /**
     * Expand this rectangle to include a point
     */
    includePoint(point) {
        if (this.isEmpty()) {
            this.x = point.x;
            this.y = point.y;
            this.width = 0;
            this.height = 0;
            return;
        }
        const left = Math.min(this.x, point.x);
        const right = Math.max(this.right, point.x);
        const top = Math.min(this.y, point.y);
        const bottom = Math.max(this.bottom, point.y);
        this.x = left;
        this.y = top;
        this.width = right - left;
        this.height = bottom - top;
    }
    /**
     * Expand this rectangle to include another rectangle
     */
    includeRect(rect) {
        if (rect.isEmpty()) {
            return;
        }
        if (this.isEmpty()) {
            this.copyFrom(rect);
            return;
        }
        const left = Math.min(this.x, rect.x);
        const right = Math.max(this.right, rect.right);
        const top = Math.min(this.y, rect.y);
        const bottom = Math.max(this.bottom, rect.bottom);
        this.x = left;
        this.y = top;
        this.width = right - left;
        this.height = bottom - top;
    }
    /**
     * Inflate this rectangle by the specified amounts
     */
    inflate(dx, dy) {
        this.x -= dx;
        this.y -= dy;
        this.width += 2 * dx;
        this.height += 2 * dy;
    }
    /**
     * Inflate this rectangle by a Point
     */
    inflatePoint(point) {
        this.inflate(point.x, point.y);
    }
    /**
     * Offset this rectangle by the specified amounts
     */
    offset(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    /**
     * Offset this rectangle by a Point
     */
    offsetPoint(point) {
        this.offset(point.x, point.y);
    }
    /**
     * Check if this rectangle equals another rectangle
     */
    equals(rect) {
        return this.x === rect.x &&
            this.y === rect.y &&
            this.width === rect.width &&
            this.height === rect.height;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `(x=${this.x}, y=${this.y}, w=${this.width}, h=${this.height})`;
    }
}
exports.Rectangle = Rectangle;
