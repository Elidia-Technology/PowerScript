/**
 * Comprehensive EIPS Client Framework Test Suite
 * Tests all module functionalities according to their actual usage
 */

import { EIPS, CanvasManager, MediaManager, GameManager, createSprite, createShape, createStage } from '../src/client/index';

describe('EIPS Client Framework - Comprehensive Tests', () => {
  
  describe('CanvasManager', () => {
    test('should create and manage canvas', () => {
      const manager = new CanvasManager();
      expect(manager).toBeDefined();
      expect(manager.getCanvas()).toBeNull();
      expect(manager.getContext()).toBeNull();
    });

    test('should handle canvas operations', () => {
      const manager = new CanvasManager();
      
      // Test resize (without actual canvas)
      expect(() => manager.resize(800, 600)).not.toThrow();
      
      // Test clear (without actual canvas)
      expect(() => manager.clear()).not.toThrow();
      
      // Test pixel ratio (without actual canvas)
      expect(() => manager.setPixelRatio(2)).not.toThrow();
    });
  });

  describe('MediaManager', () => {
    test('should create media manager with default settings', () => {
      const manager = new MediaManager();
      expect(manager).toBeDefined();
      expect(manager.getMasterVolume()).toBe(1.0);
    });

    test('should manage master volume', () => {
      const manager = new MediaManager();
      
      manager.setMasterVolume(0.5);
      expect(manager.getMasterVolume()).toBe(0.5);
      
      // Test volume bounds
      manager.setMasterVolume(2.0);
      expect(manager.getMasterVolume()).toBe(1.0);
      
      manager.setMasterVolume(-0.5);
      expect(manager.getMasterVolume()).toBe(0.0);
    });

    test('should create audio player with expected interface', () => {
      const manager = new MediaManager();
      const audioPlayer = manager.createAudioPlayer('test.mp3');
      
      expect(audioPlayer).toBeDefined();
      expect(audioPlayer.element).toBeDefined();
      expect(typeof audioPlayer.play).toBe('function');
      expect(typeof audioPlayer.pause).toBe('function');
      expect(typeof audioPlayer.stop).toBe('function');
      expect(typeof audioPlayer.setVolume).toBe('function');
      expect(typeof audioPlayer.getCurrentTime).toBe('function');
      expect(typeof audioPlayer.getDuration).toBe('function');
      expect(typeof audioPlayer.setCurrentTime).toBe('function');
      expect(typeof audioPlayer.addEventListener).toBe('function');
      expect(typeof audioPlayer.removeEventListener).toBe('function');
    });

    test('should create video player with expected interface', () => {
      const manager = new MediaManager();
      const videoPlayer = manager.createVideoPlayer('test.mp4');
      
      expect(videoPlayer).toBeDefined();
      expect(videoPlayer.element).toBeDefined();
      expect(typeof videoPlayer.play).toBe('function');
      expect(typeof videoPlayer.pause).toBe('function');
      expect(typeof videoPlayer.stop).toBe('function');
      expect(typeof videoPlayer.setVolume).toBe('function');
      expect(typeof videoPlayer.getCurrentTime).toBe('function');
      expect(typeof videoPlayer.getDuration).toBe('function');
      expect(typeof videoPlayer.setCurrentTime).toBe('function');
      expect(typeof videoPlayer.setSize).toBe('function');
      expect(typeof videoPlayer.addEventListener).toBe('function');
      expect(typeof videoPlayer.removeEventListener).toBe('function');
    });
  });

  describe('GameManager', () => {
    test('should create game manager with default state', () => {
      const manager = new GameManager();
      expect(manager).toBeDefined();
      expect(manager.isRunning()).toBe(false);
      expect(manager.isPaused()).toBe(false);
      expect(manager.getDeltaTime()).toBe(0);
    });

    test('should manage game state', () => {
      const manager = new GameManager();
      
      // Test start
      manager.start();
      expect(manager.isRunning()).toBe(true);
      expect(manager.isPaused()).toBe(false);
      
      // Test pause
      manager.pause();
      expect(manager.isPaused()).toBe(true);
      
      // Test resume
      manager.resume();
      expect(manager.isPaused()).toBe(false);
      
      // Test stop
      manager.stop();
      expect(manager.isRunning()).toBe(false);
      expect(manager.isPaused()).toBe(false);
    });

    test('should handle input state', () => {
      const manager = new GameManager();
      
      const keyboard = manager.getKeyboard();
      expect(keyboard).toBeDefined();
      expect(typeof keyboard).toBe('object');
      
      const mouse = manager.getMouse();
      expect(mouse).toBeDefined();
      expect(mouse.x).toBeDefined();
      expect(mouse.y).toBeDefined();
      expect(mouse.buttons).toBeDefined();
      
      // Test input checking methods
      expect(typeof manager.isKeyPressed('Space')).toBe('boolean');
      expect(typeof manager.isMouseButtonPressed(0)).toBe('boolean');
    });

    test('should handle callbacks', () => {
      const manager = new GameManager();
      
      let updateCalled = false;
      let renderCalled = false;
      
      manager.onUpdate((deltaTime) => {
        updateCalled = true;
        expect(typeof deltaTime).toBe('number');
      });
      
      manager.onRender((ctx) => {
        renderCalled = true;
      });
      
      // Callbacks should be registered
      expect(() => manager.onUpdate(() => {})).not.toThrow();
      expect(() => manager.onRender(() => {})).not.toThrow();
    });

    test('should handle frame rate', () => {
      const manager = new GameManager();
      
      manager.setFrameRate(30);
      // Should not throw - frame rate set
      expect(() => manager.setFrameRate(60)).not.toThrow();
    });
  });

  describe('AS3-Style Display Objects', () => {
    test('should create sprite with AS3 API', async () => {
      const sprite = await createSprite();
      
      expect(sprite).toBeDefined();
      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);
      expect(sprite.width).toBe(0);
      expect(sprite.height).toBe(0);
      expect(sprite.scaleX).toBe(1);
      expect(sprite.scaleY).toBe(1);
      expect(sprite.rotation).toBe(0);
      expect(sprite.alpha).toBe(1);
      expect(sprite.visible).toBe(true);
      expect(sprite.name).toBe('');
      expect(sprite.parent).toBeNull();
      expect(sprite.graphics).toBeDefined();
    });

    test('should support sprite graphics API', async () => {
      const sprite = await createSprite();
      const graphics = sprite.graphics;
      
      expect(graphics).toBeDefined();
      expect(typeof graphics.beginFill).toBe('function');
      expect(typeof graphics.endFill).toBe('function');
      expect(typeof graphics.lineStyle).toBe('function');
      expect(typeof graphics.drawRect).toBe('function');
      expect(typeof graphics.drawCircle).toBe('function');
      expect(typeof graphics.moveTo).toBe('function');
      expect(typeof graphics.lineTo).toBe('function');
      expect(typeof graphics.clear).toBe('function');
      
      // Test method chaining
      const result = graphics
        .beginFill(0xFF0000, 0.5)
        .drawRect(10, 10, 50, 30)
        .endFill();
      
      expect(result).toBe(graphics);
      expect(graphics.commands.length).toBeGreaterThan(0);
    });

    test('should support sprite transform operations', async () => {
      const sprite = await createSprite();
      
      // Test transform properties
      sprite.x = 100;
      sprite.y = 50;
      sprite.scaleX = 2;
      sprite.scaleY = 1.5;
      sprite.rotation = Math.PI / 4;
      sprite.alpha = 0.8;
      sprite.visible = false;
      
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(50);
      expect(sprite.scaleX).toBe(2);
      expect(sprite.scaleY).toBe(1.5);
      expect(sprite.rotation).toBe(Math.PI / 4);
      expect(sprite.alpha).toBe(0.8);
      expect(sprite.visible).toBe(false);
    });

    test('should support sprite utility methods', async () => {
      const sprite = await createSprite();
      
      // Test bounds
      const bounds = sprite.getBounds();
      expect(bounds).toBeDefined();
      expect(bounds.x).toBeDefined();
      expect(bounds.y).toBeDefined();
      expect(bounds.width).toBeDefined();
      expect(bounds.height).toBeDefined();
      
      // Test hit testing
      expect(typeof sprite.hitTestPoint(0, 0)).toBe('boolean');
      
      // Test coordinate conversion
      const localPoint = { x: 10, y: 10 };
      const globalPoint = sprite.localToGlobal(localPoint);
      expect(globalPoint.x).toBeDefined();
      expect(globalPoint.y).toBeDefined();
      
      const backToLocal = sprite.globalToLocal(globalPoint);
      expect(backToLocal.x).toBe(localPoint.x);
      expect(backToLocal.y).toBe(localPoint.y);
    });

    test('should support sprite rendering', async () => {
      const sprite = await createSprite();
      
      // Test render function exists
      expect(typeof sprite.render).toBe('function');
      
      // Test render with mock context
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        beginPath: jest.fn(),
        rect: jest.fn(),
        arc: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clearRect: jest.fn()
      };
      
      // Should not throw with mock context
      expect(() => sprite.render(mockContext as any)).not.toThrow();
    });

    test('should create shape with AS3 API', async () => {
      const shape = await createShape();
      
      expect(shape).toBeDefined();
      // Shape should have same interface as Sprite in our implementation
      expect(shape.graphics).toBeDefined();
      expect(typeof shape.render).toBe('function');
    });

    test('should create stage with AS3 API', async () => {
      const stage = await createStage();
      
      expect(stage).toBeDefined();
      expect(stage.width).toBe(800);
      expect(stage.height).toBe(600);
      expect(stage.children).toBeDefined();
      expect(stage.numChildren).toBe(0);
      expect(typeof stage.addChild).toBe('function');
      expect(typeof stage.removeChild).toBe('function');
      expect(typeof stage.render).toBe('function');
    });

    test('should support stage display list operations', async () => {
      const stage = await createStage();
      const sprite1 = await createSprite();
      const sprite2 = await createSprite();
      
      // Test addChild
      stage.addChild(sprite1);
      expect(stage.numChildren).toBe(1);
      expect(sprite1.parent).toBe(stage);
      
      // Test addChildAt
      stage.addChildAt(sprite2, 0);
      expect(stage.numChildren).toBe(2);
      expect(stage.getChildAt(0)).toBe(sprite2);
      expect(stage.getChildAt(1)).toBe(sprite1);
      
      // Test removeChild
      stage.removeChild(sprite1);
      expect(stage.numChildren).toBe(1);
      expect(sprite1.parent).toBeNull();
      
      // Test removeChildAt
      const removed = stage.removeChildAt(0);
      expect(removed).toBe(sprite2);
      expect(stage.numChildren).toBe(0);
      
      // Test contains
      stage.addChild(sprite1);
      expect(stage.contains(sprite1)).toBe(true);
      expect(stage.contains(sprite2)).toBe(false);
    });

    test('should support stage utility methods', async () => {
      const stage = await createStage();
      const sprite1 = await createSprite();
      const sprite2 = await createSprite();
      
      sprite1.name = 'player';
      sprite2.name = 'enemy';
      
      stage.addChild(sprite1);
      stage.addChild(sprite2);
      
      // Test getChildByName
      expect(stage.getChildByName('player')).toBe(sprite1);
      expect(stage.getChildByName('enemy')).toBe(sprite2);
      expect(stage.getChildByName('nonexistent')).toBeNull();
      
      // Test swapChildren
      stage.swapChildren(sprite1, sprite2);
      expect(stage.getChildAt(0)).toBe(sprite2);
      expect(stage.getChildAt(1)).toBe(sprite1);
      
      // Test swapChildrenAt
      stage.swapChildrenAt(0, 1);
      expect(stage.getChildAt(0)).toBe(sprite1);
      expect(stage.getChildAt(1)).toBe(sprite2);
    });

    test('should support stage events and rendering', async () => {
      const stage = await createStage();
      
      // Test event methods
      expect(typeof stage.addEventListener).toBe('function');
      expect(typeof stage.removeEventListener).toBe('function');
      expect(typeof stage.dispatchEvent).toBe('function');
      
      // Test rendering methods
      expect(typeof stage.render).toBe('function');
      expect(typeof stage.update).toBe('function');
      expect(typeof stage.invalidate).toBe('function');
      
      // Test coordinate methods
      const point = { x: 100, y: 50 };
      const global = stage.localToGlobal(point);
      const local = stage.globalToLocal(point);
      
      // Stage is global coordinate system
      expect(global.x).toBe(point.x);
      expect(global.y).toBe(point.y);
      expect(local.x).toBe(point.x);
      expect(local.y).toBe(point.y);
    });
  });

  describe('EIPS Framework Integration', () => {
    test('should provide unified EIPS object', () => {
      expect(EIPS).toBeDefined();
      expect(EIPS.CanvasManager).toBe(CanvasManager);
      expect(EIPS.MediaManager).toBe(MediaManager);
      expect(EIPS.GameManager).toBe(GameManager);
      expect(EIPS.createSprite).toBe(createSprite);
      expect(EIPS.createShape).toBe(createShape);
      expect(EIPS.createStage).toBe(createStage);
      expect(EIPS.version).toBe('1.0.0');
      expect(EIPS.name).toBe('EIPS Client Framework');
    });

    test('should provide EIPS init helper', () => {
      expect(typeof EIPS.init).toBe('function');
      
      const eipsInstance = EIPS.init();
      expect(eipsInstance).toBeDefined();
      expect(eipsInstance.canvas).toBeInstanceOf(CanvasManager);
      expect(eipsInstance.media).toBeInstanceOf(MediaManager);
      expect(eipsInstance.game).toBeInstanceOf(GameManager);
    });

    test('should support framework integration patterns', () => {
      // Test that all necessary exports are available for framework integration
      expect(CanvasManager).toBeDefined();
      expect(MediaManager).toBeDefined();
      expect(GameManager).toBeDefined();
      expect(createSprite).toBeDefined();
      expect(createShape).toBeDefined();
      expect(createStage).toBeDefined();
      
      // Test that the main EIPS object can be used as a namespace
      const eips = EIPS;
      expect(eips.CanvasManager).toBeDefined();
      expect(eips.MediaManager).toBeDefined();
      expect(eips.GameManager).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined gracefully', async () => {
      const sprite = await createSprite();
      
      // Should not throw with null context
      expect(() => sprite.render(null as any)).not.toThrow();
      
      // Should handle invisible sprites
      sprite.visible = false;
      expect(() => sprite.render({} as any)).not.toThrow();
      
      // Should handle zero alpha
      sprite.alpha = 0;
      expect(() => sprite.render({} as any)).not.toThrow();
    });

    test('should handle game manager edge cases', () => {
      const manager = new GameManager();
      
      // Should handle multiple starts
      manager.start();
      manager.start(); // Should not cause issues
      expect(manager.isRunning()).toBe(true);
      
      // Should handle stop when not running
      manager.stop();
      manager.stop(); // Should not cause issues
      expect(manager.isRunning()).toBe(false);
      
      // Should handle pause when not running
      expect(() => manager.pause()).not.toThrow();
      expect(() => manager.resume()).not.toThrow();
    });

    test('should handle stage edge cases', async () => {
      const stage = await createStage();
      const sprite = await createSprite();
      
      // Should handle adding same child multiple times
      stage.addChild(sprite);
      expect(stage.numChildren).toBe(1);
      
      // Should handle removing non-existent child
      const otherSprite = await createSprite();
      expect(() => stage.removeChild(otherSprite)).not.toThrow();
      
      // Should handle invalid indices
      expect(stage.getChildAt(-1)).toBeNull();
      expect(stage.getChildAt(999)).toBeNull();
      expect(() => stage.removeChildAt(-1)).not.toThrow();
      expect(() => stage.swapChildrenAt(-1, 999)).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    test('should create objects efficiently', async () => {
      const start = Date.now();
      
      // Create multiple objects quickly
      const sprites = [];
      for (let i = 0; i < 100; i++) {
        sprites.push(await createSprite());
      }
      
      const end = Date.now();
      expect(end - start).toBeLessThan(1000); // Should create 100 sprites in under 1 second
      expect(sprites.length).toBe(100);
    });

    test('should handle large numbers of graphics commands', async () => {
      const sprite = await createSprite();
      
      // Add many graphics commands
      for (let i = 0; i < 1000; i++) {
        sprite.graphics.drawRect(i, i, 10, 10);
      }
      
      expect(sprite.graphics.commands.length).toBe(1000);
    });

    test('should handle complex display hierarchies', async () => {
      const stage = await createStage();
      
      // Create nested hierarchy
      for (let i = 0; i < 50; i++) {
        const sprite = await createSprite();
        stage.addChild(sprite);
      }
      
      expect(stage.numChildren).toBe(50);
      
      // Should handle rendering without errors
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        clearRect: jest.fn()
      };
      
      expect(() => stage.render(mockContext as any)).not.toThrow();
    });
  });
});

// Integration test for complete workflow
describe('EIPS Complete Workflow Integration', () => {
  test('should support complete AS3-style game development workflow', async () => {
    // 1. Initialize EIPS
    const eips = EIPS.init();
    expect(eips).toBeDefined();
    
    // 2. Create stage
    const stage = await createStage();
    expect(stage).toBeDefined();
    
    // 3. Create game objects
    const player = await createSprite();
    player.name = 'player';
    player.graphics
      .beginFill(0x00FF00)
      .drawRect(0, 0, 32, 32)
      .endFill();
    
    const enemy = await createSprite();
    enemy.name = 'enemy';
    enemy.graphics
      .beginFill(0xFF0000)
      .drawCircle(16, 16, 16)
      .endFill();
    
    // 4. Add to stage
    stage.addChild(player);
    stage.addChild(enemy);
    expect(stage.numChildren).toBe(2);
    
    // 5. Position objects
    player.x = 100;
    player.y = 200;
    enemy.x = 300;
    enemy.y = 200;
    
    // 6. Setup game loop
    let updateCallbackCalled = false;
    let renderCallbackCalled = false;
    
    eips.game.onUpdate((deltaTime) => {
      updateCallbackCalled = true;
      
      // Simulate player movement
      if (eips.game.isKeyPressed('ArrowRight')) {
        player.x += 100 * deltaTime;
      }
    });
    
    eips.game.onRender((ctx) => {
      renderCallbackCalled = true;
      stage.render(ctx);
    });
    
    // 7. Start game
    eips.game.start();
    expect(eips.game.isRunning()).toBe(true);
    
    // 8. Test input
    expect(typeof eips.game.isKeyPressed('Space')).toBe('boolean');
    expect(typeof eips.game.isMouseButtonPressed(0)).toBe('boolean');
    
    // 9. Test audio
    const audioPlayer = eips.media.createAudioPlayer('sfx.mp3');
    expect(audioPlayer).toBeDefined();
    
    // 10. Stop game
    eips.game.stop();
    expect(eips.game.isRunning()).toBe(false);
    
    // Verify complete workflow executed without errors
    expect(stage.getChildByName('player')).toBe(player);
    expect(stage.getChildByName('enemy')).toBe(enemy);
    expect(player.x).toBe(100);
    expect(enemy.x).toBe(300);
  });
});