/**
 * PowerScript Point - 2D point class
 * 
 * AS3-compatible Point class for representing coordinates and vectors.
 */

export class Point {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Create a copy of this point
     */
    public clone(): Point {
        return new Point(this.x, this.y);
    }

    /**
     * Copy values from another point
     */
    public copyFrom(sourcePoint: Point): void {
        this.x = sourcePoint.x;
        this.y = sourcePoint.y;
    }

    /**
     * Set the coordinates of this point
     */
    public setTo(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Calculate distance to another point
     */
    public distance(point: Point): number {
        const dx = this.x - point.x;
        const dy = this.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get the length (magnitude) of this point as a vector
     */
    public get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalize this point to unit length
     */
    public normalize(): void {
        const len = this.length;
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
    }

    /**
     * Add another point to this point
     */
    public add(point: Point): Point {
        return new Point(this.x + point.x, this.y + point.y);
    }

    /**
     * Subtract another point from this point
     */
    public subtract(point: Point): Point {
        return new Point(this.x - point.x, this.y - point.y);
    }

    /**
     * Multiply this point by a scalar
     */
    public multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar);
    }

    /**
     * Check if this point equals another point
     */
    public equals(point: Point): boolean {
        return this.x === point.x && this.y === point.y;
    }

    /**
     * Offset this point by the specified amounts
     */
    public offset(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Calculate the angle between this point and another point
     */
    public angleTo(point: Point): number {
        return Math.atan2(point.y - this.y, point.x - this.x);
    }

    /**
     * Rotate this point around the origin by the specified angle (in radians)
     */
    public rotate(angle: number): Point {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Point(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * Linear interpolation between this point and another point
     */
    public lerp(point: Point, factor: number): Point {
        return new Point(
            this.x + (point.x - this.x) * factor,
            this.y + (point.y - this.y) * factor
        );
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `(x=${this.x}, y=${this.y})`;
    }

    /**
     * Static method to calculate distance between two points
     */
    public static distance(point1: Point, point2: Point): number {
        return point1.distance(point2);
    }

    /**
     * Static method to interpolate between two points
     */
    public static interpolate(point1: Point, point2: Point, factor: number): Point {
        return point1.lerp(point2, factor);
    }

    /**
     * Static method to create a point from polar coordinates
     */
    public static polar(length: number, angle: number): Point {
        return new Point(
            length * Math.cos(angle),
            length * Math.sin(angle)
        );
    }
}