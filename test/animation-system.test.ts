/**
 * PowerScript Animation System Test
 * Basic tests for animation system
 */

import { Tween, TweenState } from '../src/animation/core/Tween';
import { Easing } from '../src/animation/easing/EasingFunctions';

// Setup requestAnimationFrame polyfill for Node.js
if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (callback: (time: number) => void) => {
    return setTimeout(() => callback(Date.now()), 16);
  };
}

if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

describe('PowerScript Animation System', () => {
    describe('Tween Class', () => {
        it('should create a tween instance', () => {
            const target = { x: 0, y: 0 };
            const tween = new Tween(target);
            expect(tween).toBeDefined();
            expect(tween).toBeInstanceOf(Tween);
        });

        it('should handle basic tween properties', () => {
            const target = { x: 0 };
            const tween = new Tween(target);
            expect(tween.getState()).toBe(TweenState.IDLE);
        });

        it('should support to() method', () => {
            const target = { x: 0 };
            const tween = new Tween(target).to({ x: 100 }, 1000);
            expect(tween).toBeDefined();
        });
    });

    describe('Easing Functions', () => {
        it('should provide easing module', () => {
            expect(Easing).toBeDefined();
            expect(typeof Easing).toBe('function'); // Easing is actually a function/constructor
        });

        it('should provide linear easing', () => {
            expect(Easing.linear).toBeDefined();
            expect(typeof Easing.linear).toBe('function');
        });

        it('should calculate linear easing values', () => {
            const result = Easing.linear(0.5);
            expect(typeof result).toBe('number');
            expect(result).toBe(0.5);
        });
    });

    describe('Basic Integration', () => {
        it('should handle tween creation and state', () => {
            const target = { x: 0, y: 0 };
            const tween = new Tween(target);
            
            expect(tween.getState()).toBe(TweenState.IDLE);
            expect(target.x).toBe(0);
            expect(target.y).toBe(0);
        });

        it('should not throw on basic operations', () => {
            expect(() => {
                const target = { value: 0 };
                const tween = new Tween(target).to({ value: 100 }, 1000);
                // Just test that creation doesn't throw
            }).not.toThrow();
        });
    });
});