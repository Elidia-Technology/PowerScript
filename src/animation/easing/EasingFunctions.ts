/**
 * PowerScript Easing Functions
 * Mathematical functions for smooth animation transitions
 * Based on Robert Penner's easing equations and modern web standards
 */

export type EasingFunction = (t: number) => number;

/**
 * Standard easing functions collection
 * All functions take a normalized time value (0-1) and return a progress value
 */
export class Easing {
    
    // Linear easing - no acceleration
    public static linear(t: number): number {
        return t;
    }
    
    // Quadratic easing functions
    public static easeInQuad(t: number): number {
        return t * t;
    }
    
    public static easeOutQuad(t: number): number {
        return t * (2 - t);
    }
    
    public static easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // Cubic easing functions
    public static easeInCubic(t: number): number {
        return t * t * t;
    }
    
    public static easeOutCubic(t: number): number {
        return --t * t * t + 1;
    }
    
    public static easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    // Quartic easing functions
    public static easeInQuart(t: number): number {
        return t * t * t * t;
    }
    
    public static easeOutQuart(t: number): number {
        return 1 - --t * t * t * t;
    }
    
    public static easeInOutQuart(t: number): number {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    }
    
    // Quintic easing functions
    public static easeInQuint(t: number): number {
        return t * t * t * t * t;
    }
    
    public static easeOutQuint(t: number): number {
        return 1 + --t * t * t * t * t;
    }
    
    public static easeInOutQuint(t: number): number {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    }
    
    // Sine easing functions
    public static easeInSine(t: number): number {
        return 1 - Math.cos(t * Math.PI / 2);
    }
    
    public static easeOutSine(t: number): number {
        return Math.sin(t * Math.PI / 2);
    }
    
    public static easeInOutSine(t: number): number {
        return 0.5 * (1 - Math.cos(Math.PI * t));
    }
    
    // Exponential easing functions
    public static easeInExpo(t: number): number {
        return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    }
    
    public static easeOutExpo(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    
    public static easeInOutExpo(t: number): number {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return 0.5 * Math.pow(2, 10 * (2 * t - 1));
        return 0.5 * (2 - Math.pow(2, -10 * (2 * t - 1)));
    }
    
    // Circular easing functions
    public static easeInCirc(t: number): number {
        return 1 - Math.sqrt(1 - t * t);
    }
    
    public static easeOutCirc(t: number): number {
        return Math.sqrt(1 - --t * t);
    }
    
    public static easeInOutCirc(t: number): number {
        return t < 0.5
            ? 0.5 * (1 - Math.sqrt(1 - 4 * t * t))
            : 0.5 * (Math.sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1);
    }
    
    // Back easing functions (overshoot)
    public static easeInBack(t: number, s: number = 1.70158): number {
        return t * t * ((s + 1) * t - s);
    }
    
    public static easeOutBack(t: number, s: number = 1.70158): number {
        return --t * t * ((s + 1) * t + s) + 1;
    }
    
    public static easeInOutBack(t: number, s: number = 1.70158): number {
        s *= 1.525;
        if (t < 0.5) {
            return 0.5 * (t * t * ((s + 1) * t - s));
        }
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }
    
    // Elastic easing functions
    public static easeInElastic(t: number, amplitude: number = 1, period: number = 0.3): number {
        if (t === 0) return 0;
        if (t === 1) return 1;
        
        const s = period / 4;
        return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period));
    }
    
    public static easeOutElastic(t: number, amplitude: number = 1, period: number = 0.3): number {
        if (t === 0) return 0;
        if (t === 1) return 1;
        
        const s = period / 4;
        return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
    }
    
    public static easeInOutElastic(t: number, amplitude: number = 1, period: number = 0.3): number {
        if (t === 0) return 0;
        if ((t *= 2) === 2) return 1;
        
        const s = period / 4;
        if (t < 1) {
            return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period));
        }
        return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / period) * 0.5 + 1;
    }
    
    // Bounce easing functions
    public static easeInBounce(t: number): number {
        return 1 - Easing.easeOutBounce(1 - t);
    }
    
    public static easeOutBounce(t: number): number {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
    
    public static easeInOutBounce(t: number): number {
        return t < 0.5
            ? Easing.easeInBounce(t * 2) * 0.5
            : Easing.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
    }
    
    /**
     * Get easing function by name
     */
    public static getEasing(name: string): EasingFunction {
        const easingMap: { [key: string]: EasingFunction } = {
            'linear': Easing.linear,
            'easeInQuad': Easing.easeInQuad,
            'easeOutQuad': Easing.easeOutQuad,
            'easeInOutQuad': Easing.easeInOutQuad,
            'easeInCubic': Easing.easeInCubic,
            'easeOutCubic': Easing.easeOutCubic,
            'easeInOutCubic': Easing.easeInOutCubic,
            'easeInQuart': Easing.easeInQuart,
            'easeOutQuart': Easing.easeOutQuart,
            'easeInOutQuart': Easing.easeInOutQuart,
            'easeInQuint': Easing.easeInQuint,
            'easeOutQuint': Easing.easeOutQuint,
            'easeInOutQuint': Easing.easeInOutQuint,
            'easeInSine': Easing.easeInSine,
            'easeOutSine': Easing.easeOutSine,
            'easeInOutSine': Easing.easeInOutSine,
            'easeInExpo': Easing.easeInExpo,
            'easeOutExpo': Easing.easeOutExpo,
            'easeInOutExpo': Easing.easeInOutExpo,
            'easeInCirc': Easing.easeInCirc,
            'easeOutCirc': Easing.easeOutCirc,
            'easeInOutCirc': Easing.easeInOutCirc,
            'easeInBack': Easing.easeInBack,
            'easeOutBack': Easing.easeOutBack,
            'easeInOutBack': Easing.easeInOutBack,
            'easeInElastic': Easing.easeInElastic,
            'easeOutElastic': Easing.easeOutElastic,
            'easeInOutElastic': Easing.easeInOutElastic,
            'easeInBounce': Easing.easeInBounce,
            'easeOutBounce': Easing.easeOutBounce,
            'easeInOutBounce': Easing.easeInOutBounce
        };
        
        return easingMap[name] || Easing.linear;
    }
    
    /**
     * Get all available easing function names
     */
    public static getEasingNames(): string[] {
        return [
            'linear',
            'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
            'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
            'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
            'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
            'easeInSine', 'easeOutSine', 'easeInOutSine',
            'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
            'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
            'easeInBack', 'easeOutBack', 'easeInOutBack',
            'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
            'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
        ];
    }
    
    /**
     * Create a custom cubic bezier easing function
     */
    public static cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
        return (t: number) => {
            // Simplified cubic bezier implementation
            // For production, would use more precise calculation
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;
            
            return 3 * uu * t * y1 + 3 * u * tt * y2 + ttt;
        };
    }
}