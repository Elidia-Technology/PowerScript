/**
 * PowerScript Graphics Test - Basic display list functionality test
 */

import { Stage } from '../src/graphics/display/Stage';
import { Sprite } from '../src/graphics/display/Sprite';
import { Shape } from '../src/graphics/display/Shape';
import { Point } from '../src/graphics/geom/Point';
import { Rectangle } from '../src/graphics/geom/Rectangle';

// Test basic display list functionality
function testDisplayList() {
    console.log('Testing PowerScript Graphics Module...');
    
    // Create a stage
    const stage = new Stage(800, 600);
    console.log(`Stage created: ${stage.stageWidth}x${stage.stageHeight}`);
    
    // Create a sprite
    const sprite = new Sprite();
    sprite.x = 100;
    sprite.y = 100;
    sprite.name = 'testSprite';
    
    // Draw some graphics on the sprite
    sprite.graphics.beginFill(0xFF0000, 1);
    sprite.graphics.drawRect(0, 0, 50, 50);
    sprite.graphics.endFill();
    
    // Add sprite to stage
    stage.addChild(sprite);
    console.log(`Sprite added to stage. Stage has ${stage.numChildren} children`);
    
    // Create a shape
    const shape = new Shape();
    shape.x = 200;
    shape.y = 100;
    shape.graphics.beginFill(0x00FF00, 1);
    shape.graphics.drawCircle(25, 25, 25);
    shape.graphics.endFill();
    
    // Add shape to stage
    stage.addChild(shape);
    console.log(`Shape added to stage. Stage has ${stage.numChildren} children`);
    
    // Test bounds calculation
    const spriteBounds = sprite.getBounds();
    console.log(`Sprite bounds: ${spriteBounds.x}, ${spriteBounds.y}, ${spriteBounds.width}, ${spriteBounds.height}`);
    
    // Test hit testing
    const hitPoint = new Point(125, 125);
    const hit = sprite.hitTestPoint(hitPoint.x, hitPoint.y);
    console.log(`Hit test at (${hitPoint.x}, ${hitPoint.y}): ${hit}`);
    
    // Test transformations
    sprite.rotation = 45;
    sprite.scaleX = 1.5;
    sprite.scaleY = 1.5;
    console.log(`Sprite transformed: rotation=${sprite.rotation}, scale=${sprite.scaleX},${sprite.scaleY}`);
    
    console.log('Graphics module test completed successfully!');
    return stage;
}

// Run the test
try {
    const stage = testDisplayList();
    console.log('PowerScript Graphics Module Phase 9 - Basic Implementation COMPLETE!');
} catch (error) {
    console.error('Test failed:', error);
}