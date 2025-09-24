/**
 * PowerScript Rectangle - Rectangle geometry class
 * 
 * AS3-compatible Rectangle class for representing rectangular areas.
 */

import { Point } from './Point';

export class Rectangle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Get the left edge of the rectangle
     */
    public get left(): number {
        return this.x;
    }

    public set left(value: number) {
        this.width += this.x - value;
        this.x = value;
    }

    /**
     * Get the right edge of the rectangle
     */
    public get right(): number {
        return this.x + this.width;
    }

    public set right(value: number) {
        this.width = value - this.x;
    }

    /**
     * Get the top edge of the rectangle
     */
    public get top(): number {
        return this.y;
    }

    public set top(value: number) {
        this.height += this.y - value;
        this.y = value;
    }

    /**
     * Get the bottom edge of the rectangle
     */
    public get bottom(): number {
        return this.y + this.height;
    }

    public set bottom(value: number) {
        this.height = value - this.y;
    }

    /**
     * Get the top-left corner as a Point
     */
    public get topLeft(): Point {
        return new Point(this.x, this.y);
    }

    public set topLeft(value: Point) {
        this.left = value.x;
        this.top = value.y;
    }

    /**
     * Get the bottom-right corner as a Point
     */
    public get bottomRight(): Point {
        return new Point(this.right, this.bottom);
    }

    public set bottomRight(value: Point) {
        this.right = value.x;
        this.bottom = value.y;
    }

    /**
     * Get the center point of the rectangle
     */
    public get center(): Point {
        return new Point(this.x + this.width / 2, this.y + this.height / 2);
    }

    /**
     * Get the size of the rectangle as a Point
     */
    public get size(): Point {
        return new Point(this.width, this.height);
    }

    public set size(value: Point) {
        this.width = value.x;
        this.height = value.y;
    }

    /**
     * Check if the rectangle is empty (zero width or height)
     */
    public isEmpty(): boolean {
        return this.width <= 0 || this.height <= 0;
    }

    /**
     * Create a copy of this rectangle
     */
    public clone(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    /**
     * Copy values from another rectangle
     */
    public copyFrom(sourceRect: Rectangle): void {
        this.x = sourceRect.x;
        this.y = sourceRect.y;
        this.width = sourceRect.width;
        this.height = sourceRect.height;
    }

    /**
     * Set the values of this rectangle
     */
    public setTo(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Set this rectangle to empty (zero size)
     */
    public setEmpty(): void {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Check if a point is contained within this rectangle
     */
    public contains(x: number, y: number): boolean {
        return x >= this.x && x < this.right && y >= this.y && y < this.bottom;
    }

    /**
     * Check if a point is contained within this rectangle
     */
    public containsPoint(point: Point): boolean {
        return this.contains(point.x, point.y);
    }

    /**
     * Check if another rectangle is completely contained within this rectangle
     */
    public containsRect(rect: Rectangle): boolean {
        return rect.x >= this.x && 
               rect.y >= this.y && 
               rect.right <= this.right && 
               rect.bottom <= this.bottom;
    }

    /**
     * Check if this rectangle intersects with another rectangle
     */
    public intersects(rect: Rectangle): boolean {
        return !(rect.x >= this.right || 
                rect.right <= this.x || 
                rect.y >= this.bottom || 
                rect.bottom <= this.y);
    }

    /**
     * Get the intersection of this rectangle with another rectangle
     */
    public intersection(rect: Rectangle): Rectangle {
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
    public union(rect: Rectangle): Rectangle {
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
    public includePoint(point: Point): void {
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
    public includeRect(rect: Rectangle): void {
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
    public inflate(dx: number, dy: number): void {
        this.x -= dx;
        this.y -= dy;
        this.width += 2 * dx;
        this.height += 2 * dy;
    }

    /**
     * Inflate this rectangle by a Point
     */
    public inflatePoint(point: Point): void {
        this.inflate(point.x, point.y);
    }

    /**
     * Offset this rectangle by the specified amounts
     */
    public offset(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Offset this rectangle by a Point
     */
    public offsetPoint(point: Point): void {
        this.offset(point.x, point.y);
    }

    /**
     * Check if this rectangle equals another rectangle
     */
    public equals(rect: Rectangle): boolean {
        return this.x === rect.x && 
               this.y === rect.y && 
               this.width === rect.width && 
               this.height === rect.height;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `(x=${this.x}, y=${this.y}, w=${this.width}, h=${this.height})`;
    }
}