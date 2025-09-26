# PowerScript Graphics & Multimedia Module

## Abstract

The PowerScript Graphics & Multimedia module provides comprehensive 2D/3D graphics rendering, multimedia processing, and interactive content creation capabilities with both Canvas 2D and WebGL support.

## Table of Contents

1. [Overview](#overview)
2. [Graphics Rendering](#graphics-rendering)
3. [Multimedia Processing](#multimedia-processing)
4. [Animation System](#animation-system)
5. [WebGL Rendering](#webgl-rendering)
6. [Canvas 2D Rendering](#canvas-2d-rendering)
7. [API Reference](#api-reference)
8. [Examples](#examples)

## 1. Overview

### 1.1 Purpose

The Graphics & Multimedia module enables developers to create rich visual applications:

- **2D Graphics**: Canvas 2D rendering with PowerScript-style drawing APIs
- **3D Graphics**: WebGL-based 3D rendering with shaders and textures
- **Multimedia**: Audio and video processing capabilities
- **Animation**: Timeline-based animation system with easing functions
- **Interactive Content**: Event-driven graphics programming
- **Performance**: Hardware-accelerated rendering with optimization features

### 1.2 Dependencies

```json
{
  "dependencies": {
    "canvas": "^2.11.2",
    "gl": "^6.0.2",
    "ffmpeg-static": "^5.1.0",
    "node-canvas": "^2.11.2"
  }
}
```

### 1.3 Import Syntax

```powerscript
// Import graphics module
import { PowerScriptGraphics } from 'powerscript/graphics';

// Or access through main PowerScript class
import { PowerScript } from 'powerscript';
const graphics = PowerScript.graphics;
```

## 2. Graphics Rendering

### 2.1 Graphics System Interface

```typescript
interface GraphicsConfig {
    renderer: 'canvas2d' | 'webgl' | 'software';
    width: number;
    height: number;
    antialias?: boolean;
    alpha?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
}

interface RenderStats {
    drawCalls: number;
    triangles: number;
    textureBinds: number;
    renderTime: number;
    frameRate: number;
}

class PowerScriptGraphics extends EventDispatcher {
    constructor(config?: GraphicsConfig)
    
    // Canvas management
    createCanvas(width: number, height: number): PSCanvas
    getCanvas(): PSCanvas
    resizeCanvas(width: number, height: number): void
    
    // Rendering
    createRenderer(type: 'canvas2d' | 'webgl'): IRenderer
    getCurrentRenderer(): IRenderer
    
    // Multimedia
    createAudioPlayer(options?: AudioPlayerOptions): AudioPlayer
    createVideoPlayer(options?: VideoPlayerOptions): VideoPlayer
    
    // Animation
    createAnimation(target: any, properties: any, duration: number): Animation
    createTween(target: any): Tween
    
    // Utilities
    getCapabilities(): string[]
    getSupportedFormats(): { audio: string[], video: string[] }
    getStats(): RenderStats
    
    // Lifecycle
    render(): void
    clear(color?: number): void
    dispose(): void
}
```

### 2.2 Basic Graphics Setup

```powerscript
import { PowerScript } from 'powerscript';

async function setupGraphics() {
    const graphics = PowerScript.graphics;
    
    // Initialize graphics system
    await graphics.initialize({
        renderer: 'webgl',
        width: 1024,
        height: 768,
        antialias: true,
        alpha: true
    });
    
    console.log('Graphics initialized');
    console.log('Capabilities:', graphics.getCapabilities());
    console.log('Supported formats:', graphics.getSupportedFormats());
    
    // Create main canvas
    const canvas = graphics.createCanvas(1024, 768);
    
    // Set up basic rendering
    const renderer = graphics.getCurrentRenderer();
    
    // Clear with blue background
    graphics.clear(0x0066CC);
    
    // Render the scene
    graphics.render();
    
    return graphics;
}
```

## 3. Multimedia Processing

### 3.1 Audio Processing

```typescript
interface AudioPlayerOptions {
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
    crossOrigin?: string;
}

interface AudioPlayer {
    load(url: string): Promise<void>
    play(): Promise<void>
    pause(): void
    stop(): void
    
    seek(time: number): void
    
    get currentTime(): number
    get duration(): number
    get volume(): number
    set volume(value: number)
    
    get playing(): boolean
    get ended(): boolean
    get buffered(): TimeRanges
    
    addEventListener(event: string, handler: Function): void
    removeEventListener(event: string, handler: Function): void
}
```

### 3.2 Audio Implementation

```powerscript
async function audioProcessingExample() {
    const graphics = PowerScript.graphics;
    
    // Create audio player
    const audioPlayer = graphics.createAudioPlayer({
        volume: 0.8,
        loop: false,
        autoplay: false
    });
    
    // Load audio file
    await audioPlayer.load('/assets/background-music.mp3');
    
    // Set up event listeners
    audioPlayer.addEventListener('loadstart', () => {
        console.log('Audio loading started');
    });
    
    audioPlayer.addEventListener('canplay', () => {
        console.log('Audio ready to play');
    });
    
    audioPlayer.addEventListener('play', () => {
        console.log('Audio playback started');
    });
    
    audioPlayer.addEventListener('ended', () => {
        console.log('Audio playback finished');
    });
    
    audioPlayer.addEventListener('error', (error) => {
        console.error('Audio error:', error);
    });
    
    // Play audio
    try {
        await audioPlayer.play();
        console.log('Playing audio...');
        
        // Control playback
        setTimeout(() => {
            audioPlayer.volume = 0.5; // Reduce volume
        }, 5000);
        
        setTimeout(() => {
            audioPlayer.pause(); // Pause after 10 seconds
        }, 10000);
        
    } catch (error) {
        console.error('Failed to play audio:', error);
    }
}
```

### 3.3 Video Processing

```typescript
interface VideoPlayerOptions {
    width?: number;
    height?: number;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
}

interface VideoPlayer {
    load(url: string): Promise<void>
    play(): Promise<void>
    pause(): void
    stop(): void
    
    seek(time: number): void
    captureFrame(): ImageData
    
    get currentTime(): number
    get duration(): number
    get videoWidth(): number
    get videoHeight(): number
    
    get playing(): boolean
    get ended(): boolean
    get readyState(): number
    
    addEventListener(event: string, handler: Function): void
}
```

### 3.4 Video Implementation

```powerscript
async function videoProcessingExample() {
    const graphics = PowerScript.graphics;
    
    // Create video player
    const videoPlayer = graphics.createVideoPlayer({
        width: 800,
        height: 600,
        controls: true,
        autoplay: false,
        loop: false
    });
    
    // Load video
    await videoPlayer.load('/assets/demo-video.mp4');
    
    // Set up event listeners
    videoPlayer.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
        console.log(`Dimensions: ${videoPlayer.videoWidth}x${videoPlayer.videoHeight}`);
        console.log(`Duration: ${videoPlayer.duration} seconds`);
    });
    
    videoPlayer.addEventListener('canplay', () => {
        console.log('Video ready to play');
    });
    
    videoPlayer.addEventListener('timeupdate', () => {
        const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        console.log(`Playback progress: ${progress.toFixed(1)}%`);
    });
    
    // Play video
    await videoPlayer.play();
    
    // Capture frame after 5 seconds
    setTimeout(() => {
        const frameData = videoPlayer.captureFrame();
        console.log('Captured frame:', frameData.width, 'x', frameData.height);
        
        // Process the frame data
        processVideoFrame(frameData);
    }, 5000);
}

function processVideoFrame(frameData: ImageData): void {
    // Example: Apply a simple filter to the frame
    const data = frameData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
    }
    
    console.log('Applied grayscale filter to video frame');
}
```

## 4. Animation System

### 4.1 Animation Interface

```typescript
interface AnimationOptions {
    duration: number;
    easing?: EasingFunction;
    delay?: number;
    repeat?: number;
    yoyo?: boolean;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
}

interface Tween {
    to(properties: any, duration?: number): Tween
    from(properties: any, duration?: number): Tween
    set(properties: any): Tween
    
    delay(time: number): Tween
    repeat(count: number): Tween
    yoyo(enable: boolean): Tween
    easing(func: EasingFunction): Tween
    
    onUpdate(callback: (target: any) => void): Tween
    onComplete(callback: () => void): Tween
    
    start(): Tween
    stop(): Tween
    pause(): Tween
    resume(): Tween
    
    get progress(): number
    get isActive(): boolean
}

enum EasingType {
    Linear = 'linear',
    QuadIn = 'quad.in',
    QuadOut = 'quad.out',
    QuadInOut = 'quad.inout',
    CubicIn = 'cubic.in',
    CubicOut = 'cubic.out',
    ElasticIn = 'elastic.in',
    ElasticOut = 'elastic.out',
    BounceOut = 'bounce.out'
}
```

### 4.2 Animation Examples

```powerscript
import { PowerScript, EasingType } from 'powerscript';

async function animationExamples() {
    const graphics = PowerScript.graphics;
    
    // Create a simple animated object
    const sprite = {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1
    };
    
    // Basic tween animation
    const tween = graphics.createTween(sprite);
    
    tween
        .to({ x: 200, y: 150 }, 2000) // Move to (200, 150) over 2 seconds
        .easing(EasingType.QuadOut)
        .onUpdate(() => {
            console.log(`Sprite position: (${sprite.x}, ${sprite.y})`);
            // Redraw sprite at new position
            drawSprite(sprite);
        })
        .onComplete(() => {
            console.log('Movement animation complete');
        })
        .start();
    
    // Chained animations
    setTimeout(() => {
        graphics.createTween(sprite)
            .to({ rotation: 360, scaleX: 2, scaleY: 2 }, 1500)
            .easing(EasingType.ElasticOut)
            .onUpdate(() => drawSprite(sprite))
            .start();
    }, 2000);
    
    // Fade animation
    setTimeout(() => {
        graphics.createTween(sprite)
            .to({ alpha: 0 }, 1000)
            .easing(EasingType.Linear)
            .onUpdate(() => drawSprite(sprite))
            .onComplete(() => {
                console.log('Sprite faded out');
                // Fade back in
                graphics.createTween(sprite)
                    .to({ alpha: 1 }, 1000)
                    .onUpdate(() => drawSprite(sprite))
                    .start();
            })
            .start();
    }, 4000);
}

function drawSprite(sprite: any): void {
    const graphics = PowerScript.graphics;
    const renderer = graphics.getCurrentRenderer();
    
    // Clear previous frame
    graphics.clear(0x000033);
    
    // Apply transformations
    renderer.save();
    renderer.translate(sprite.x, sprite.y);
    renderer.rotate(sprite.rotation * Math.PI / 180);
    renderer.scale(sprite.scaleX, sprite.scaleY);
    renderer.globalAlpha = sprite.alpha;
    
    // Draw sprite (simple rectangle for example)
    renderer.fillStyle = '#FF6600';
    renderer.fillRect(-25, -25, 50, 50);
    
    renderer.restore();
    
    // Render to screen
    graphics.render();
}
```

### 4.3 Advanced Animation Sequences

```powerscript
class AnimationSequence {
    private graphics: PowerScriptGraphics;
    private animations: Tween[] = [];
    private currentIndex: number = 0;
    
    constructor() {
        this.graphics = PowerScript.graphics;
    }
    
    add(target: any, properties: any, duration: number, options?: AnimationOptions): AnimationSequence {
        const tween = this.graphics.createTween(target)
            .to(properties, duration);
        
        if (options?.easing) tween.easing(options.easing);
        if (options?.delay) tween.delay(options.delay);
        if (options?.onUpdate) tween.onUpdate(options.onUpdate);
        
        this.animations.push(tween);
        return this;
    }
    
    addParallel(animations: Array<{target: any, properties: any, duration: number}>): AnimationSequence {
        // Add multiple animations that run in parallel
        animations.forEach(anim => {
            this.add(anim.target, anim.properties, anim.duration);
        });
        return this;
    }
    
    async play(): Promise<void> {
        for (let i = 0; i < this.animations.length; i++) {
            const animation = this.animations[i];
            
            await new Promise<void>((resolve) => {
                animation.onComplete(() => resolve()).start();
            });
        }
        
        console.log('Animation sequence complete');
    }
    
    playParallel(): Promise<void> {
        const promises = this.animations.map(animation => 
            new Promise<void>((resolve) => {
                animation.onComplete(() => resolve()).start();
            })
        );
        
        return Promise.all(promises).then(() => {
            console.log('Parallel animations complete');
        });
    }
    
    stop(): void {
        this.animations.forEach(animation => animation.stop());
    }
}

// Usage example
async function sequenceExample() {
    const player = { x: 50, y: 50, health: 100, score: 0 };
    const enemy = { x: 500, y: 300, health: 100 };
    
    const sequence = new AnimationSequence();
    
    // Player walks to enemy
    sequence.add(player, { x: 450 }, 2000, {
        easing: EasingType.Linear,
        onUpdate: () => drawGame(player, enemy)
    });
    
    // Combat sequence (parallel animations)
    sequence.addParallel([
        { target: player, properties: { health: 80 }, duration: 500 },
        { target: enemy, properties: { health: 60 }, duration: 500 },
        { target: player, properties: { score: 100 }, duration: 500 }
    ]);
    
    // Player returns
    sequence.add(player, { x: 50 }, 1500, {
        easing: EasingType.QuadOut,
        onUpdate: () => drawGame(player, enemy)
    });
    
    await sequence.play();
    console.log('Combat sequence finished');
}

function drawGame(player: any, enemy: any): void {
    const graphics = PowerScript.graphics;
    graphics.clear(0x003300);
    
    // Draw game objects
    // (Implementation details omitted for brevity)
    
    graphics.render();
}
```

## 5. WebGL Rendering

### 5.1 WebGL Renderer Interface

```typescript
interface WebGLRenderer extends IRenderer {
    // WebGL-specific methods
    createShader(type: 'vertex' | 'fragment', source: string): WebGLShader
    createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram
    useProgram(program: WebGLProgram): void
    
    // Texture management
    createTexture(width: number, height: number, format?: TextureFormat): WebGLTexture
    loadTexture(url: string): Promise<WebGLTexture>
    bindTexture(texture: WebGLTexture, unit?: number): void
    
    // Buffer management
    createBuffer(data: Float32Array, type: 'vertex' | 'index'): WebGLBuffer
    bindBuffer(buffer: WebGLBuffer): void
    
    // Rendering
    drawArrays(mode: DrawMode, first: number, count: number): void
    drawElements(mode: DrawMode, count: number, type: IndexType, offset: number): void
    
    // State management
    enable(capability: WebGLCapability): void
    disable(capability: WebGLCapability): void
    blendFunc(sfactor: BlendFactor, dfactor: BlendFactor): void
    
    // Viewport and scissor
    viewport(x: number, y: number, width: number, height: number): void
    scissor(x: number, y: number, width: number, height: number): void
}
```

### 5.2 WebGL Basic Setup

```powerscript
async function setupWebGL() {
    const graphics = PowerScript.graphics;
    
    // Initialize with WebGL renderer
    await graphics.initialize({
        renderer: 'webgl',
        width: 800,
        height: 600,
        antialias: true,
        alpha: false
    });
    
    const renderer = graphics.getCurrentRenderer() as WebGLRenderer;
    
    // Create vertex shader
    const vertexShaderSource = `
        attribute vec3 aVertexPosition;
        attribute vec2 aTextureCoord;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        varying vec2 vTextureCoord;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
            vTextureCoord = aTextureCoord;
        }
    `;
    
    const fragmentShaderSource = `
        precision mediump float;
        
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uAlpha;
        
        void main() {
            vec4 texColor = texture2D(uSampler, vTextureCoord);
            gl_FragColor = vec4(texColor.rgb, texColor.a * uAlpha);
        }
    `;
    
    // Create and compile shaders
    const vertexShader = renderer.createShader('vertex', vertexShaderSource);
    const fragmentShader = renderer.createShader('fragment', fragmentShaderSource);
    
    // Create shader program
    const shaderProgram = renderer.createProgram(vertexShader, fragmentShader);
    renderer.useProgram(shaderProgram);
    
    // Create a simple quad
    const vertices = new Float32Array([
        -1.0, -1.0, 0.0,  0.0, 0.0,  // Bottom left
         1.0, -1.0, 0.0,  1.0, 0.0,  // Bottom right
         1.0,  1.0, 0.0,  1.0, 1.0,  // Top right
        -1.0,  1.0, 0.0,  0.0, 1.0   // Top left
    ]);
    
    const indices = new Uint16Array([
        0, 1, 2,  0, 2, 3
    ]);
    
    // Create buffers
    const vertexBuffer = renderer.createBuffer(vertices, 'vertex');
    const indexBuffer = renderer.createBuffer(indices, 'index');
    
    // Load and bind texture
    const texture = await renderer.loadTexture('/assets/texture.png');
    renderer.bindTexture(texture, 0);
    
    console.log('WebGL setup complete');
    
    return { renderer, shaderProgram, vertexBuffer, indexBuffer, texture };
}
```

### 5.3 WebGL Rendering Loop

```powerscript
class WebGLScene {
    private graphics: PowerScriptGraphics;
    private renderer: WebGLRenderer;
    private shaderProgram: WebGLProgram;
    private objects: WebGLObject[] = [];
    private camera: Camera;
    private running: boolean = false;
    
    constructor() {
        this.graphics = PowerScript.graphics;
        this.renderer = this.graphics.getCurrentRenderer() as WebGLRenderer;
        this.camera = new Camera();
    }
    
    async initialize(): Promise<void> {
        // Set up shaders, buffers, textures, etc.
        await this.setupWebGL();
        
        // Create some test objects
        this.createTestObjects();
        
        console.log('WebGL scene initialized');
    }
    
    private async setupWebGL(): Promise<void> {
        // Shader setup (implementation details omitted)
        this.shaderProgram = await this.createShaderProgram();
        
        // Enable depth testing
        this.renderer.enable('DEPTH_TEST');
        this.renderer.enable('BLEND');
        this.renderer.blendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA');
    }
    
    private createTestObjects(): void {
        // Create a spinning cube
        const cube = new WebGLCube(this.renderer);
        cube.position = { x: 0, y: 0, z: -5 };
        cube.rotation = { x: 0, y: 0, z: 0 };
        this.objects.push(cube);
        
        // Create a textured quad
        const quad = new WebGLQuad(this.renderer);
        quad.position = { x: 2, y: 0, z: -3 };
        this.objects.push(quad);
    }
    
    start(): void {
        if (this.running) return;
        
        this.running = true;
        this.renderLoop();
        console.log('WebGL rendering started');
    }
    
    stop(): void {
        this.running = false;
        console.log('WebGL rendering stopped');
    }
    
    private renderLoop(): void {
        if (!this.running) return;
        
        // Update scene
        this.update();
        
        // Render scene
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.renderLoop());
    }
    
    private update(): void {
        const time = Date.now() * 0.001; // Convert to seconds
        
        // Update objects
        this.objects.forEach(obj => {
            if (obj instanceof WebGLCube) {
                // Rotate the cube
                obj.rotation.x = time * 0.5;
                obj.rotation.y = time * 0.3;
            }
            
            obj.update(time);
        });
        
        // Update camera
        this.camera.update();
    }
    
    private render(): void {
        // Clear the canvas
        this.graphics.clear(0x003366);
        this.renderer.clear();
        
        // Set viewport
        this.renderer.viewport(0, 0, 800, 600);
        
        // Use shader program
        this.renderer.useProgram(this.shaderProgram);
        
        // Set camera matrices
        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = this.camera.getProjectionMatrix();
        
        this.renderer.setUniformMatrix4fv('uViewMatrix', viewMatrix);
        this.renderer.setUniformMatrix4fv('uProjectionMatrix', projMatrix);
        
        // Render all objects
        this.objects.forEach(obj => {
            obj.render(this.renderer);
        });
        
        // Update stats
        const stats = this.graphics.getStats();
        if (stats.drawCalls > 0) {
            // console.log(`Draw calls: ${stats.drawCalls}, Triangles: ${stats.triangles}`);
        }
    }
    
    private async createShaderProgram(): Promise<WebGLProgram> {
        // Shader creation implementation
        // (Details omitted for brevity)
        return this.renderer.createProgram(vertexShader, fragmentShader);
    }
}

// WebGL object classes
class WebGLObject {
    public position = { x: 0, y: 0, z: 0 };
    public rotation = { x: 0, y: 0, z: 0 };
    public scale = { x: 1, y: 1, z: 1 };
    
    protected renderer: WebGLRenderer;
    protected vertexBuffer: WebGLBuffer;
    protected indexBuffer: WebGLBuffer;
    protected texture?: WebGLTexture;
    
    constructor(renderer: WebGLRenderer) {
        this.renderer = renderer;
    }
    
    update(time: number): void {
        // Override in subclasses
    }
    
    render(renderer: WebGLRenderer): void {
        // Set model matrix based on position, rotation, scale
        const modelMatrix = this.calculateModelMatrix();
        renderer.setUniformMatrix4fv('uModelMatrix', modelMatrix);
        
        // Bind buffers and texture
        renderer.bindBuffer(this.vertexBuffer);
        renderer.bindBuffer(this.indexBuffer);
        
        if (this.texture) {
            renderer.bindTexture(this.texture, 0);
        }
        
        // Draw
        renderer.drawElements('TRIANGLES', this.getIndexCount(), 'UNSIGNED_SHORT', 0);
    }
    
    protected calculateModelMatrix(): Float32Array {
        // Matrix calculation implementation
        const matrix = new Float32Array(16);
        // Implementation details omitted
        return matrix;
    }
    
    protected getIndexCount(): number {
        return 0; // Override in subclasses
    }
}

class WebGLCube extends WebGLObject {
    constructor(renderer: WebGLRenderer) {
        super(renderer);
        this.createGeometry();
    }
    
    private createGeometry(): void {
        // Create cube vertices and indices
        const vertices = new Float32Array([
            // Front face
            -1, -1,  1,  0, 0,
             1, -1,  1,  1, 0,
             1,  1,  1,  1, 1,
            -1,  1,  1,  0, 1,
            // Additional faces...
        ]);
        
        const indices = new Uint16Array([
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            // Additional faces...
        ]);
        
        this.vertexBuffer = this.renderer.createBuffer(vertices, 'vertex');
        this.indexBuffer = this.renderer.createBuffer(indices, 'index');
    }
    
    protected getIndexCount(): number {
        return 36; // 6 faces * 6 vertices per face
    }
}

class WebGLQuad extends WebGLObject {
    constructor(renderer: WebGLRenderer) {
        super(renderer);
        this.createGeometry();
    }
    
    private createGeometry(): void {
        const vertices = new Float32Array([
            -1, -1, 0,  0, 0,
             1, -1, 0,  1, 0,
             1,  1, 0,  1, 1,
            -1,  1, 0,  0, 1
        ]);
        
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        this.vertexBuffer = this.renderer.createBuffer(vertices, 'vertex');
        this.indexBuffer = this.renderer.createBuffer(indices, 'index');
    }
    
    protected getIndexCount(): number {
        return 6;
    }
}

class Camera {
    public position = { x: 0, y: 0, z: 0 };
    public rotation = { x: 0, y: 0, z: 0 };
    public fov = 45;
    public near = 0.1;
    public far = 100;
    public aspect = 800 / 600;
    
    update(): void {
        // Camera update logic
    }
    
    getViewMatrix(): Float32Array {
        // Calculate view matrix
        const matrix = new Float32Array(16);
        // Implementation details omitted
        return matrix;
    }
    
    getProjectionMatrix(): Float32Array {
        // Calculate projection matrix
        const matrix = new Float32Array(16);
        // Implementation details omitted
        return matrix;
    }
}
```

## 6. Canvas 2D Rendering

### 6.1 Canvas 2D Interface

```typescript
interface Canvas2DRenderer extends IRenderer {
    // Drawing context
    getContext(): CanvasRenderingContext2D
    
    // Basic shapes
    fillRect(x: number, y: number, width: number, height: number): void
    strokeRect(x: number, y: number, width: number, height: number): void
    clearRect(x: number, y: number, width: number, height: number): void
    
    // Paths
    beginPath(): void
    closePath(): void
    moveTo(x: number, y: number): void
    lineTo(x: number, y: number): void
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void
    
    // Styling
    fillStyle: string | CanvasGradient | CanvasPattern
    strokeStyle: string | CanvasGradient | CanvasPattern
    lineWidth: number
    lineCap: 'butt' | 'round' | 'square'
    lineJoin: 'bevel' | 'round' | 'miter'
    
    // Text
    fillText(text: string, x: number, y: number, maxWidth?: number): void
    strokeText(text: string, x: number, y: number, maxWidth?: number): void
    font: string
    textAlign: 'start' | 'end' | 'left' | 'center' | 'right'
    textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'
    
    // Images
    drawImage(image: CanvasImageSource, dx: number, dy: number): void
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
    
    // Transformations
    save(): void
    restore(): void
    translate(x: number, y: number): void
    rotate(angle: number): void
    scale(x: number, y: number): void
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void
}
```

### 6.2 Canvas 2D Examples

```powerscript
async function canvas2DExamples() {
    const graphics = PowerScript.graphics;
    
    // Initialize with Canvas 2D renderer
    await graphics.initialize({
        renderer: 'canvas2d',
        width: 800,
        height: 600
    });
    
    const renderer = graphics.getCurrentRenderer() as Canvas2DRenderer;
    const ctx = renderer.getContext();
    
    // Example 1: Basic shapes
    drawBasicShapes(renderer);
    
    // Example 2: Gradients and patterns
    drawGradients(renderer);
    
    // Example 3: Text rendering
    drawText(renderer);
    
    // Example 4: Image manipulation
    await drawImages(renderer);
    
    // Example 5: Animation
    startCanvas2DAnimation(renderer);
}

function drawBasicShapes(renderer: Canvas2DRenderer): void {
    // Clear canvas
    renderer.fillStyle = '#f0f0f0';
    renderer.fillRect(0, 0, 800, 600);
    
    // Draw filled rectangle
    renderer.fillStyle = '#ff6600';
    renderer.fillRect(50, 50, 100, 80);
    
    // Draw stroked rectangle
    renderer.strokeStyle = '#0066ff';
    renderer.lineWidth = 3;
    renderer.strokeRect(200, 50, 100, 80);
    
    // Draw circle
    renderer.beginPath();
    renderer.arc(400, 90, 40, 0, 2 * Math.PI);
    renderer.fillStyle = '#00cc66';
    renderer.fill();
    
    // Draw triangle
    renderer.beginPath();
    renderer.moveTo(550, 50);
    renderer.lineTo(600, 130);
    renderer.lineTo(500, 130);
    renderer.closePath();
    renderer.fillStyle = '#cc00cc';
    renderer.fill();
    renderer.strokeStyle = '#000000';
    renderer.lineWidth = 2;
    renderer.stroke();
}

function drawGradients(renderer: Canvas2DRenderer): void {
    const ctx = renderer.getContext();
    
    // Linear gradient
    const linearGradient = ctx.createLinearGradient(50, 200, 200, 300);
    linearGradient.addColorStop(0, '#ff0000');
    linearGradient.addColorStop(0.5, '#ffff00');
    linearGradient.addColorStop(1, '#0000ff');
    
    renderer.fillStyle = linearGradient;
    renderer.fillRect(50, 200, 150, 100);
    
    // Radial gradient
    const radialGradient = ctx.createRadialGradient(350, 250, 10, 350, 250, 60);
    radialGradient.addColorStop(0, '#ffffff');
    radialGradient.addColorStop(0.7, '#00ff00');
    radialGradient.addColorStop(1, '#000000');
    
    renderer.fillStyle = radialGradient;
    renderer.fillRect(290, 190, 120, 120);
}

function drawText(renderer: Canvas2DRenderer): void {
    // Set font properties
    renderer.font = '24px Arial';
    renderer.textAlign = 'center';
    renderer.textBaseline = 'middle';
    
    // Draw filled text
    renderer.fillStyle = '#333333';
    renderer.fillText('PowerScript Graphics', 400, 400);
    
    // Draw stroked text
    renderer.strokeStyle = '#666666';
    renderer.lineWidth = 1;
    renderer.strokeText('Canvas 2D Rendering', 400, 440);
    
    // Different font styles
    renderer.font = 'italic 18px Times';
    renderer.fillStyle = '#0066cc';
    renderer.fillText('Supports various fonts and styles', 400, 480);
}

async function drawImages(renderer: Canvas2DRenderer): Promise<void> {
    // Load image (in a real implementation, you'd load from a file)
    const imageData = await createTestImage();
    
    // Draw image at original size
    // renderer.drawImage(image, 50, 350);
    
    // Draw scaled image
    // renderer.drawImage(image, 200, 350, 100, 75);
    
    // Apply image effects
    const ctx = renderer.getContext();
    const imageDataObj = ctx.createImageData(100, 100);
    
    // Create a simple pattern
    for (let i = 0; i < imageDataObj.data.length; i += 4) {
        const x = (i / 4) % 100;
        const y = Math.floor((i / 4) / 100);
        
        imageDataObj.data[i] = (x + y) % 255;     // Red
        imageDataObj.data[i + 1] = x % 255;       // Green
        imageDataObj.data[i + 2] = y % 255;       // Blue
        imageDataObj.data[i + 3] = 255;           // Alpha
    }
    
    ctx.putImageData(imageDataObj, 500, 350);
}

function startCanvas2DAnimation(renderer: Canvas2DRenderer): void {
    let frame = 0;
    
    function animate(): void {
        frame++;
        
        // Clear animation area
        renderer.fillStyle = '#f0f0f0';
        renderer.fillRect(600, 450, 150, 150);
        
        // Animated circle
        const x = 675 + Math.cos(frame * 0.05) * 50;
        const y = 525 + Math.sin(frame * 0.05) * 50;
        
        renderer.beginPath();
        renderer.arc(x, y, 20, 0, 2 * Math.PI);
        renderer.fillStyle = `hsl(${frame % 360}, 70%, 50%)`;
        renderer.fill();
        
        // Continue animation
        if (frame < 1000) { // Run for ~16 seconds at 60fps
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

async function createTestImage(): Promise<ImageData> {
    // Create a simple test pattern
    const imageData = new ImageData(64, 64);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        const x = (i / 4) % 64;
        const y = Math.floor((i / 4) / 64);
        
        // Create a checkerboard pattern
        const checker = ((x >> 3) + (y >> 3)) % 2;
        const color = checker ? 255 : 128;
        
        imageData.data[i] = color;     // Red
        imageData.data[i + 1] = color; // Green
        imageData.data[i + 2] = color; // Blue
        imageData.data[i + 3] = 255;   // Alpha
    }
    
    return imageData;
}
```

## 7. API Reference

### 7.1 Main Graphics Class

```typescript
class PowerScriptGraphics extends EventDispatcher {
    constructor(config?: GraphicsConfig)
    
    // Initialization
    async initialize(config?: GraphicsConfig): Promise<void>
    
    // Canvas management
    createCanvas(width: number, height: number): PSCanvas
    getCanvas(): PSCanvas
    resizeCanvas(width: number, height: number): void
    
    // Renderer management
    createRenderer(type: 'canvas2d' | 'webgl'): IRenderer
    getCurrentRenderer(): IRenderer
    switchRenderer(type: 'canvas2d' | 'webgl'): void
    
    // Multimedia
    createAudioPlayer(options?: AudioPlayerOptions): AudioPlayer
    createVideoPlayer(options?: VideoPlayerOptions): VideoPlayer
    
    // Animation
    createTween(target: any): Tween
    createAnimation(target: any, properties: any, duration: number): Animation
    
    // Utilities
    getCapabilities(): string[]
    getSupportedFormats(): { audio: string[], video: string[] }
    getStats(): RenderStats
    
    // Rendering
    render(): void
    clear(color?: number): void
    
    // Lifecycle
    dispose(): void
}
```

### 7.2 Events

```typescript
// Graphics events
graphics.addEventListener('initialized', (event) => {
    console.log('Graphics system initialized');
});

graphics.addEventListener('render', (event) => {
    console.log('Frame rendered:', event.data.frameNumber);
});

graphics.addEventListener('resize', (event) => {
    console.log('Canvas resized:', event.data.width, event.data.height);
});

// Audio events
audioPlayer.addEventListener('loadstart', () => {});
audioPlayer.addEventListener('canplay', () => {});
audioPlayer.addEventListener('play', () => {});
audioPlayer.addEventListener('pause', () => {});
audioPlayer.addEventListener('ended', () => {});
audioPlayer.addEventListener('error', (error) => {});

// Video events
videoPlayer.addEventListener('loadedmetadata', () => {});
videoPlayer.addEventListener('canplay', () => {});
videoPlayer.addEventListener('timeupdate', () => {});
videoPlayer.addEventListener('ended', () => {});

// Animation events
tween.addEventListener('start', () => {});
tween.addEventListener('update', (progress) => {});
tween.addEventListener('complete', () => {});
```

## 8. Examples

### 8.1 Complete Graphics Application

```powerscript
import { PowerScript, EasingType } from 'powerscript';

class GraphicsApplication {
    private graphics: PowerScriptGraphics;
    private renderer: IRenderer;
    private scene: Scene;
    private running: boolean = false;
    
    constructor() {
        this.graphics = PowerScript.graphics;
        this.scene = new Scene();
    }
    
    async initialize(): Promise<void> {
        console.log('Initializing graphics application...');
        
        // Initialize graphics system
        await this.graphics.initialize({
            renderer: 'webgl',
            width: 1024,
            height: 768,
            antialias: true,
            alpha: true
        });
        
        this.renderer = this.graphics.getCurrentRenderer();
        
        // Set up scene
        await this.setupScene();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Graphics application initialized');
    }
    
    private async setupScene(): Promise<void> {
        // Create animated background
        const background = new AnimatedBackground();
        this.scene.add(background);
        
        // Create spinning logo
        const logo = new SpinningLogo();
        logo.position = { x: 0, y: 0, z: -2 };
        this.scene.add(logo);
        
        // Create particle system
        const particles = new ParticleSystem(100);
        this.scene.add(particles);
        
        // Create UI elements
        const ui = new UIOverlay();
        this.scene.add(ui);
    }
    
    private setupEventListeners(): void {
        this.graphics.addEventListener('render', (event) => {
            this.updateStats(event.data);
        });
        
        // Handle canvas resize
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            this.graphics.resizeCanvas(newWidth, newHeight);
        });
    }
    
    start(): void {
        if (this.running) return;
        
        this.running = true;
        this.gameLoop();
        console.log('Graphics application started');
    }
    
    stop(): void {
        this.running = false;
        console.log('Graphics application stopped');
    }
    
    private gameLoop(): void {
        if (!this.running) return;
        
        // Update scene
        this.scene.update(Date.now());
        
        // Render scene
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    private render(): void {
        // Clear canvas
        this.graphics.clear(0x001122);
        
        // Render scene
        this.scene.render(this.renderer);
        
        // Present frame
        this.graphics.render();
    }
    
    private updateStats(renderData: any): void {
        const stats = this.graphics.getStats();
        
        // Update performance display
        document.getElementById('fps').textContent = stats.frameRate.toFixed(1);
        document.getElementById('drawCalls').textContent = stats.drawCalls.toString();
        document.getElementById('triangles').textContent = stats.triangles.toString();
    }
}

class Scene {
    private objects: SceneObject[] = [];
    
    add(object: SceneObject): void {
        this.objects.push(object);
    }
    
    remove(object: SceneObject): void {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }
    
    update(time: number): void {
        this.objects.forEach(obj => obj.update(time));
    }
    
    render(renderer: IRenderer): void {
        this.objects.forEach(obj => obj.render(renderer));
    }
}

abstract class SceneObject {
    public position = { x: 0, y: 0, z: 0 };
    public rotation = { x: 0, y: 0, z: 0 };
    public scale = { x: 1, y: 1, z: 1 };
    public visible = true;
    
    abstract update(time: number): void;
    abstract render(renderer: IRenderer): void;
}

class AnimatedBackground extends SceneObject {
    private colors: number[] = [0x001122, 0x112233, 0x223344];
    private colorIndex = 0;
    private lastColorChange = 0;
    
    update(time: number): void {
        // Change background color every 5 seconds
        if (time - this.lastColorChange > 5000) {
            this.colorIndex = (this.colorIndex + 1) % this.colors.length;
            this.lastColorChange = time;
        }
    }
    
    render(renderer: IRenderer): void {
        // Background is rendered by the clear operation
        // This method could draw additional background elements
    }
}

class SpinningLogo extends SceneObject {
    private startTime: number = Date.now();
    
    update(time: number): void {
        const elapsed = (time - this.startTime) * 0.001;
        this.rotation.y = elapsed * 0.5; // Rotate 0.5 radians per second
    }
    
    render(renderer: IRenderer): void {
        if (!this.visible) return;
        
        // Render logo (implementation depends on renderer type)
        if (renderer instanceof WebGLRenderer) {
            this.renderWebGL(renderer);
        } else if (renderer instanceof Canvas2DRenderer) {
            this.renderCanvas2D(renderer);
        }
    }
    
    private renderWebGL(renderer: WebGLRenderer): void {
        // WebGL logo rendering
        renderer.save();
        renderer.translate(this.position.x, this.position.y, this.position.z);
        renderer.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
        renderer.scale(this.scale.x, this.scale.y, this.scale.z);
        
        // Draw logo geometry
        // (Implementation details omitted)
        
        renderer.restore();
    }
    
    private renderCanvas2D(renderer: Canvas2DRenderer): void {
        // Canvas 2D logo rendering
        renderer.save();
        renderer.translate(this.position.x + 512, this.position.y + 384);
        renderer.rotate(this.rotation.y);
        renderer.scale(this.scale.x, this.scale.y);
        
        // Draw logo
        renderer.fillStyle = '#ff6600';
        renderer.fillRect(-50, -25, 100, 50);
        
        renderer.fillStyle = '#ffffff';
        renderer.font = '16px Arial';
        renderer.textAlign = 'center';
        renderer.fillText('PowerScript', 0, 5);
        
        renderer.restore();
    }
}

class ParticleSystem extends SceneObject {
    private particles: Particle[] = [];
    private maxParticles: number;
    
    constructor(maxParticles: number) {
        super();
        this.maxParticles = maxParticles;
        this.initializeParticles();
    }
    
    private initializeParticles(): void {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle());
        }
    }
    
    update(time: number): void {
        this.particles.forEach(particle => particle.update(time));
    }
    
    render(renderer: IRenderer): void {
        if (!this.visible) return;
        
        this.particles.forEach(particle => {
            if (particle.visible) {
                particle.render(renderer);
            }
        });
    }
}

class Particle {
    public position = { x: 0, y: 0, z: 0 };
    public velocity = { x: 0, y: 0, z: 0 };
    public life = 1.0;
    public maxLife = 1.0;
    public size = 1.0;
    public color = { r: 1, g: 1, b: 1, a: 1 };
    public visible = true;
    
    constructor() {
        this.reset();
    }
    
    reset(): void {
        // Random initial position
        this.position.x = (Math.random() - 0.5) * 10;
        this.position.y = (Math.random() - 0.5) * 10;
        this.position.z = (Math.random() - 0.5) * 10;
        
        // Random velocity
        this.velocity.x = (Math.random() - 0.5) * 0.1;
        this.velocity.y = (Math.random() - 0.5) * 0.1;
        this.velocity.z = (Math.random() - 0.5) * 0.1;
        
        // Random life and size
        this.maxLife = this.life = Math.random() * 3 + 2;
        this.size = Math.random() * 0.1 + 0.05;
        
        // Random color
        this.color.r = Math.random();
        this.color.g = Math.random();
        this.color.b = Math.random();
        this.color.a = 1;
        
        this.visible = true;
    }
    
    update(time: number): void {
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        
        // Update life
        this.life -= 0.016; // Assuming 60 FPS
        
        // Fade out
        this.color.a = this.life / this.maxLife;
        
        // Reset when dead
        if (this.life <= 0) {
            this.reset();
        }
    }
    
    render(renderer: IRenderer): void {
        // Render particle (implementation depends on renderer)
        // (Details omitted for brevity)
    }
}

class UIOverlay extends SceneObject {
    update(time: number): void {
        // UI updates
    }
    
    render(renderer: IRenderer): void {
        if (!this.visible) return;
        
        // Render UI elements
        if (renderer instanceof Canvas2DRenderer) {
            this.renderUI(renderer);
        }
    }
    
    private renderUI(renderer: Canvas2DRenderer): void {
        // Draw FPS counter
        renderer.fillStyle = '#ffffff';
        renderer.font = '14px monospace';
        renderer.textAlign = 'left';
        renderer.fillText(`FPS: ${PowerScript.graphics.getStats().frameRate.toFixed(1)}`, 10, 20);
        
        // Draw performance info
        const stats = PowerScript.graphics.getStats();
        renderer.fillText(`Draw Calls: ${stats.drawCalls}`, 10, 40);
        renderer.fillText(`Triangles: ${stats.triangles}`, 10, 60);
    }
}

// Usage
async function runGraphicsApplication() {
    const app = new GraphicsApplication();
    await app.initialize();
    app.start();
    
    // Stop after 30 seconds for demonstration
    setTimeout(() => {
        app.stop();
    }, 30000);
}
```

## Performance Considerations

### Graphics Performance

1. **Batch Rendering**: Group similar draw calls to reduce state changes
2. **Texture Atlasing**: Combine multiple textures into single atlas
3. **Level of Detail**: Use different models for different distances
4. **Frustum Culling**: Don't render objects outside the camera view
5. **Occlusion Culling**: Don't render hidden objects

### Memory Management

- Dispose of graphics resources when no longer needed
- Reuse objects and buffers when possible
- Monitor texture memory usage
- Use appropriate texture formats and sizes

### Browser Compatibility

- Feature detection for WebGL capabilities
- Fallback to Canvas 2D for older browsers
- Handle context loss and restoration
- Test across different devices and browsers

## See Also

- [PowerScript Core Documentation](core.md)
- [Animation System Documentation](animation.md)
- [Multimedia Processing Documentation](multimedia.md)
- [Complete API Reference](api-reference.md)

---

*PowerScript Graphics & Multimedia Module - Version 1.0.0*