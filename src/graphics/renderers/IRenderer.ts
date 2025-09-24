/**
 * PowerScript IRenderer - Base interface for all rendering backends
 * 
 * Defines the contract that all rendering implementations must follow.
 * Supports both Canvas 2D and WebGL rendering pipelines.
 */

import { Stage } from '../display/Stage';
import { DisplayObject } from '../display/DisplayObject';
import { Rectangle } from '../geom/Rectangle';

export interface IRenderContext {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    pixelRatio: number;
    antialias: boolean;
}

export interface IRenderStats {
    drawCalls: number;
    triangles: number;
    textureBinds: number;
    renderTime: number;
    frameRate: number;
}

export interface IRenderer {
    /**
     * Initialize the renderer with a canvas context
     */
    initialize(context: IRenderContext): Promise<void>;

    /**
     * Render a display object hierarchy to the target
     */
    render(displayObject: DisplayObject): void;

    /**
     * Clear the render target
     */
    clear(color?: number, alpha?: number): void;

    /**
     * Resize the render target
     */
    resize(width: number, height: number): void;

    /**
     * Set the viewport for rendering
     */
    setViewport(x: number, y: number, width: number, height: number): void;

    /**
     * Get current render statistics
     */
    getStats(): IRenderStats;

    /**
     * Reset render statistics
     */
    resetStats(): void;

    /**
     * Dispose of renderer resources
     */
    dispose(): void;

    /**
     * Check if renderer is initialized
     */
    readonly isInitialized: boolean;

    /**
     * Get the renderer type
     */
    readonly type: 'canvas2d' | 'webgl' | 'webgl2';

    /**
     * Get the rendering context
     */
    readonly context: any;
}

export interface ITexture {
    readonly width: number;
    readonly height: number;
    readonly format: string;
    readonly id: number;
    dispose(): void;
}

export interface ITextureLoader {
    load(source: string | HTMLImageElement | ImageData): Promise<ITexture>;
    loadFromData(data: Uint8Array, width: number, height: number): ITexture;
    dispose(texture: ITexture): void;
}

export interface IRenderTarget {
    readonly width: number;
    readonly height: number;
    readonly texture: ITexture | null;
    bind(): void;
    unbind(): void;
    dispose(): void;
}

/**
 * Render state for batching optimizations
 */
export interface IRenderState {
    texture: ITexture | null;
    blendMode: string;
    alpha: number;
    transform: Float32Array;
    clipRect: Rectangle | null;
}

/**
 * Batch data for efficient rendering
 */
export interface IRenderBatch {
    vertices: Float32Array;
    indices: Uint16Array;
    vertexCount: number;
    indexCount: number;
    texture: ITexture | null;
    blendMode: string;
    alpha: number;
}

/**
 * Base renderer configuration
 */
export interface IRendererConfig {
    antialias?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    alpha?: boolean;
    depth?: boolean;
    stencil?: boolean;
    maxTextures?: number;
    maxBatchSize?: number;
}

/**
 * Shader program interface for WebGL renderers
 */
export interface IShaderProgram {
    readonly program: WebGLProgram;
    readonly attributes: { [name: string]: number };
    readonly uniforms: { [name: string]: WebGLUniformLocation };
    bind(): void;
    unbind(): void;
    setUniform(name: string, value: any): void;
    dispose(): void;
}

export default IRenderer;