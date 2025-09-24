/**
 * Tests for AS3 Utilities Module
 * 
 * Comprehensive tests for Timer, Math, Array, Vector, and ByteArray utilities
 * to ensure AS3 compatibility and functionality.
 */

import { 
    Timer, 
    PSMath, 
    PSArray, 
    PSVector, 
    PSByteArray 
} from '../core/AS3Utilities';

// Test utilities
class TestRunner {
    private tests: Array<{ name: string; test: () => void | Promise<void> }> = [];
    private results: Array<{ name: string; passed: boolean; error?: string }> = [];

    public addTest(name: string, test: () => void | Promise<void>): void {
        this.tests.push({ name, test });
    }

    public async runAll(): Promise<void> {
        console.log('🧪 Running AS3 Utilities Tests...\n');

        for (const { name, test } of this.tests) {
            try {
                await test();
                this.results.push({ name, passed: true });
                console.log(`✅ ${name}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.results.push({ name, passed: false, error: errorMessage });
                console.log(`❌ ${name}: ${errorMessage}`);
            }
        }

        this.printSummary();
    }

    private printSummary(): void {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\n📊 Test Summary:`);
        console.log(`   Passed: ${passed}/${total}`);
        console.log(`   Failed: ${total - passed}/${total}`);
        
        if (passed === total) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('💥 Some tests failed:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`     ${r.name}: ${r.error}`);
            });
        }
    }
}

// Test helper functions
function assert(condition: boolean, message: string = 'Assertion failed'): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertArrayEqual<T>(actual: T[], expected: T[], message?: string): void {
    if (actual.length !== expected.length) {
        throw new Error(message || `Array lengths differ: expected ${expected.length}, got ${actual.length}`);
    }
    
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) {
            throw new Error(message || `Arrays differ at index ${i}: expected ${expected[i]}, got ${actual[i]}`);
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Timer Tests
function setupTimerTests(runner: TestRunner): void {
    runner.addTest('Timer - Basic functionality', async () => {
        let timerFired = false;
        const timer = new Timer(50, 1);
        
        timer.addEventListener('timer', () => {
            timerFired = true;
        });
        
        timer.start();
        await sleep(100);
        
        assert(timerFired, 'Timer should have fired');
        assert(timer.currentCount === 1, 'Timer count should be 1');
        assert(!timer.running, 'Timer should not be running after completion');
    });

    runner.addTest('Timer - Repeat count', async () => {
        let fireCount = 0;
        const timer = new Timer(25, 3);
        
        timer.addEventListener('timer', () => {
            fireCount++;
        });
        
        timer.start();
        await sleep(150);
        
        assertEqual(fireCount, 3, 'Timer should fire 3 times');
        assertEqual(timer.currentCount, 3, 'Current count should be 3');
    });

    runner.addTest('Timer - Timer complete event', async () => {
        let completed = false;
        const timer = new Timer(30, 2);
        
        timer.addEventListener('timerComplete', () => {
            completed = true;
        });
        
        timer.start();
        await sleep(100);
        
        assert(completed, 'Timer complete event should fire');
    });

    runner.addTest('Timer - Stop and reset', () => {
        const timer = new Timer(100, 5);
        timer.start();
        
        assert(timer.running, 'Timer should be running');
        
        timer.stop();
        assert(!timer.running, 'Timer should not be running after stop');
        
        timer.reset();
        assertEqual(timer.currentCount, 0, 'Current count should be reset to 0');
    });
}

// PSMath Tests
function setupMathTests(runner: TestRunner): void {
    runner.addTest('PSMath - Constants', () => {
        assertEqual(PSMath.PI, Math.PI, 'PI should match Math.PI');
        assertEqual(PSMath.E, Math.E, 'E should match Math.E');
        assert(PSMath.PI > 3.14 && PSMath.PI < 3.15, 'PI should be approximately 3.14159');
    });

    runner.addTest('PSMath - Basic functions', () => {
        assertEqual(PSMath.abs(-5), 5, 'abs(-5) should equal 5');
        assertEqual(PSMath.max(3, 7, 2), 7, 'max(3, 7, 2) should equal 7');
        assertEqual(PSMath.min(3, 7, 2), 2, 'min(3, 7, 2) should equal 2');
        assertEqual(PSMath.round(4.6), 5, 'round(4.6) should equal 5');
        assertEqual(PSMath.floor(4.9), 4, 'floor(4.9) should equal 4');
        assertEqual(PSMath.ceil(4.1), 5, 'ceil(4.1) should equal 5');
    });

    runner.addTest('PSMath - Extended functions', () => {
        const randomValue = PSMath.randomRange(10, 20);
        assert(randomValue >= 10 && randomValue <= 20, 'randomRange should return value in range');
        
        const randomInt = PSMath.randomInt(5, 10);
        assert(Number.isInteger(randomInt) && randomInt >= 5 && randomInt <= 10, 'randomInt should return integer in range');
        
        assertEqual(PSMath.degrees(PSMath.PI), 180, 'PI radians should equal 180 degrees');
        assertEqual(PSMath.radians(180), PSMath.PI, '180 degrees should equal PI radians');
        
        assertEqual(PSMath.clamp(15, 10, 20), 15, 'clamp(15, 10, 20) should equal 15');
        assertEqual(PSMath.clamp(5, 10, 20), 10, 'clamp(5, 10, 20) should equal 10');
        assertEqual(PSMath.clamp(25, 10, 20), 20, 'clamp(25, 10, 20) should equal 20');
        
        assertEqual(PSMath.lerp(0, 10, 0.5), 5, 'lerp(0, 10, 0.5) should equal 5');
        
        assertEqual(PSMath.sign(5), 1, 'sign(5) should equal 1');
        assertEqual(PSMath.sign(-5), -1, 'sign(-5) should equal -1');
        assertEqual(PSMath.sign(0), 0, 'sign(0) should equal 0');
    });
}

// PSArray Tests
function setupArrayTests(runner: TestRunner): void {
    runner.addTest('PSArray - Basic functionality', () => {
        const arr = new PSArray<number>(1, 2, 3);
        
        assertEqual(arr.length, 3, 'Array length should be 3');
        assertEqual(arr[0], 1, 'First element should be 1');
        
        arr.addItem(4);
        assertEqual(arr.length, 4, 'Array length should be 4 after addItem');
        assertEqual(arr[3], 4, 'Last element should be 4');
    });

    runner.addTest('PSArray - Item manipulation', () => {
        const arr = new PSArray<string>('a', 'b', 'c');
        
        arr.insertItemAt('x', 1);
        assertArrayEqual(arr.toArray(), ['a', 'x', 'b', 'c'], 'insertItemAt should work correctly');
        
        const removed = arr.removeItemAt(1);
        assertEqual(removed, 'x', 'removeItemAt should return removed item');
        assertArrayEqual(arr.toArray(), ['a', 'b', 'c'], 'Array should be correct after removal');
        
        const success = arr.removeItem('b');
        assert(success, 'removeItem should return true for existing item');
        assertArrayEqual(arr.toArray(), ['a', 'c'], 'Array should be correct after removeItem');
        
        assertEqual(arr.getItemIndex('c'), 1, 'getItemIndex should return correct index');
        assert(arr.contains('a'), 'contains should return true for existing item');
        assert(!arr.contains('z'), 'contains should return false for non-existing item');
    });

    runner.addTest('PSArray - Sorting', () => {
        const arr = new PSArray<{ name: string; age: number }>(
            { name: 'John', age: 30 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 35 }
        );
        
        arr.sortOn('age');
        assertEqual(arr[0].name, 'Alice', 'First item should be Alice after sorting by age');
        assertEqual(arr[2].name, 'Bob', 'Last item should be Bob after sorting by age');
    });
}

// PSVector Tests
function setupVectorTests(runner: TestRunner): void {
    runner.addTest('PSVector - Basic functionality', () => {
        const vec = new PSVector<number>();
        
        assertEqual(vec.length, 0, 'Vector should start empty');
        assert(!vec.fixed, 'Vector should not be fixed by default');
        
        vec.push(1);
        vec.push(2);
        assertEqual(vec.length, 2, 'Vector length should be 2');
        assertEqual(vec.get(0), 1, 'First element should be 1');
        assertEqual(vec.get(1), 2, 'Second element should be 2');
    });

    runner.addTest('PSVector - Fixed vector', () => {
        const vec = new PSVector<number>(3, true);
        
        assert(vec.fixed, 'Vector should be fixed');
        assertEqual(vec.length, 3, 'Fixed vector should have specified length');
        
        // Test that modifying operations throw
        let errorThrown = false;
        try {
            vec.push(1);
        } catch (error) {
            errorThrown = true;
        }
        assert(errorThrown, 'push should throw error on fixed vector');
        
        // But setting existing indices should work
        vec.set(0, 10);
        assertEqual(vec.get(0), 10, 'Setting existing index should work on fixed vector');
    });

    runner.addTest('PSVector - Array operations', () => {
        const vec = new PSVector<number>();
        vec.push(1, 2, 3, 4, 5);
        
        const sliced = vec.slice(1, 3);
        assertArrayEqual(sliced.toArray(), [2, 3], 'slice should work correctly');
        
        const filtered = vec.filter(x => x > 3);
        assertArrayEqual(filtered.toArray(), [4, 5], 'filter should work correctly');
        
        const mapped = vec.map(x => x * 2);
        assertArrayEqual(mapped.toArray(), [2, 4, 6, 8, 10], 'map should work correctly');
        
        const sum = vec.reduce((acc, x) => acc + x, 0);
        assertEqual(sum, 15, 'reduce should work correctly');
    });

    runner.addTest('PSVector - Concatenation', () => {
        const vec1 = new PSVector<number>();
        vec1.push(1, 2);
        
        const vec2 = new PSVector<number>();
        vec2.push(3, 4);
        
        const combined = vec1.concat(vec2);
        assertArrayEqual(combined.toArray(), [1, 2, 3, 4], 'concat should work correctly');
        
        const combinedWithArray = vec1.concat([5, 6]);
        assertArrayEqual(combinedWithArray.toArray(), [1, 2, 5, 6], 'concat with array should work');
    });
}

// PSByteArray Tests
function setupByteArrayTests(runner: TestRunner): void {
    runner.addTest('PSByteArray - Basic functionality', () => {
        const ba = new PSByteArray();
        
        assertEqual(ba.length, 0, 'ByteArray should start empty');
        assertEqual(ba.position, 0, 'Position should start at 0');
        assertEqual(ba.bytesAvailable, 0, 'bytesAvailable should be 0');
        assertEqual(ba.endian, 'bigEndian', 'Default endian should be bigEndian');
    });

    runner.addTest('PSByteArray - Byte operations', () => {
        const ba = new PSByteArray();
        
        ba.writeByte(65); // 'A' in ASCII
        ba.writeByte(-128);
        ba.writeUnsignedByte(255);
        
        assertEqual(ba.length, 3, 'Length should be 3 after writing 3 bytes');
        assertEqual(ba.position, 3, 'Position should be 3');
        
        ba.position = 0; // Reset position
        
        assertEqual(ba.readByte(), 65, 'First byte should be 65');
        assertEqual(ba.readByte(), -128, 'Second byte should be -128');
        assertEqual(ba.readUnsignedByte(), 255, 'Third byte should be 255');
    });

    runner.addTest('PSByteArray - Integer operations', () => {
        const ba = new PSByteArray();
        
        ba.writeShort(1234);
        ba.writeInt(123456789);
        ba.writeUnsignedInt(4294967295); // Max uint32
        
        ba.position = 0;
        
        assertEqual(ba.readShort(), 1234, 'Short should be read correctly');
        assertEqual(ba.readInt(), 123456789, 'Int should be read correctly');
        assertEqual(ba.readUnsignedInt(), 4294967295, 'Unsigned int should be read correctly');
    });

    runner.addTest('PSByteArray - Float operations', () => {
        const ba = new PSByteArray();
        
        ba.writeFloat(3.14159);
        ba.writeDouble(2.718281828459045);
        
        ba.position = 0;
        
        const readFloat = ba.readFloat();
        assert(Math.abs(readFloat - 3.14159) < 0.0001, 'Float should be read correctly');
        
        const readDouble = ba.readDouble();
        assert(Math.abs(readDouble - 2.718281828459045) < 0.000000000000001, 'Double should be read correctly');
    });

    runner.addTest('PSByteArray - String operations', () => {
        const ba = new PSByteArray();
        
        ba.writeUTF('Hello, World!');
        ba.writeUTFBytes('PowerScript');
        
        ba.position = 0;
        
        assertEqual(ba.readUTF(), 'Hello, World!', 'UTF string should be read correctly');
        assertEqual(ba.readUTFBytes(11), 'PowerScript', 'UTF bytes should be read correctly');
    });

    runner.addTest('PSByteArray - ByteArray operations', () => {
        const ba1 = new PSByteArray();
        ba1.writeUTF('Source');
        
        const ba2 = new PSByteArray();
        ba1.position = 0;
        ba1.readBytes(ba2, 0);
        
        ba2.position = 0;
        assertEqual(ba2.readUTF(), 'Source', 'ByteArray copy should work correctly');
    });

    runner.addTest('PSByteArray - Endianness', () => {
        const ba = new PSByteArray();
        
        ba.endian = 'littleEndian';
        ba.writeShort(0x1234);
        
        ba.position = 0;
        ba.endian = 'bigEndian';
        const value = ba.readShort();
        
        assertEqual(value, 0x3412, 'Endianness should affect byte order');
    });

    runner.addTest('PSByteArray - Error handling', () => {
        const ba = new PSByteArray();
        ba.writeByte(1);
        ba.position = 0;
        ba.readByte(); // Read the only byte
        
        let errorThrown = false;
        try {
            ba.readByte(); // Should throw EOF error
        } catch (error) {
            errorThrown = true;
            assert(error instanceof Error && error.message.includes('EOF'), 'Should throw EOF error');
        }
        assert(errorThrown, 'Reading beyond end should throw error');
    });
}

// Main test execution
async function runAS3UtilitiesTests(): Promise<void> {
    const runner = new TestRunner();
    
    // Setup all test suites
    setupTimerTests(runner);
    setupMathTests(runner);
    setupArrayTests(runner);
    setupVectorTests(runner);
    setupByteArrayTests(runner);
    
    // Run all tests
    await runner.runAll();
}

// Export test runner for external use
export { runAS3UtilitiesTests };

// Run tests if this file is executed directly (Node.js environment)
if (typeof require !== 'undefined' && require.main === module) {
    runAS3UtilitiesTests().catch(console.error);
}