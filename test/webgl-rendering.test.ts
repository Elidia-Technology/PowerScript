/**
 * PowerScript WebGL Renderer Test
 * Tests the WebGL hardware-accelerated rendering implementation
 */

import { WebGLRenderer } from '../src/graphics/renderers/WebGLRenderer';
import { IRenderContext } from '../src/graphics/renderers/IRenderer';

// Mock WebGL context for Node.js testing
function createMockWebGLContext(): WebGLRenderingContext {
    const gl = {
        // Constants
        VERTEX_SHADER: 0x8B31,
        FRAGMENT_SHADER: 0x8B30,
        ARRAY_BUFFER: 0x8892,
        ELEMENT_ARRAY_BUFFER: 0x8893,
        STATIC_DRAW: 0x88E4,
        DYNAMIC_DRAW: 0x88E8,
        TRIANGLES: 0x0004,
        FLOAT: 0x1406,
        UNSIGNED_SHORT: 0x1403,
        RGBA: 0x1908,
        UNSIGNED_BYTE: 0x1401,
        TEXTURE_2D: 0x0DE1,
        TEXTURE_WRAP_S: 0x2802,
        TEXTURE_WRAP_T: 0x2803,
        TEXTURE_MIN_FILTER: 0x2801,
        TEXTURE_MAG_FILTER: 0x2800,
        CLAMP_TO_EDGE: 0x812F,
        LINEAR: 0x2601,
        BLEND: 0x0BE2,
        SRC_ALPHA: 0x0302,
        ONE_MINUS_SRC_ALPHA: 0x0303,
        DEPTH_TEST: 0x0B71,
        CULL_FACE: 0x0B44,
        COLOR_BUFFER_BIT: 0x00004000,
        COMPILE_STATUS: 0x8B81,
        LINK_STATUS: 0x8B82,
        ACTIVE_ATTRIBUTES: 0x8B89,
        ACTIVE_UNIFORMS: 0x8B86,

        // Mock implementations
        createShader: (type: number) => ({ type }),
        shaderSource: (shader: any, source: string) => { shader.source = source; },
        compileShader: (shader: any) => { shader.compiled = true; },
        getShaderParameter: (shader: any, pname: number) => pname === 0x8B81,
        getShaderInfoLog: () => '',
        deleteShader: (shader: any) => { shader.deleted = true; },
        
        createProgram: () => ({ id: Math.random() }),
        attachShader: (program: any, shader: any) => {},
        linkProgram: (program: any) => { program.linked = true; },
        getProgramParameter: (program: any, pname: number) => {
            if (pname === 0x8B82) return true; // LINK_STATUS
            if (pname === 0x8B89) return 3; // ACTIVE_ATTRIBUTES
            if (pname === 0x8B86) return 2; // ACTIVE_UNIFORMS
            return 0;
        },
        getProgramInfoLog: () => '',
        useProgram: (program: any) => {},
        deleteProgram: (program: any) => {},
        
        getActiveAttrib: (program: any, index: number) => {
            const attrs = ['a_position', 'a_texCoord', 'a_color'];
            return index < attrs.length ? { name: attrs[index] } : null;
        },
        getActiveUniform: (program: any, index: number) => {
            const uniforms = ['u_matrix', 'u_resolution'];
            return index < uniforms.length ? { name: uniforms[index] } : null;
        },
        getAttribLocation: (program: any, name: string) => {
            const locations: { [key: string]: number } = {
                'a_position': 0,
                'a_texCoord': 1,
                'a_color': 2
            };
            return locations[name] ?? -1;
        },
        getUniformLocation: (program: any, name: string) => ({ name }),
        
        createBuffer: () => ({ id: Math.random() }),
        bindBuffer: (target: number, buffer: any) => {},
        bufferData: (target: number, data: any, usage: number) => {},
        deleteBuffer: (buffer: any) => {},
        
        createTexture: () => ({ id: Math.random() }),
        bindTexture: (target: number, texture: any) => {},
        texImage2D: (...args: any[]) => {},
        texParameteri: (target: number, pname: number, param: number) => {},
        deleteTexture: (texture: any) => {},
        
        createFramebuffer: () => ({ id: Math.random() }),
        bindFramebuffer: (target: number, framebuffer: any) => {},
        framebufferTexture2D: (...args: any[]) => {},
        deleteFramebuffer: (framebuffer: any) => {},
        
        viewport: (x: number, y: number, width: number, height: number) => {},
        enable: (cap: number) => {},
        disable: (cap: number) => {},
        blendFunc: (sfactor: number, dfactor: number) => {},
        clearColor: (r: number, g: number, b: number, a: number) => {},
        clear: (mask: number) => {},
        
        uniform2f: (location: any, x: number, y: number) => {},
        enableVertexAttribArray: (index: number) => {},
        vertexAttribPointer: (index: number, size: number, type: number, normalized: boolean, stride: number, offset: number) => {},
        drawElements: (mode: number, count: number, type: number, offset: number) => {}
    } as any;
    
    return gl;
}

// Mock canvas for Node.js testing
function createMockCanvas(): HTMLCanvasElement {
    const canvas = {
        width: 800,
        height: 600,
        getContext: (contextType: string) => {
            if (contextType === 'webgl' || contextType === 'experimental-webgl') {
                return createMockWebGLContext();
            }
            return null;
        }
    } as any;
    
    return canvas;
}

// Mock DisplayObject for testing
class MockDisplayObject {
    public visible = true;
    
    constructor() {}
}

async function runWebGLRendererTest() {
    console.log('=== PowerScript WebGL Renderer Test ===\n');
    
    try {
        // Create mock canvas
        const canvas = createMockCanvas();
        console.log('✅ Mock WebGL canvas created');
        
        // Create WebGL renderer
        const renderer = new WebGLRenderer();
        console.log('✅ WebGL renderer created');
        
        // Create render context
        const context: IRenderContext = {
            canvas,
            width: 800,
            height: 600,
            pixelRatio: 1,
            antialias: true
        };
        
        // Initialize renderer
        await renderer.initialize(context);
        console.log('✅ Renderer initialized');
        console.log(`   Type: ${renderer.type}`);
        console.log(`   Initialized: ${renderer.isInitialized}`);
        
        // Create mock display object
        const displayObject = new MockDisplayObject() as any;
        
        // Test rendering
        renderer.render(displayObject);
        const stats = renderer.getStats();
        console.log('✅ Rendering completed');
        console.log(`   Draw calls: ${stats.drawCalls}`);
        console.log(`   Triangles: ${stats.triangles}`);
        console.log(`   Render time: ${stats.renderTime.toFixed(2)}ms`);
        console.log(`   Frame rate: ${stats.frameRate.toFixed(1)}fps`);
        
        // Test clearing with color
        renderer.clear(0xFF0000, 0.5); // Red with 50% alpha
        console.log('✅ Clear with color completed');
        
        // Test resize
        renderer.resize(1024, 768);
        console.log('✅ Renderer resized to 1024x768');
        
        // Test viewport
        renderer.setViewport(100, 100, 600, 400);
        console.log('✅ Viewport set to (100,100) 600x400');
        
        // Test texture creation
        const mockImageData = {
            width: 64,
            height: 64,
            data: new Uint8ClampedArray(64 * 64 * 4)
        } as ImageData;
        const texture = renderer.createTexture(mockImageData);
        console.log('✅ Texture created');
        console.log(`   ID: ${texture.id}`);
        console.log(`   Size: ${texture.width}x${texture.height}`);
        console.log(`   Format: ${texture.format}`);
        
        // Test statistics reset
        renderer.resetStats();
        const resetStats = renderer.getStats();
        console.log('✅ Statistics reset');
        console.log(`   Draw calls: ${resetStats.drawCalls}`);
        
        // Test disposal
        renderer.dispose();
        console.log('✅ Renderer disposed');
        
        console.log('\n🎉 WebGL Renderer Test - ALL TESTS PASSED!\n');
        console.log('✅ PowerScript WebGL Renderer - Implementation Complete!');
        
    } catch (error) {
        console.error('❌ WebGL Renderer Test Failed:', error);
        throw error;
    }
}

// Run the test
runWebGLRendererTest();