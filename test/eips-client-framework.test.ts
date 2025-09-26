/**
 * Test EIPS Client Framework
 * Verify AS3-style functionality works correctly in browser environment
 */

import { EIPS, CanvasManager, MediaManager, GameManager, createSprite, createStage } from '../src/client/index';

describe('EIPS Client Framework', () => {
    describe('Framework Initialization', () => {
        it('should load EIPS framework', () => {
            expect(EIPS).toBeDefined();
            expect(EIPS.name).toBeDefined();
            expect(EIPS.version).toBeDefined();
        });
    });

    describe('Core Managers', () => {
        it('should create CanvasManager', () => {
            const canvasManager = new CanvasManager();
            expect(canvasManager).toBeDefined();
            expect(canvasManager).toBeInstanceOf(CanvasManager);
        });

        it('should create MediaManager', () => {
            const mediaManager = new MediaManager();
            expect(mediaManager).toBeDefined();
            expect(mediaManager).toBeInstanceOf(MediaManager);
            expect(typeof mediaManager.getMasterVolume()).toBe('number');
        });

        it('should create GameManager', () => {
            const gameManager = new GameManager();
            expect(gameManager).toBeDefined();
            expect(gameManager).toBeInstanceOf(GameManager);
            expect(typeof gameManager.isRunning()).toBe('boolean');
            expect(typeof gameManager.isPaused()).toBe('boolean');
        });
    });

    describe('AS3-style Display Objects', () => {
        it('should create sprites', async () => {
            const sprite = await createSprite();
            expect(sprite).toBeDefined();
            expect(typeof sprite.x).toBe('number');
            expect(typeof sprite.y).toBe('number');
            expect(typeof sprite.visible).toBe('boolean');
            expect(sprite.graphics).toBeDefined();
        });

        it('should create stage', async () => {
            const stage = await createStage();
            expect(stage).toBeDefined();
            expect(typeof stage.width).toBe('number');
            expect(typeof stage.height).toBe('number');
        });
    });

    describe('Graphics API', () => {
        it('should support graphics commands', async () => {
            const sprite = await createSprite();
            
            expect(() => {
                sprite.graphics
                    .beginFill(0xFF0000, 0.5)
                    .drawRect(10, 10, 50, 30)
                    .endFill()
                    .lineStyle(2, 0x0000FF)
                    .drawCircle(75, 25, 20);
            }).not.toThrow();
            
            expect(sprite.graphics.commands).toBeDefined();
            expect(Array.isArray(sprite.graphics.commands)).toBe(true);
        });

        it('should handle basic graphics operations', async () => {
            const sprite = await createSprite();
            
            sprite.graphics.beginFill(0x00FF00);
            sprite.graphics.drawRect(0, 0, 100, 100);
            sprite.graphics.endFill();
            
            expect(sprite.graphics.commands.length).toBeGreaterThan(0);
        });
    });

    describe('Integration Tests', () => {
        it('should handle stage and sprite integration', async () => {
            const stage = await createStage();
            const sprite = await createSprite();
            
            expect(() => {
                stage.addChild(sprite);
            }).not.toThrow();
            
            expect(stage.children).toBeDefined();
            expect(stage.children.length).toBeGreaterThan(0);
        });
    });
});