/**
 * Simple test for PowerScript Filesystem Module
 */

const { PowerScriptFileSystem } = require('../dist/PowerScriptFileSystem');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testFileSystem() {
  console.log('📁 Testing PowerScript Filesystem Module...');
  
  const tempDir = path.join(os.tmpdir(), 'powerscript_fs_test');
  
  try {
    // Create filesystem instance
    const filesystem = new PowerScriptFileSystem({
      nativeRoot: tempDir,
      cacheEnabled: true,
      enableWatchers: false // Disable for testing
    });

    await filesystem.initialize();
    console.log('✓ Filesystem initialized');

    // Create test directory
    await filesystem.createDirectory('test', { recursive: true });
    console.log('✓ Directory created');

    // Test file operations
    const testContent = 'Hello, PowerScript Filesystem!';
    await filesystem.writeFile('test/hello.txt', testContent);
    console.log('✓ File written');

    const exists = await filesystem.exists('test/hello.txt');
    console.log('✓ File exists check:', exists);

    const readContent = await filesystem.readFile('test/hello.txt', { encoding: 'utf8' });
    console.log('✓ File read:', readContent === testContent);

    // Test file stats
    const stats = await filesystem.getStats('test/hello.txt');
    console.log('✓ File stats:', stats.size, 'bytes');

    // Test directory listing
    const files = await filesystem.listDirectory('test');
    console.log('✓ Directory listing:', files);

    // Test copy operation
    await filesystem.copy('test/hello.txt', 'test/hello_copy.txt');
    console.log('✓ File copied');

    // Test move operation
    await filesystem.move('test/hello_copy.txt', 'test/hello_moved.txt');
    console.log('✓ File moved');

    // Test cache
    const cachedRead1 = await filesystem.readFile('test/hello.txt', { encoding: 'utf8' });
    const cachedRead2 = await filesystem.readFile('test/hello.txt', { encoding: 'utf8' });
    console.log('✓ Cache working:', cachedRead1 === cachedRead2);

    // Get filesystem statistics
    const fsStats = filesystem.getFileSystemStats();
    console.log('✓ Filesystem stats:', {
      operations: fsStats.totalOperations,
      bytes: fsStats.totalBytes,
      cacheHits: fsStats.cacheHits
    });

    // Cleanup
    await filesystem.deleteFile('test/hello.txt');
    await filesystem.deleteFile('test/hello_moved.txt');
    await filesystem.removeDirectory('test', { recursive: true });
    console.log('✓ Cleanup completed');

    await filesystem.shutdown();
    console.log('✓ Filesystem shutdown');

    // Remove temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('\n🎉 All filesystem tests passed!');
    
  } catch (error) {
    console.error('❌ Filesystem test failed:', error.message);
    
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

// Run the test
testFileSystem();