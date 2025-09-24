/**
 * Test PowerScript Compiler
 */

const { PowerScript, PowerScriptCompiler } = require('./dist/index.js');

async function testCompiler() {
  console.log('🔧 Testing PowerScript Compiler...\n');

  try {
    // Test 1: Access compiler via PowerScript.compiler
    console.log('1. Accessing compiler via PowerScript.compiler');
    const compiler1 = PowerScript.compiler;
    console.log(`   ✅ Compiler: ${compiler1.toString()}`);
    console.log(`   ✅ Version: ${compiler1.getVersion()}`);
    console.log(`   ✅ Supported targets: ${compiler1.getSupportedTargets().join(', ')}`);
    console.log(`   ✅ Supported modules: ${compiler1.getSupportedModules().join(', ')}`);

    // Test 2: Create standalone compiler
    console.log('\n2. Creating standalone compiler instance');
    const compiler2 = new PowerScriptCompiler({
      target: 'es2020',
      module: 'es6',
      sourceMaps: true,
      as3Compatibility: true
    });
    console.log(`   ✅ Compiler: ${compiler2.toString()}`);

    // Test 3: Initialize compiler
    console.log('\n3. Initializing compiler');
    await compiler2.initialize();
    console.log('   ✅ Compiler initialized successfully');

    // Test 4: Compile simple AS3-style code
    console.log('\n4. Compiling AS3-style code');
    const as3Code = `
package com.example {
  import flash.events.EventDispatcher;
  import flash.utils.Timer;
  
  public class MyClass extends EventDispatcher {
    private var _timer:Timer;
    
    public function MyClass() {
      super();
      _timer = new Timer(1000, 5);
      _timer.start();
    }
    
    public function getName():String {
      return "MyClass";
    }
  }
}
`;

    const result = await compiler2.compileCode(as3Code, 'MyClass.as');
    
    console.log(`   ✅ Compilation success: ${result.success}`);
    console.log(`   ✅ Errors: ${result.errors.length}`);
    console.log(`   ✅ Warnings: ${result.warnings.length}`);
    console.log(`   ✅ Output size: ${result.stats.outputSize} bytes`);
    console.log(`   ✅ Compilation time: ${result.stats.compilationTime}ms`);
    
    if (result.code) {
      console.log('\n   Generated code:');
      console.log('   ' + '='.repeat(50));
      console.log('   ' + result.code.split('\n').join('\n   '));
      console.log('   ' + '='.repeat(50));
    }

    // Test 5: Test compiler options
    console.log('\n5. Testing compiler options');
    const options = compiler2.getOptions();
    console.log(`   ✅ Current target: ${options.target}`);
    console.log(`   ✅ Current module: ${options.module}`);
    console.log(`   ✅ AS3 compatibility: ${options.as3Compatibility}`);
    
    compiler2.setOptions({ target: 'es2022', minify: true });
    console.log(`   ✅ Updated target: ${compiler2.getOptions().target}`);
    console.log(`   ✅ Updated minify: ${compiler2.getOptions().minify}`);

    console.log('\n🎉 All compiler tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCompiler();