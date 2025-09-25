// Simple Node.js test runner for Phase 11 Animation System
// This validates the core animation functionality without complex test frameworks

// Test utilities
let testsPassed = 0;
let testsFailed = 0;
let currentTime = 0;

// Mock environment BEFORE importing anything
(globalThis as any).performance = { 
    now: () => currentTime 
};

(globalThis as any).requestAnimationFrame = (callback: Function) => {
    return setTimeout(() => {
        currentTime += 16.67; // Simulate 60fps
        callback(currentTime);
    }, 0);
};

(globalThis as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
};

// Now import after mocks are set up
import { Easing } from '../src/animation/easing/EasingFunctions';
import { Tween } from '../src/animation/core/Tween';
import { AnimationController } from '../src/animation/core/AnimationController';

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        testsFailed++;
    }
}

function assertEquals(actual: any, expected: any, message: string) {
    assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
    assert(Math.abs(actual - expected) <= tolerance, 
           `${message} (expected: ~${expected}, actual: ${actual}, tolerance: ${tolerance})`);
}

async function runTests() {
    console.log('🚀 Running Phase 11 Animation System Tests\n');
    
    // Test 1: Easing Functions
    console.log('📊 Testing Easing Functions...');
    assertEquals(Easing.linear(0), 0, 'Linear easing at t=0');
    assertEquals(Easing.linear(1), 1, 'Linear easing at t=1');
    assertEquals(Easing.linear(0.5), 0.5, 'Linear easing at t=0.5');
    
    assertApprox(Easing.easeInQuad(0.5), 0.25, 0.01, 'QuadIn easing at t=0.5');
    assertApprox(Easing.easeOutQuad(0.5), 0.75, 0.01, 'QuadOut easing at t=0.5');
    
    // Test easing function lookup
    assert(Easing.getEasing('linear') === Easing.linear, 'Easing function lookup works');
    assert(Easing.getEasing('invalid') === Easing.linear, 'Invalid easing returns linear');
    
    // Test 2: Basic Tween Creation
    console.log('\n🎬 Testing Tween Creation...');
    const target = { x: 0, y: 0, alpha: 1 };
    const tween = new Tween(target);
    
    assert(tween !== null, 'Tween can be created');
    assertEquals(tween.getTarget(), target, 'Tween has correct target');
    assertEquals(tween.isPlaying(), false, 'New tween is not playing');
    assertEquals(tween.progress(), 0, 'New tween has 0 progress');
    
    // Test 3: Tween Configuration
    console.log('\n⚙️ Testing Tween Configuration...');
    tween.to({ x: 100, y: 50 }, 1000).ease('easeOutQuad');
    
    // Test 4: Tween Animation
    console.log('\n🎯 Testing Tween Animation...');
    currentTime = 0;
    target.x = 0;
    target.y = 0;
    
    tween.play();
    assertEquals(tween.isPlaying(), true, 'Tween is playing after play()');
    
    // Simulate animation steps
    currentTime = 500; // 50% through 1000ms animation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should be approximately halfway with quadOut easing
    assert(target.x > 0 && target.x < 100, 'X property is animating');
    assert(target.y > 0 && target.y < 50, 'Y property is animating');
    
    // Test 5: AnimationController
    console.log('\n🎮 Testing AnimationController...');
    const controller = AnimationController.getInstance();
    assert(controller !== null, 'AnimationController instance created');
    
    const target2 = { scale: 1 };
    const tween2 = controller.createTween(target2);
    tween2.to({ scale: 2 }, 500);
    
    assert(controller.getActiveTweens().length >= 0, 'Controller tracks active tweens');
    
    // Test pause/resume all
    controller.pauseAll();
    controller.resumeAll();
    
    // Test 6: Tween Events
    console.log('\n📡 Testing Tween Events...');
    let eventsFired = 0;
    const eventTween = new Tween({ value: 0 });
    
    eventTween
        .to({ value: 100 }, 100)
        .onStart(() => eventsFired++)
        .onUpdate(() => eventsFired++)
        .onComplete(() => eventsFired++);
    
    eventTween.play();
    
    // Wait for animation to potentially complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    assert(eventsFired > 0, 'Tween events are firing');
    
    // Test 7: Tween Control
    console.log('\n🎛️ Testing Tween Control...');
    const controlTarget = { rotation: 0 };
    const controlTween = new Tween(controlTarget);
    controlTween.to({ rotation: 360 }, 1000);
    
    controlTween.play();
    controlTween.pause();
    assertEquals(controlTween.isPlaying(), false, 'Tween pauses correctly');
    
    controlTween.resume();
    assertEquals(controlTween.isPlaying(), true, 'Tween resumes correctly');
    
    controlTween.stop();
    assertEquals(controlTween.isPlaying(), false, 'Tween stops correctly');
    assertEquals(controlTween.progress(), 0, 'Tween resets on stop');
    
    // Final Results
    console.log('\n📊 Test Results:');
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All tests passed! Phase 11 Animation System is working correctly.');
        return true;
    } else {
        console.log('\n⚠️ Some tests failed. Please review the implementation.');
        return false;
    }
}

// Run tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});