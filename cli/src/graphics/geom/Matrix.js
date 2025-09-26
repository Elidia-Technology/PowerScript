"use strict";
/**
 * PowerScript Matrix - 2D transformation matrix
 *
 * AS3-compatible Matrix class for 2D transformations.
 * Represents a 3x3 transformation matrix in 2D space.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matrix = void 0;
const Point_1 = require("./Point");
const Rectangle_1 = require("./Rectangle");
class Matrix {
    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
    /**
     * Create a copy of this matrix
     */
    clone() {
        return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }
    /**
     * Copy values from another matrix
     */
    copyFrom(sourceMatrix) {
        this.a = sourceMatrix.a;
        this.b = sourceMatrix.b;
        this.c = sourceMatrix.c;
        this.d = sourceMatrix.d;
        this.tx = sourceMatrix.tx;
        this.ty = sourceMatrix.ty;
    }
    /**
     * Set this matrix to the identity matrix
     */
    identity() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
    }
    /**
     * Set the values of this matrix
     */
    setTo(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
    /**
     * Concatenate another matrix with this matrix
     */
    concat(matrix) {
        const a = this.a * matrix.a + this.b * matrix.c;
        const b = this.a * matrix.b + this.b * matrix.d;
        const c = this.c * matrix.a + this.d * matrix.c;
        const d = this.c * matrix.b + this.d * matrix.d;
        const tx = this.tx * matrix.a + this.ty * matrix.c + matrix.tx;
        const ty = this.tx * matrix.b + this.ty * matrix.d + matrix.ty;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
    /**
     * Apply a translation transformation
     */
    translate(dx, dy) {
        this.tx += dx;
        this.ty += dy;
    }
    /**
     * Apply a scaling transformation
     */
    scale(sx, sy) {
        this.a *= sx;
        this.b *= sy;
        this.c *= sx;
        this.d *= sy;
        this.tx *= sx;
        this.ty *= sy;
    }
    /**
     * Apply a rotation transformation (angle in radians)
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a = this.a * cos - this.b * sin;
        const b = this.a * sin + this.b * cos;
        const c = this.c * cos - this.d * sin;
        const d = this.c * sin + this.d * cos;
        const tx = this.tx * cos - this.ty * sin;
        const ty = this.tx * sin + this.ty * cos;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
    /**
     * Apply a skew transformation
     */
    skew(skewX, skewY) {
        const sinX = Math.sin(skewX);
        const cosX = Math.cos(skewX);
        const sinY = Math.sin(skewY);
        const cosY = Math.cos(skewY);
        this.concat(new Matrix(cosY, sinY, -sinX, cosX, 0, 0));
    }
    /**
     * Transform a point using this matrix
     */
    transformPoint(point) {
        return new Point_1.Point(this.a * point.x + this.c * point.y + this.tx, this.b * point.x + this.d * point.y + this.ty);
    }
    /**
     * Transform a point in place using this matrix
     */
    transformPointInPlace(point) {
        const x = this.a * point.x + this.c * point.y + this.tx;
        const y = this.b * point.x + this.d * point.y + this.ty;
        point.x = x;
        point.y = y;
    }
    /**
     * Transform a vector (ignoring translation) using this matrix
     */
    deltaTransformPoint(point) {
        return new Point_1.Point(this.a * point.x + this.c * point.y, this.b * point.x + this.d * point.y);
    }
    /**
     * Get the inverse of this matrix
     */
    invert() {
        const det = this.a * this.d - this.b * this.c;
        if (det === 0) {
            // Matrix is not invertible
            return new Matrix();
        }
        const invDet = 1 / det;
        return new Matrix(this.d * invDet, -this.b * invDet, -this.c * invDet, this.a * invDet, (this.c * this.ty - this.d * this.tx) * invDet, (this.b * this.tx - this.a * this.ty) * invDet);
    }
    /**
     * Invert this matrix in place
     */
    invertInPlace() {
        const inverted = this.invert();
        this.copyFrom(inverted);
    }
    /**
     * Get the determinant of this matrix
     */
    getDeterminant() {
        return this.a * this.d - this.b * this.c;
    }
    /**
     * Check if this matrix equals another matrix
     */
    equals(matrix) {
        return this.a === matrix.a &&
            this.b === matrix.b &&
            this.c === matrix.c &&
            this.d === matrix.d &&
            this.tx === matrix.tx &&
            this.ty === matrix.ty;
    }
    /**
     * Check if this matrix is the identity matrix
     */
    isIdentity() {
        return this.a === 1 &&
            this.b === 0 &&
            this.c === 0 &&
            this.d === 1 &&
            this.tx === 0 &&
            this.ty === 0;
    }
    /**
     * Get the translation component as a Point
     */
    getTranslation() {
        return new Point_1.Point(this.tx, this.ty);
    }
    /**
     * Get the scale factors
     */
    getScale() {
        const scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
        const scaleY = Math.sqrt(this.c * this.c + this.d * this.d);
        return new Point_1.Point(scaleX, scaleY);
    }
    /**
     * Get the rotation angle in radians
     */
    getRotation() {
        return Math.atan2(this.b, this.a);
    }
    /**
     * Convert to CSS transform string
     */
    toCSSTransform() {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.tx}, ${this.ty})`;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `(a=${this.a}, b=${this.b}, c=${this.c}, d=${this.d}, tx=${this.tx}, ty=${this.ty})`;
    }
    /**
     * Create a translation matrix
     */
    static createTranslation(dx, dy) {
        return new Matrix(1, 0, 0, 1, dx, dy);
    }
    /**
     * Create a scaling matrix
     */
    static createScale(sx, sy) {
        return new Matrix(sx, 0, 0, sy, 0, 0);
    }
    /**
     * Create a rotation matrix (angle in radians)
     */
    static createRotation(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix(cos, sin, -sin, cos, 0, 0);
    }
    /**
     * Transform a rectangle by this matrix
     */
    transformRectangle(rect) {
        // Transform all four corners of the rectangle
        const topLeft = this.transformPoint(new Point_1.Point(rect.x, rect.y));
        const topRight = this.transformPoint(new Point_1.Point(rect.x + rect.width, rect.y));
        const bottomLeft = this.transformPoint(new Point_1.Point(rect.x, rect.y + rect.height));
        const bottomRight = this.transformPoint(new Point_1.Point(rect.x + rect.width, rect.y + rect.height));
        // Find bounding box of transformed corners
        const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
        const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
        const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
        // Return new Rectangle instance with transformed bounds
        return new Rectangle_1.Rectangle(minX, minY, maxX - minX, maxY - minY);
    }
    /**
     * Create a skew matrix
     */
    static createSkew(skewX, skewY) {
        return new Matrix(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), 0, 0);
    }
}
exports.Matrix = Matrix;
