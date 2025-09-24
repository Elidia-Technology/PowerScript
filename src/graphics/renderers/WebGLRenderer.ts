import { 
    IRenderer, 
    IRenderContext, 
    IRenderStats, 
    ITexture,
    IRenderTarget,
    IRendererConfig
} from './IRenderer';
import { DisplayObject } from '../display/DisplayObject';

/**
 * WebGL texture implementation
 */
class WebGLTextureImpl implements ITexture {
    public readonly id: number;
    public readonly width: number;
    public readonly height: number;
    public readonly format: string;
    public readonly glTexture: WebGLTexture | null;

    constructor(
        id: number,
        width: number,
        height: number,
        format: string = 'RGBA',
        glTexture: WebGLTexture | null = null
    ) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.format = format;
        this.glTexture = glTexture;
    }

    public dispose(): void {
        // Texture disposal will be handled by the renderer
    }
}

/**
 * WebGL render target implementation
 */
class WebGLRenderTargetImpl implements IRenderTarget {
    public readonly width: number;
    public readonly height: number;
    public readonly texture: ITexture | null;
    public readonly framebuffer: WebGLFramebuffer | null;

    constructor(
        width: number,
        height: number,
        texture: ITexture | null = null,
        framebuffer: WebGLFramebuffer | null = null
    ) {
        this.width = width;
        this.height = height;
        this.texture = texture;
        this.framebuffer = framebuffer;
    }

    public bind(): void {
        // Binding will be handled by the renderer
    }

    public unbind(): void {
        // Unbinding will be handled by the renderer
    }

    public dispose(): void {
        // Disposal will be handled by the renderer
    }
}

/**
 * WebGL shader program wrapper
 */
interface IShaderProgramInternal {
    program: WebGLProgram;
    attributes: { [name: string]: number };
    uniforms: { [name: string]: WebGLUniformLocation | null };
}

/**
 * WebGL vertex buffer object
 */
interface IVertexBuffer {
    buffer: WebGLBuffer | null;
    data: Float32Array;
    size: number;
    usage: number;
}

/**
 * WebGL batch rendering data
 */
interface IBatchData {
    vertices: Float32Array;
    indices: Uint16Array;
    vertexCount: number;
    indexCount: number;
    texture: WebGLTexture | null;
}

/**
 * PowerScript WebGL renderer implementation
 * Provides hardware-accelerated 2D rendering using WebGL
 */
export class WebGLRenderer implements IRenderer {
    public readonly type: 'webgl' = 'webgl';
    public readonly context: WebGLRenderingContext | null = null;
    public readonly isInitialized: boolean = false;
    
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private _initialized = false;
    
    // Rendering state
    private currentRenderTarget: IRenderTarget | null = null;
    private viewportWidth = 0;
    private viewportHeight = 0;
    private clearColor = { r: 0, g: 0, b: 0, a: 1 };
    
    // Shader programs
    private shaderPrograms: Map<string, IShaderProgramInternal> = new Map();
    private currentProgram: IShaderProgramInternal | null = null;
    
    // Buffer management  
    private vertexBuffers: Map<string, IVertexBuffer> = new Map();
    private indexBuffer: WebGLBuffer | null = null;
    
    // Batch rendering
    private batchData: IBatchData;
    private maxBatchSize = 10000;
    
    // Texture management
    private textures: Map<number, WebGLTexture> = new Map();
    private renderTargets: Map<string, WebGLRenderTargetImpl> = new Map();
    private nextTextureId = 1;
    
    // Performance statistics
    private stats: IRenderStats = {
        drawCalls: 0,
        triangles: 0,
        textureBinds: 0,
        renderTime: 0,
        frameRate: 0
    };
    
    constructor() {
        // Initialize batch data
        this.batchData = {
            vertices: new Float32Array(this.maxBatchSize * 4 * 8), // 4 verts, 8 components each
            indices: new Uint16Array(this.maxBatchSize * 6), // 6 indices per quad
            vertexCount: 0,
            indexCount: 0,
            texture: null
        };
    }
    
    /**
     * Initialize the WebGL renderer
     */
    public async initialize(context: IRenderContext): Promise<void> {
        try {
            this.canvas = context.canvas;
            
            // Get WebGL context
            this.gl = this.canvas.getContext('webgl') || 
                     this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
            
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            
            // Set initial viewport
            this.viewportWidth = context.width;
            this.viewportHeight = context.height;
            this.gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
            
            // Enable features
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.CULL_FACE);
            
            // Create default shaders
            this.createDefaultShaders();
            
            // Create buffers
            this.createBuffers();
            
            this._initialized = true;
            (this as any).isInitialized = true;
            
        } catch (error) {
            console.error('WebGL renderer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Render display objects to the canvas
     */
    public render(displayObject: DisplayObject): void {
        if (!this.gl || !this._initialized) return;
        
        const startTime = performance.now();
        this.resetStats();
        
        // Clear the canvas
        this.clear();
        
        // Set up rendering state
        this.setupRenderState();
        
        // Render display object hierarchy
        this.renderDisplayObject(displayObject);
        
        // Flush any remaining batched geometry
        this.flushBatch();
        
        // Update performance stats
        this.stats.renderTime = performance.now() - startTime;
        this.stats.frameRate = 1000 / this.stats.renderTime;
    }
    
    /**
     * Clear the render target
     */
    public clear(color?: number, alpha?: number): void {
        if (!this.gl) return;
        
        if (color !== undefined) {
            // Convert hex color to RGB
            const r = ((color >> 16) & 0xFF) / 255;
            const g = ((color >> 8) & 0xFF) / 255;
            const b = (color & 0xFF) / 255;
            const a = alpha !== undefined ? alpha : 1;
            
            this.clearColor = { r, g, b, a };
        }
        
        this.gl.clearColor(
            this.clearColor.r,
            this.clearColor.g,
            this.clearColor.b,
            this.clearColor.a
        );
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    
    /**
     * Resize the renderer
     */
    public resize(width: number, height: number): void {
        if (!this.gl || !this.canvas) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.viewportWidth = width;
        this.viewportHeight = height;
        
        this.gl.viewport(0, 0, width, height);
    }
    
    /**
     * Set the viewport
     */
    public setViewport(x: number, y: number, width: number, height: number): void {
        if (!this.gl) return;
        
        this.gl.viewport(x, y, width, height);
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
    
    /**
     * Get rendering statistics
     */
    public getStats(): IRenderStats {
        return { ...this.stats };
    }
    
    /**
     * Reset performance statistics
     */
    public resetStats(): void {
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            textureBinds: 0,
            renderTime: 0,
            frameRate: 0
        };
    }
    
    /**
     * Dispose of renderer resources
     */
    public dispose(): void {
        if (!this.gl) return;
        
        // Clean up shaders
        this.shaderPrograms.forEach(program => {
            this.gl!.deleteProgram(program.program);
        });
        this.shaderPrograms.clear();
        
        // Clean up buffers
        this.vertexBuffers.forEach(buffer => {
            if (buffer.buffer) {
                this.gl!.deleteBuffer(buffer.buffer);
            }
        });
        this.vertexBuffers.clear();
        
        if (this.indexBuffer) {
            this.gl.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }
        
        // Clean up textures
        this.textures.forEach(texture => {
            this.gl!.deleteTexture(texture);
        });
        this.textures.clear();
        
        // Clean up render targets
        this.renderTargets.forEach(target => {
            if (target.framebuffer) {
                this.gl!.deleteFramebuffer(target.framebuffer);
            }
        });
        this.renderTargets.clear();
        
        this._initialized = false;
        (this as any).isInitialized = false;
    }
    
    /**
     * Create a texture from image data
     */
    public createTexture(imageData: ImageData | HTMLImageElement): ITexture {
        if (!this.gl) {
            throw new Error('WebGL not initialized');
        }
        
        const glTexture = this.gl.createTexture();
        if (!glTexture) {
            throw new Error('Failed to create WebGL texture');
        }
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);
        
        if (typeof ImageData !== 'undefined' && imageData instanceof ImageData) {
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                imageData.width,
                imageData.height,
                0,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                imageData.data
            );
        } else {
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                imageData
            );
        }
        
        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        const textureId = this.nextTextureId++;
        this.textures.set(textureId, glTexture);
        
        const width = (typeof ImageData !== 'undefined' && imageData instanceof ImageData) || 
                     (imageData as any).data ? imageData.width : (imageData as HTMLImageElement).width;
        const height = (typeof ImageData !== 'undefined' && imageData instanceof ImageData) || 
                      (imageData as any).data ? imageData.height : (imageData as HTMLImageElement).height;
        
        return new WebGLTextureImpl(textureId, width, height, 'RGBA', glTexture);
    }
    
    /**
     * Create default shader programs
     */
    private createDefaultShaders(): void {
        if (!this.gl) return;
        
        // Basic vertex shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            attribute vec4 a_color;
            
            uniform mat3 u_matrix;
            uniform vec2 u_resolution;
            
            varying vec2 v_texCoord;
            varying vec4 v_color;
            
            void main() {
                vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
                vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
                
                v_texCoord = a_texCoord;
                v_color = a_color;
            }
        `;
        
        // Basic fragment shader
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform sampler2D u_texture;
            uniform bool u_useTexture;
            
            varying vec2 v_texCoord;
            varying vec4 v_color;
            
            void main() {
                if (u_useTexture) {
                    gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
                } else {
                    gl_FragColor = v_color;
                }
            }
        `;
        
        const program = this.createShaderProgram('basic', vertexShaderSource, fragmentShaderSource);
        if (program) {
            this.currentProgram = program;
        }
    }
    
    /**
     * Create a shader program
     */
    private createShaderProgram(
        name: string,
        vertexSource: string,
        fragmentSource: string
    ): IShaderProgramInternal | null {
        if (!this.gl) return null;
        
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) return null;
        
        const program = this.gl.createProgram();
        if (!program) return null;
        
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        // Get attribute and uniform locations
        const attributes: { [name: string]: number } = {};
        const uniforms: { [name: string]: WebGLUniformLocation | null } = {};
        
        const numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = this.gl.getActiveAttrib(program, i);
            if (info) {
                attributes[info.name] = this.gl.getAttribLocation(program, info.name);
            }
        }
        
        const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = this.gl.getActiveUniform(program, i);
            if (info) {
                uniforms[info.name] = this.gl.getUniformLocation(program, info.name);
            }
        }
        
        const shaderProgram: IShaderProgramInternal = {
            program,
            attributes,
            uniforms
        };
        
        this.shaderPrograms.set(name, shaderProgram);
        return shaderProgram;
    }
    
    /**
     * Compile a shader
     */
    private compileShader(type: number, source: string): WebGLShader | null {
        if (!this.gl) return null;
        
        const shader = this.gl.createShader(type);
        if (!shader) return null;
        
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Create vertex and index buffers
     */
    private createBuffers(): void {
        if (!this.gl) return;
        
        // Create index buffer
        this.indexBuffer = this.gl.createBuffer();
        
        // Create vertex buffer
        const vertexBuffer = this.gl.createBuffer();
        if (vertexBuffer) {
            this.vertexBuffers.set('main', {
                buffer: vertexBuffer,
                data: this.batchData.vertices,
                size: this.batchData.vertices.length,
                usage: this.gl.DYNAMIC_DRAW
            });
        }
    }
    
    /**
     * Set up rendering state
     */
    private setupRenderState(): void {
        if (!this.gl || !this.currentProgram) return;
        
        this.gl.useProgram(this.currentProgram.program);
        
        // Set resolution uniform
        const resolutionLocation = this.currentProgram.uniforms['u_resolution'];
        if (resolutionLocation) {
            this.gl.uniform2f(resolutionLocation, this.viewportWidth, this.viewportHeight);
        }
    }
    
    /**
     * Render a display object and its children
     */
    private renderDisplayObject(obj: DisplayObject): void {
        if (!obj.visible) return;
        
        // For now, just increment draw calls as a placeholder
        // Full implementation would render based on object type
        this.stats.drawCalls++;
    }
    
    /**
     * Flush batched geometry to GPU
     */
    private flushBatch(): void {
        if (!this.gl || !this.currentProgram || this.batchData.vertexCount === 0) return;
        
        // Upload vertex data
        const vertexBuffer = this.vertexBuffers.get('main');
        if (vertexBuffer && vertexBuffer.buffer) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer.buffer);
            this.gl.bufferData(
                this.gl.ARRAY_BUFFER,
                this.batchData.vertices.subarray(0, this.batchData.vertexCount * 8),
                this.gl.DYNAMIC_DRAW
            );
        }
        
        // Upload index data
        if (this.indexBuffer) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            this.gl.bufferData(
                this.gl.ELEMENT_ARRAY_BUFFER,
                this.batchData.indices.subarray(0, this.batchData.indexCount),
                this.gl.DYNAMIC_DRAW
            );
        }
        
        // Set up vertex attributes
        this.setupVertexAttributes();
        
        // Draw
        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.batchData.indexCount,
            this.gl.UNSIGNED_SHORT,
            0
        );
        
        // Reset batch
        this.batchData.vertexCount = 0;
        this.batchData.indexCount = 0;
        
        this.stats.triangles += this.batchData.indexCount / 3;
    }
    
    /**
     * Set up vertex attributes
     */
    private setupVertexAttributes(): void {
        if (!this.gl || !this.currentProgram) return;
        
        const stride = 8 * 4; // 8 floats per vertex, 4 bytes per float
        
        // Position attribute
        const positionLocation = this.currentProgram.attributes['a_position'];
        if (positionLocation !== undefined) {
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, stride, 0);
        }
        
        // Texture coordinate attribute
        const texCoordLocation = this.currentProgram.attributes['a_texCoord'];
        if (texCoordLocation !== undefined) {
            this.gl.enableVertexAttribArray(texCoordLocation);
            this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, stride, 2 * 4);
        }
        
        // Color attribute
        const colorLocation = this.currentProgram.attributes['a_color'];
        if (colorLocation !== undefined) {
            this.gl.enableVertexAttribArray(colorLocation);
            this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, stride, 4 * 4);
        }
    }
}