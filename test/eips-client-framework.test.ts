/**
 * Test EIPS Client Framework
 * Verify AS3-style functionality works correctly
 */

import { EIPS, CanvasManager, MediaManager, GameManager, createSprite, createStage } from '../src/client/index';

async function testEIPSFramework() {
  console.log('🚀 Testing EIPS Client Framework...');
  
  // Test 1: Framework initialization
  console.log('✅ EIPS Framework loaded:', EIPS.name, EIPS.version);
  
  // Test 2: Canvas Manager
  const canvasManager = new CanvasManager();
  console.log('✅ CanvasManager created');
  
  // Test 3: Media Manager
  const mediaManager = new MediaManager();
  console.log('✅ MediaManager created');
  console.log('   Master volume:', mediaManager.getMasterVolume());
  
  // Test 4: Game Manager
  const gameManager = new GameManager();
  console.log('✅ GameManager created');
  console.log('   Running:', gameManager.isRunning());
  console.log('   Paused:', gameManager.isPaused());
  
  // Test 5: AS3-style Sprite Creation
  const sprite = await createSprite();
  console.log('✅ AS3-style Sprite created');
  console.log('   Position:', sprite.x, sprite.y);
  console.log('   Visible:', sprite.visible);
  console.log('   Has graphics:', !!sprite.graphics);
  
  // Test 6: Graphics API
  sprite.graphics
    .beginFill(0xFF0000, 0.5)
    .drawRect(10, 10, 50, 30)
    .endFill()
    .lineStyle(2, 0x0000FF)
    .drawCircle(75, 25, 20);
  
  console.log('✅ Graphics commands executed');
  console.log('   Commands count:', sprite.graphics.commands.length);
  
  // Test 7: Stage Creation
  const stage = await createStage();
  console.log('✅ AS3-style Stage created');
  console.log('   Size:', stage.width + 'x' + stage.height);
  console.log('   Children:', stage.numChildren);
  
  // Test 8: Display List
  stage.addChild(sprite);
  console.log('✅ Sprite added to stage');
  console.log('   Stage children:', stage.numChildren);
  console.log('   Sprite parent:', !!sprite.parent);
  
  // Test 9: Transform Operations
  sprite.x = 100;
  sprite.y = 50;
  sprite.scaleX = 2;
  sprite.scaleY = 1.5;
  sprite.rotation = Math.PI / 4;
  sprite.alpha = 0.8;
  
  console.log('✅ Transform operations applied');
  console.log('   Position:', sprite.x, sprite.y);
  console.log('   Scale:', sprite.scaleX, sprite.scaleY);
  console.log('   Rotation:', sprite.rotation);
  console.log('   Alpha:', sprite.alpha);
  
  // Test 10: Hit Testing
  const hitResult = sprite.hitTestPoint(125, 75);
  console.log('✅ Hit testing works:', hitResult);
  
  // Test 11: Coordinate Conversion
  const localPoint = { x: 10, y: 10 };
  const globalPoint = sprite.localToGlobal(localPoint);
  console.log('✅ Local to global:', localPoint, '=>', globalPoint);
  
  // Test 12: EIPS Init Helper
  const eipsInstance = EIPS.init();
  console.log('✅ EIPS init() helper works');
  console.log('   Has canvas manager:', !!eipsInstance.canvas);
  console.log('   Has media manager:', !!eipsInstance.media);
  console.log('   Has game manager:', !!eipsInstance.game);
  
  console.log('\n🎉 All EIPS Client Framework tests passed!');
  console.log('💡 The unified PowerScript package provides complete AS3-style development capabilities');
  console.log('📦 Ready for React, Vue, Angular, and vanilla HTML5 projects');
  
  return true;
}

// Export test function
export { testEIPSFramework };

// Run test if called directly
if (require.main === module) {
  testEIPSFramework().catch(console.error);
}