# PowerScript: ActionScript 3 Programming Style with TypeScript Power

## 🎮 What is PowerScript?

PowerScript is a comprehensive TypeScript-based framework that brings the familiar ActionScript 3 programming style to modern JavaScript/TypeScript development. It combines the best of both worlds:

- **📺 ActionScript 3 Programming Style**: Familiar display lists, event systems, graphics APIs, and class hierarchies
- **💻 TypeScript Power**: Strong typing, modern ES6+ features, and excellent IDE support  
- **📦 npm Ecosystem**: Full compatibility with the entire npm package ecosystem

## 🏗️ Core AS3-Style Features

### 1. Display List Architecture 🎭

PowerScript provides the classic AS3 display object hierarchy:

```typescript
import { Stage, Sprite, Shape, DisplayObjectContainer } from 'powerscript';

// Create stage (root container)
const stage = new Stage(800, 600);
stage.backgroundColor = 0x333699;
stage.frameRate = 60;

// Create sprites (display objects with graphics)
const container = new Sprite();
container.name = "mainContainer";
container.x = 100;
container.y = 100;

// Add to display list (exactly like AS3)
stage.addChild(container);
console.log(`Stage has ${stage.numChildren} children`);
```

**AS3 Properties Available:**
- `x`, `y`, `z` - Position coordinates
- `scaleX`, `scaleY`, `rotation` - Transformations
- `alpha`, `visible` - Visual properties
- `width`, `height` - Dimensions
- `name` - Object identification
- `parent`, `stage`, `root` - Hierarchy navigation
- `mouseX`, `mouseY` - Mouse coordinates

### 2. Vector Graphics API 🎨

Full AS3-compatible graphics drawing system:

```typescript
const sprite = new Sprite();

// AS3-style drawing commands
sprite.graphics.beginFill(0xFF0000, 0.8);
sprite.graphics.drawRect(0, 0, 100, 50);
sprite.graphics.endFill();

sprite.graphics.lineStyle(3, 0x000000);
sprite.graphics.drawCircle(50, 25, 20);

// Complex shapes
sprite.graphics.beginFill(0x00FF00);
sprite.graphics.drawRoundRect(10, 10, 80, 30, 5);
sprite.graphics.endFill();
```

**AS3 Graphics Methods:**
- `beginFill()`, `endFill()` - Fill operations
- `lineStyle()` - Stroke styling
- `drawRect()`, `drawCircle()`, `drawRoundRect()` - Shape drawing
- `moveTo()`, `lineTo()`, `curveTo()` - Path drawing
- `clear()` - Graphics clearing

### 3. Event System 🎯

AS3-style event handling with TypeScript benefits:

```typescript
import { EventTypes } from 'powerscript';

const button = new Sprite();
button.buttonMode = true;
button.useHandCursor = true;

// Add AS3-style event listeners
button.addEventListener(EventTypes.CLICK, (event) => {
    console.log('Button clicked!');
    button.scaleX *= 1.1;
    button.scaleY *= 1.1;
});

button.addEventListener(EventTypes.MOUSE_OVER, () => {
    button.alpha = 0.7;
});

button.addEventListener(EventTypes.MOUSE_OUT, () => {
    button.alpha = 1.0;
});

// Custom events
button.addEventListener('customEvent', (event) => {
    console.log('Custom event:', event.data);
});

// Dispatch events
button.dispatchEvent({
    type: 'customEvent',
    data: { message: 'Hello!' }
});
```

**AS3 Event Types:**
- `CLICK`, `MOUSE_DOWN`, `MOUSE_UP` - Mouse events
- `MOUSE_OVER`, `MOUSE_OUT`, `MOUSE_MOVE` - Mouse interaction
- `ENTER_FRAME` - Animation frame events
- `ADDED`, `REMOVED` - Display list events
- Custom events with data payloads

### 4. Animation & Tweening 🎬

Frame-based animation system like AS3:

```typescript
// ENTER_FRAME animation (AS3 style)
let frameCount = 0;
stage.addEventListener(EventTypes.ENTER_FRAME, () => {
    frameCount++;
    
    // Animate sprite position
    sprite.x = 100 + Math.sin(frameCount * 0.1) * 50;
    sprite.y = 100 + Math.cos(frameCount * 0.1) * 50;
    sprite.rotation += 2;
});

// PowerScript Animation system (enhanced AS3 style)
const animation = Animation.create(sprite)
    .to({ x: 300, y: 200 }, 1000)
    .to({ alpha: 0.5, rotation: 180 }, 500)
    .repeat(-1);
```

### 5. Geometry Classes 📐

AS3-compatible geometry operations:

```typescript
import { Point, Rectangle, Matrix } from 'powerscript';

// Point operations
const point1 = new Point(10, 20);
const point2 = new Point(30, 40);
const distance = Point.distance(point1, point2);

// Rectangle operations
const rect1 = new Rectangle(0, 0, 100, 50);
const rect2 = new Rectangle(50, 25, 100, 50);
const intersection = rect1.intersection(rect2);

// Matrix transformations
const matrix = new Matrix();
matrix.translate(100, 200);
matrix.rotate(Math.PI / 4); // 45 degrees
matrix.scale(2, 2);

const transformedPoint = matrix.transformPoint(point1);
```

### 6. Class Inheritance 🔧

AS3-style class inheritance with TypeScript benefits:

```typescript
// Create custom display objects (like AS3)
class CustomButton extends Sprite {
    private _label: string;
    private _isPressed: boolean = false;
    
    constructor(label: string, width: number = 100, height: number = 30) {
        super();
        
        this._label = label;
        this.buttonMode = true;
        this.useHandCursor = true;
        
        this.drawButton(width, height);
        this.setupEvents();
    }
    
    private drawButton(width: number, height: number): void {
        this.graphics.clear();
        
        const color = this._isPressed ? 0x999999 : 0xCCCCCC;
        this.graphics.beginFill(color);
        this.graphics.lineStyle(2, 0x666666);
        this.graphics.drawRoundRect(0, 0, width, height, 5);
        this.graphics.endFill();
    }
    
    private setupEvents(): void {
        this.addEventListener(EventTypes.CLICK, () => {
            this.dispatchEvent({
                type: 'buttonClick',
                label: this._label
            });
        });
    }
    
    // TypeScript getters/setters
    public get label(): string {
        return this._label;
    }
    
    public set label(value: string) {
        this._label = value;
        this.drawButton(100, 30);
    }
}

// Use custom class
const playButton = new CustomButton('Play');
playButton.addEventListener('buttonClick', (event) => {
    console.log(`${event.label} button clicked!`);
});

stage.addChild(playButton);
```

## 💻 TypeScript Integration Benefits

PowerScript leverages TypeScript for enhanced development:

```typescript
// Strong typing
interface GameData {
    score: number;
    level: number;
    playerName: string;
}

const gameData: GameData = {
    score: 1000,
    level: 5,
    playerName: 'Player1'
};

// Generics work with PowerScript
const sprites: Array<Sprite> = [];
sprites.push(new Sprite());

// Type-safe display object operations
const typedSprite: Sprite = new Sprite();
typedSprite.name = 'mySprite'; // TypeScript knows this is a string
typedSprite.x = 100; // TypeScript knows this is a number
```

## 📦 npm Ecosystem Compatibility

PowerScript works seamlessly with any npm package:

```typescript
// HTTP requests
import axios from 'axios';
const response = await axios.get('https://api.example.com/data');

// Utilities
import * as _ from 'lodash';
const grouped = _.groupBy(gameObjects, 'type');

// 3D Graphics
import * as THREE from 'three';
const scene = new THREE.Scene();

// WebGL Acceleration
import * as PIXI from 'pixi.js';
const pixiApp = new PIXI.Application();

// Real-time Communication
import io from 'socket.io-client';
const socket = io('http://localhost:3000');

// UI Frameworks
import React from 'react';
import { createRoot } from 'react-dom/client';

// And thousands more npm packages!
```

## 🏢 Enterprise Features

PowerScript includes enterprise-grade modules:

- **🌐 Server & Microservices**: Express-like server with clustering
- **☁️ Cloud Integration**: AWS, Azure, Google Cloud deployment
- **🤖 AI/ML Systems**: TensorFlow.js, OpenAI integration
- **📊 Analytics**: Data processing and visualization
- **🔒 Security**: Encryption, authentication, authorization
- **📡 Networking**: HTTP, WebSocket, real-time communication
- **💾 Database**: SQL, NoSQL, ORM integration
- **🎵 Multimedia**: Audio, video, canvas rendering

## 🎯 Why Choose PowerScript?

### For ActionScript 3 Developers:
- **Familiar Syntax**: Display lists, events, graphics API work exactly like AS3
- **Easy Migration**: Existing AS3 knowledge transfers directly
- **Modern Platform**: No Flash dependency, runs in browsers and Node.js

### For TypeScript/JavaScript Developers:
- **Type Safety**: Strong typing with excellent IDE support
- **Modern Features**: ES6+, async/await, modules, and more
- **npm Ecosystem**: Access to millions of packages

### For Enterprise Teams:
- **Production Ready**: Comprehensive testing and documentation
- **Scalable Architecture**: Microservices, clustering, cloud deployment  
- **Full Stack**: Frontend, backend, AI, database integration

## 🚀 Getting Started

```bash
# Install PowerScript
npm install powerscript

# Create a new project
npx create-powerscript-app my-game

# Start coding with AS3 style!
```

```typescript
import { Stage, Sprite } from 'powerscript';

const stage = new Stage(800, 600);
const sprite = new Sprite();

sprite.graphics.beginFill(0xFF0000);
sprite.graphics.drawCircle(0, 0, 50);
sprite.graphics.endFill();

sprite.x = 400;
sprite.y = 300;

stage.addChild(sprite);
```

PowerScript brings the joy of ActionScript 3 programming to the modern TypeScript ecosystem! 🎮✨

---

**PowerScript = ActionScript 3 Programming Style + TypeScript Power + npm Ecosystem**