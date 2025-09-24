/**
 * PowerScript Matrix - 2D transformation matrix
 * 
 * AS3-compatible Matrix class for 2D transformations.
 * Represents a 3x3 transformation matrix in 2D space.
 */

import { Point } from './Point';

export class Matrix {
    public a: number; // Scale X
    public b: number; // Skew Y
    public c: number; // Skew X
    public d: number; // Scale Y
    public tx: number; // Translate X
    public ty: number; // Translate Y

    constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1, tx: number = 0, ty: number = 0) {
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
    public clone(): Matrix {
        return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }

    /**
     * Copy values from another matrix
     */
    public copyFrom(sourceMatrix: Matrix): void {
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
    public identity(): void {
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
    public setTo(a: number, b: number, c: number, d: number, tx: number, ty: number): void {
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
    public concat(matrix: Matrix): void {
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
    public translate(dx: number, dy: number): void {
        this.tx += dx;
        this.ty += dy;
    }

    /**
     * Apply a scaling transformation
     */
    public scale(sx: number, sy: number): void {
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
    public rotate(angle: number): void {
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
    public skew(skewX: number, skewY: number): void {
        const sinX = Math.sin(skewX);
        const cosX = Math.cos(skewX);
        const sinY = Math.sin(skewY);
        const cosY = Math.cos(skewY);

        this.concat(new Matrix(
            cosY, sinY,
            -sinX, cosX,
            0, 0
        ));
    }

    /**
     * Transform a point using this matrix
     */
    public transformPoint(point: Point): Point {
        return new Point(
            this.a * point.x + this.c * point.y + this.tx,
            this.b * point.x + this.d * point.y + this.ty
        );
    }

    /**
     * Transform a point in place using this matrix
     */
    public transformPointInPlace(point: Point): void {
        const x = this.a * point.x + this.c * point.y + this.tx;
        const y = this.b * point.x + this.d * point.y + this.ty;
        point.x = x;
        point.y = y;
    }

    /**
     * Transform a vector (ignoring translation) using this matrix
     */
    public deltaTransformPoint(point: Point): Point {
        return new Point(
            this.a * point.x + this.c * point.y,
            this.b * point.x + this.d * point.y
        );
    }

    /**
     * Get the inverse of this matrix
     */
    public invert(): Matrix {
        const det = this.a * this.d - this.b * this.c;
        
        if (det === 0) {
            // Matrix is not invertible
            return new Matrix();
        }

        const invDet = 1 / det;
        
        return new Matrix(
            this.d * invDet,
            -this.b * invDet,
            -this.c * invDet,
            this.a * invDet,
            (this.c * this.ty - this.d * this.tx) * invDet,
            (this.b * this.tx - this.a * this.ty) * invDet
        );
    }

    /**
     * Invert this matrix in place
     */
    public invertInPlace(): void {
        const inverted = this.invert();
        this.copyFrom(inverted);
    }

    /**
     * Get the determinant of this matrix
     */
    public getDeterminant(): number {
        return this.a * this.d - this.b * this.c;
    }

    /**
     * Check if this matrix equals another matrix
     */
    public equals(matrix: Matrix): boolean {
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
    public isIdentity(): boolean {
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
    public getTranslation(): Point {
        return new Point(this.tx, this.ty);
    }

    /**
     * Get the scale factors
     */
    public getScale(): Point {
        const scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
        const scaleY = Math.sqrt(this.c * this.c + this.d * this.d);
        return new Point(scaleX, scaleY);
    }

    /**
     * Get the rotation angle in radians
     */
    public getRotation(): number {
        return Math.atan2(this.b, this.a);
    }

    /**
     * Convert to CSS transform string
     */
    public toCSSTransform(): string {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.tx}, ${this.ty})`;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `(a=${this.a}, b=${this.b}, c=${this.c}, d=${this.d}, tx=${this.tx}, ty=${this.ty})`;
    }

    /**
     * Create a translation matrix
     */
    public static createTranslation(dx: number, dy: number): Matrix {
        return new Matrix(1, 0, 0, 1, dx, dy);
    }

    /**
     * Create a scaling matrix
     */
    public static createScale(sx: number, sy: number): Matrix {
        return new Matrix(sx, 0, 0, sy, 0, 0);
    }

    /**
     * Create a rotation matrix (angle in radians)
     */
    public static createRotation(angle: number): Matrix {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix(cos, sin, -sin, cos, 0, 0);
    }

    /**
     * Create a skew matrix
     */
    public static createSkew(skewX: number, skewY: number): Matrix {
        return new Matrix(
            Math.cos(skewY), Math.sin(skewY),
            -Math.sin(skewX), Math.cos(skewX),
            0, 0
        );
    }
}