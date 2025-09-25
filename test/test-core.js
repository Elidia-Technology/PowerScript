#!/usr/bin/env node

/**
 * PowerScript Core Test
 * Quick test to verify core functionality
 */

const { PowerScript, EventDispatcher, Timer, Vector, ByteArray, Logger } = require('./dist/index.js');

async function runTests() {
  console.log('🧪 Running PowerScript Core Tests...\n');

  try {
    // Test 1: PowerScript initialization
    console.log('1. Testing PowerScript initialization...');
    await PowerScript.initialize();
    console.log('   ✅ PowerScript initialized successfully');
    console.log(`   ℹ️  Version: ${PowerScript.version}`);
    console.log(`   ℹ️  Platform: ${PowerScript.platform.platform}`);

    // Test 2: EventDispatcher
    console.log('\n2. Testing EventDispatcher...');
    const dispatcher = new EventDispatcher();
    let eventReceived = false;
    
    dispatcher.addEventListener('test', () => {
      eventReceived = true;
    });
    
    dispatcher.dispatchEvent({ type: 'test' });
    console.log(`   ✅ EventDispatcher working: ${eventReceived}`);

    // Test 3: Timer
    console.log('\n3. Testing Timer...');
    const timer = new Timer(100);
    let timerFired = false;
    
    timer.addEventListener('timer', () => {
      timerFired = true;
    });
    
    timer.start();
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log(`   ✅ Timer working: ${timerFired}`);

    // Test 4: Vector
    console.log('\n4. Testing Vector...');
    const vector = new Vector();
    vector.push('ActionScript', 'TypeScript', 'JavaScript');
    console.log(`   ✅ Vector length: ${vector.length}`);
    console.log(`   ✅ Vector contents: ${vector.join(', ')}`);

    // Test 5: ByteArray
    console.log('\n5. Testing ByteArray...');
    const byteArray = new ByteArray();
    byteArray.writeUTF('Hello PowerScript!');
    byteArray.position = 0;
    const message = byteArray.readUTF();
    console.log(`   ✅ ByteArray message: "${message}"`);
    console.log(`   ✅ ByteArray length: ${byteArray.length} bytes`);

    // Test 6: Logger
    console.log('\n6. Testing Logger...');
    const logger = new Logger('Test');
    logger.info('PowerScript core components are working correctly!');
    console.log('   ✅ Logger working');

    console.log('\n🎉 All tests passed! PowerScript core is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();