import { PowerScriptGraphics } from '../src/multimedia/index-stable';

/**
 * Test the stable multimedia module implementation
 */
async function testStableMultimedia() {
  console.log('🎬 Testing PowerScript Graphics & Multimedia Module (Stable Version)');
  console.log('================================================');

  try {
    // Create multimedia system
    const multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false, // Disabled pending fixes
      enableProcessing: false // Disabled pending fixes
    });

    console.log('✅ PowerScriptGraphics created successfully');

    // Check capabilities
    const capabilities = multimedia.getCapabilities();
    console.log('🔧 Capabilities:', capabilities);

    // Initialize the system
    await multimedia.initialize();
    console.log('✅ Multimedia system initialized');

    // Test format support
    const formats = multimedia.getSupportedFormats();
    console.log('🎵 Supported audio formats:', formats.audio);
    console.log('🎬 Supported video formats:', formats.video);

    // Test format checking
    console.log('🎵 MP3 supported:', multimedia.isFormatSupported('mp3'));
    console.log('🎬 MP4 supported:', multimedia.isFormatSupported('mp4'));

    // Try to create players (this might fail in Node.js environment)
    try {
      const audioPlayer = await multimedia.createAudioPlayer({
        volume: 0.5,
        autoplay: false
      });
      console.log('✅ Audio player created successfully');
    } catch (error) {
      console.log('⚠️ Audio player creation failed (expected in Node.js):', (error as Error).message);
    }

    try {
      const videoPlayer = await multimedia.createVideoPlayer({
        width: 640,
        height: 480,
        controls: true
      });
      console.log('✅ Video player created successfully');
    } catch (error) {
      console.log('⚠️ Video player creation failed (expected in Node.js):', (error as Error).message);
    }

    // Clean up
    await multimedia.destroy();
    console.log('✅ Multimedia system destroyed successfully');

    console.log('\n🎉 Stable Multimedia Module Test PASSED!');
    console.log('📝 Note: Full audio/video functionality requires browser environment');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testStableMultimedia().catch(console.error);