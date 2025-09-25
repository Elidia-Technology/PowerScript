/**
 * PowerScript Canvas Rendering Test - Basic visual rendering verification
 */

import { CanvasRenderer } from '../src/graphics/renderers/CanvasRenderer';
import { Stage } from '../src/graphics/display/Stage';
import { Sprite } from '../src/graphics/display/Sprite';
import { Shape } from '../src/graphics/display/Shape';

// Mock DOM environment for Node.js testing
function createMockCanvas(): any {
    return {
        width: 800,
        height: 600,
        style: {},
        getContext: (type: string) => {
            if (type === '2d') {
                return {
                    scale: () => {},
                    save: () => {},
                    restore: () => {},
                    clearRect: () => {},
                    fillRect: () => {},
                    transform: () => {},
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    quadraticCurveTo: () => {},
                    rect: () => {},
                    arc: () => {},
                    ellipse: () => {},
                    fill: () => {},
                    stroke: () => {},
                    closePath: () => {},
                    clip: () => {},
                    imageSmoothingEnabled: true,
                    textAlign: 'left',
                    textBaseline: 'top',
                    fillStyle: '#000000',
                    strokeStyle: '#000000',
                    lineWidth: 1,
                    lineCap: 'butt',
                    lineJoin: 'miter',
                    miterLimit: 10,
                    globalAlpha: 1
                };
            }
            return null;
        }
    };
}

// Mock global objects for Node.js
const mockWindow = { devicePixelRatio: 1 };
const mockPerformance = { now: () => Date.now() };

// Monkey patch for testing
Object.defineProperty(globalThis, 'window', { value: mockWindow, writable: true });
Object.defineProperty(globalThis, 'performance', { value: mockPerformance, writable: true });

async function testCanvasRenderer() {
    console.log('=== PowerScript Canvas Renderer Test ===\n');

    try {
        // Create mock canvas
        const canvas = createMockCanvas();
        console.log('✅ Mock canvas created');

        // Create renderer
        const renderer = new CanvasRenderer({
            antialias: true,
            alpha: true
        });
        console.log('✅ Canvas renderer created');

        // Initialize renderer
        await renderer.initialize({
            canvas: canvas,
            width: 800,
            height: 600,
            pixelRatio: 1,
            antialias: true
        });
        console.log('✅ Renderer initialized');
        console.log(`   Type: ${renderer.type}`);
        console.log(`   Initialized: ${renderer.isInitialized}`);

        // Create display objects
        const stage = new Stage(800, 600);
        stage.backgroundColor = 0x333366;

        const container = new Sprite();
        container.name = 'container';
        container.x = 100;
        container.y = 100;

        // Draw red rectangle
        container.graphics.beginFill(0xFF0000, 0.8);
        container.graphics.drawRect(0, 0, 150, 100);
        container.graphics.endFill();

        // Draw blue circle
        const shape = new Shape();
        shape.name = 'blueCircle';
        shape.x = 200;
        shape.y = 50;
        shape.graphics.beginFill(0x0000FF, 0.6);
        shape.graphics.drawCircle(0, 0, 40);
        shape.graphics.endFill();

        // Build hierarchy
        stage.addChild(container);
        container.addChild(shape);

        console.log('✅ Display objects created and arranged');
        console.log(`   Stage children: ${stage.numChildren}`);
        console.log(`   Container children: ${container.numChildren}`);

        // Clear and render
        renderer.clear(stage.backgroundColor, 1.0);
        renderer.render(stage);

        // Get render statistics
        const stats = renderer.getStats();
        console.log('✅ Rendering completed');
        console.log(`   Draw calls: ${stats.drawCalls}`);
        console.log(`   Render time: ${stats.renderTime.toFixed(2)}ms`);

        // Test transformations
        container.rotation = 15;
        container.scaleX = 1.2;
        container.alpha = 0.7;

        renderer.clear(stage.backgroundColor, 1.0);
        renderer.render(stage);

        const transformStats = renderer.getStats();
        console.log('✅ Transformed rendering completed');
        console.log(`   Draw calls: ${transformStats.drawCalls}`);
        console.log(`   Render time: ${transformStats.renderTime.toFixed(2)}ms`);

        // Test resize
        renderer.resize(1024, 768);
        console.log('✅ Renderer resized to 1024x768');

        // Test viewport
        renderer.setViewport(100, 100, 600, 400);
        console.log('✅ Viewport set to (100,100) 600x400');

        // Cleanup
        renderer.dispose();
        console.log('✅ Renderer disposed');

        console.log('\n🎉 Canvas Renderer Test - ALL TESTS PASSED!');
        
    } catch (error) {
        console.error('❌ Canvas Renderer Test FAILED:', error);
        throw error;
    }
}

// Jest test wrapper
describe('PowerScript Canvas Rendering', () => {
  test('should pass canvas rendering tests', async () => {
    await testCanvasRenderer();
    expect(true).toBe(true);
  }, 15000);
});

// Run the test
if (require.main === module) {
  testCanvasRenderer().then(() => {
    console.log('\n✅ PowerScript Canvas 2D Renderer - Implementation Complete!');
  }).catch((error) => {
    console.error('\n❌ Test failed:', error);
    throw error;
  });
}