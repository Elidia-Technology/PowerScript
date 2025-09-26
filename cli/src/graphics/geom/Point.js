"use strict";
/**
 * PowerScript Point - 2D point class
 *
 * AS3-compatible Point class for representing coordinates and vectors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = void 0;
class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    /**
     * Create a copy of this point
     */
    clone() {
        return new Point(this.x, this.y);
    }
    /**
     * Copy values from another point
     */
    copyFrom(sourcePoint) {
        this.x = sourcePoint.x;
        this.y = sourcePoint.y;
    }
    /**
     * Set the coordinates of this point
     */
    setTo(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Calculate distance to another point
     */
    distance(point) {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Get the length (magnitude) of this point as a vector
     */
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Normalize this point to unit length
     */
    normalize() {
        const len = this.length;
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
    }
    /**
     * Add another point to this point
     */
    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }
    /**
     * Subtract another point from this point
     */
    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    /**
     * Multiply this point by a scalar
     */
    multiply(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }
    /**
     * Check if this point equals another point
     */
    equals(point) {
        return this.x === point.x && this.y === point.y;
    }
    /**
     * Offset this point by the specified amounts
     */
    offset(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    /**
     * Calculate the angle between this point and another point
     */
    angleTo(point) {
        return Math.atan2(point.y - this.y, point.x - this.x);
    }
    /**
     * Rotate this point around the origin by the specified angle (in radians)
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    /**
     * Linear interpolation between this point and another point
     */
    lerp(point, factor) {
        return new Point(this.x + (point.x - this.x) * factor, this.y + (point.y - this.y) * factor);
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `(x=${this.x}, y=${this.y})`;
    }
    /**
     * Static method to calculate distance between two points
     */
    static distance(point1, point2) {
        return point1.distance(point2);
    }
    /**
     * Static method to interpolate between two points
     */
    static interpolate(point1, point2, factor) {
        return point1.lerp(point2, factor);
    }
    /**
     * Static method to create a point from polar coordinates
     */
    static polar(length, angle) {
        return new Point(length * Math.cos(angle), length * Math.sin(angle));
    }
}
exports.Point = Point;
