# PowerScript Core Module

## Abstract

The PowerScript Core module provides the foundational runtime environment, event system, and utility classes that enable PowerScript-style development in Node.js environments.

## Table of Contents

1. [Overview](#overview)
2. [Runtime Environment](#runtime-environment)
3. [Event System](#event-system)
4. [Core Classes](#core-classes)
5. [Utilities](#utilities)
6. [API Reference](#api-reference)
7. [Examples](#examples)

## 1. Overview

### 1.1 Purpose

The Core module serves as the foundation for all PowerScript functionality, providing:

- Runtime environment management
- Event-driven architecture
- PowerScript-style utility classes
- Error handling and logging
- Module lifecycle management

### 1.2 Dependencies

- Node.js 18.0.0 or higher
- TypeScript 4.5 or higher (for type definitions)

### 1.3 Import Syntax

```powerscript
// Import the core module
import { PowerScriptCore, EventDispatcher, Timer, Vector } from 'powerscript/core';

// Or import through main PowerScript class
import { PowerScript } from 'powerscript';
const core = PowerScript.runtime;
```

## 2. Runtime Environment

### 2.1 PowerScriptCore Class

The `PowerScriptCore` class manages the overall runtime environment and module lifecycle.

#### 2.1.1 Interface Definition

```typescript
interface PowerScriptCoreConfig {
    modules?: string[];
    logging?: {
        level: 'debug' | 'info' | 'warn' | 'error';
        output?: 'console' | 'file' | 'both';
    };
    performance?: {
        monitoring: boolean;
        metrics: boolean;
    };
}

class PowerScriptCore extends EventDispatcher {
    constructor()
    
    async initialize(config?: PowerScriptCoreConfig): Promise<void>
    async shutdown(): Promise<void>
    
    getConfig(): PowerScriptCoreConfig
    async updateConfig(config: Partial<PowerScriptCoreConfig>): Promise<void>
    
    getVersion(): string
    getRuntime(): PowerScriptRuntime
    hasFeature(feature: string): boolean
    
    async loadModule(name: string, module: any): Promise<void>
    async unloadModule(name: string): Promise<void>
    getModule<T>(name: string): T | undefined
    getModules(): string[]
    
    getContainer(): DependencyContainer
    getLogger(): Logger
    getErrorManager(): ErrorManager
    
    get initialized(): boolean
    get uptime(): number
}
```

#### 2.1.2 Initialization Example

```powerscript
import { PowerScriptCore } from 'powerscript';

const core = new PowerScriptCore();

await core.initialize({
    modules: ['ai', 'graphics', 'database'],
    logging: {
        level: 'info',
        output: 'console'
    },
    performance: {
        monitoring: true,
        metrics: true
    }
});

console.log('PowerScript Core initialized');
console.log('Version:', core.getVersion());
console.log('Uptime:', core.uptime, 'ms');
```

### 2.2 Runtime Information

```powerscript
interface PowerScriptRuntime {
    version: string;
    buildDate: Date;
    platform: string;
    nodeVersion: string;
    modules: {
        loaded: string[];
        available: string[];
    };
    performance: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
}

// Get runtime information
const runtime = core.getRuntime();
console.log('Platform:', runtime.platform);
console.log('Loaded modules:', runtime.modules.loaded);
```

## 3. Event System

### 3.1 EventDispatcher Class

The `EventDispatcher` class provides the foundation for event-driven programming in PowerScript.

#### 3.1.1 Interface Definition

```typescript
type EventListener = (event: PowerScriptEvent) => void;

class EventDispatcher {
    addEventListener(type: string, listener: EventListener): void
    removeEventListener(type: string, listener: EventListener): void
    dispatchEvent(event: PowerScriptEvent): boolean
    hasEventListener(type: string): boolean
    willTrigger(type: string): boolean
}

interface PowerScriptEvent {
    type: string;
    target: EventDispatcher;
    currentTarget: EventDispatcher;
    data?: any;
    timestamp: Date;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
```

#### 3.1.2 Event Usage Example

```powerscript
import { EventDispatcher } from 'powerscript';

class MyComponent extends EventDispatcher {
    private value: number = 0;
    
    setValue(newValue: number): void {
        const oldValue = this.value;
        this.value = newValue;
        
        // Dispatch value change event
        this.dispatchEvent({
            type: 'valueChange',
            target: this,
            currentTarget: this,
            data: { oldValue, newValue },
            timestamp: new Date(),
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    }
}

const component = new MyComponent();

// Listen for value changes
component.addEventListener('valueChange', (event) => {
    console.log('Value changed:', event.data);
});

component.setValue(42); // Triggers the event
```

## 4. Core Classes

### 4.1 Timer Class

The `Timer` class provides PowerScript-style timer functionality.

#### 4.1.1 Interface Definition

```typescript
class Timer extends EventDispatcher {
    constructor(delay: number, repeatCount?: number)
    
    start(): void
    stop(): void
    reset(): void
    
    get delay(): number
    set delay(value: number)
    
    get repeatCount(): number
    set repeatCount(value: number)
    
    get currentCount(): number
    get running(): boolean
    
    static delayedCall(delay: number, callback: Function, ...args: any[]): Timer
}
```

#### 4.1.2 Timer Usage Example

```powerscript
import { Timer } from 'powerscript';

// Create a timer that fires every 1000ms, 5 times
const timer = new Timer(1000, 5);

timer.addEventListener('timer', (event) => {
    console.log('Timer tick:', timer.currentCount);
});

timer.addEventListener('timerComplete', (event) => {
    console.log('Timer complete!');
});

timer.start();

// One-time delayed call
Timer.delayedCall(2000, () => {
    console.log('Delayed execution after 2 seconds');
});
```

### 4.2 Vector Class

The `Vector` class provides a dynamic array implementation with PowerScript-style methods.

#### 4.2.1 Interface Definition

```typescript
class Vector<T> {
    constructor(length?: number, fixed?: boolean)
    
    push(...items: T[]): number
    pop(): T | undefined
    shift(): T | undefined
    unshift(...items: T[]): number
    
    insertAt(index: number, item: T): void
    removeAt(index: number): T
    indexOf(item: T, fromIndex?: number): number
    lastIndexOf(item: T, fromIndex?: number): number
    
    slice(startIndex?: number, endIndex?: number): Vector<T>
    splice(startIndex: number, deleteCount?: number, ...items: T[]): Vector<T>
    
    concat(...vectors: Vector<T>[]): Vector<T>
    join(separator?: string): string
    reverse(): Vector<T>
    sort(compareFunction?: (a: T, b: T) => number): Vector<T>
    
    forEach(callback: (item: T, index: number, vector: Vector<T>) => void): void
    map<U>(callback: (item: T, index: number, vector: Vector<T>) => U): Vector<U>
    filter(callback: (item: T, index: number, vector: Vector<T>) => boolean): Vector<T>
    
    get length(): number
    set length(value: number)
    
    get fixed(): boolean
    set fixed(value: boolean)
}
```

#### 4.2.2 Vector Usage Example

```powerscript
import { Vector } from 'powerscript';

// Create a vector of numbers
const numbers = new Vector<number>();

// Add items
numbers.push(1, 2, 3, 4, 5);
console.log('Length:', numbers.length); // 5

// Insert at specific index
numbers.insertAt(2, 10);
console.log('After insert:', numbers.toString()); // "1,2,10,3,4,5"

// Use functional methods
const doubled = numbers.map(x => x * 2);
const evens = numbers.filter(x => x % 2 === 0);

console.log('Doubled:', doubled.toString());
console.log('Evens:', evens.toString());

// Fixed-size vector
const fixedVector = new Vector<string>(3, true);
fixedVector[0] = "Hello";
fixedVector[1] = "World";
fixedVector[2] = "PowerScript";
// fixedVector.push("Extra"); // Would throw error - fixed size
```

### 4.3 ByteArray Class

The `ByteArray` class provides binary data manipulation capabilities.

#### 4.3.1 Interface Definition

```typescript
enum Endian {
    BIG_ENDIAN = 'bigEndian',
    LITTLE_ENDIAN = 'littleEndian'
}

class ByteArray {
    constructor(buffer?: ArrayBuffer)
    
    readBoolean(): boolean
    readByte(): number
    readUnsignedByte(): number
    readShort(): number
    readUnsignedShort(): number
    readInt(): number
    readUnsignedInt(): number
    readFloat(): number
    readDouble(): number
    readUTF(): string
    readUTFBytes(length: number): string
    
    writeBoolean(value: boolean): void
    writeByte(value: number): void
    writeShort(value: number): void
    writeInt(value: number): void
    writeFloat(value: number): void
    writeDouble(value: number): void
    writeUTF(value: string): void
    writeUTFBytes(value: string): void
    
    readBytes(bytes: ByteArray, offset?: number, length?: number): void
    writeBytes(bytes: ByteArray, offset?: number, length?: number): void
    
    clear(): void
    compress(): void
    uncompress(): void
    
    get length(): number
    set length(value: number)
    
    get position(): number
    set position(value: number)
    
    get bytesAvailable(): number
    get endian(): Endian
    set endian(value: Endian)
}
```

#### 4.3.2 ByteArray Usage Example

```powerscript
import { ByteArray, Endian } from 'powerscript';

// Create a new ByteArray
const data = new ByteArray();

// Write various data types
data.writeUTF("PowerScript");
data.writeInt(12345);
data.writeFloat(3.14159);
data.writeBoolean(true);

console.log('Data length:', data.length);

// Reset position to read from beginning
data.position = 0;

// Read the data back
const text = data.readUTF();
const number = data.readInt();
const pi = data.readFloat();
const flag = data.readBoolean();

console.log('Read values:', { text, number, pi, flag });

// Work with binary data
const binaryData = new ByteArray();
binaryData.endian = Endian.BIG_ENDIAN;

binaryData.writeByte(0xFF);
binaryData.writeByte(0x00);
binaryData.writeByte(0xAA);

// Convert to Node.js Buffer
const buffer = Buffer.from(binaryData.buffer);
console.log('Binary data:', buffer);
```

## 5. Utilities

### 5.1 PowerScript Utility Classes

The core module provides enhanced utility classes with PowerScript-style APIs:

```powerscript
import { PSMath, PSArray, PSVector, PSByteArray } from 'powerscript';

// Enhanced Math utilities
const random = PSMath.random(); // 0.0 to 1.0
const randomInt = PSMath.randomInt(1, 100); // 1 to 100
const clamped = PSMath.clamp(15, 0, 10); // 10

// Array utilities
const array = [1, 2, 3, 4, 5];
PSArray.shuffle(array); // Randomly shuffle array
const unique = PSArray.unique([1, 2, 2, 3, 3, 4]); // [1, 2, 3, 4]

// Vector utilities (static methods)
const vec1 = { x: 3, y: 4 };
const vec2 = { x: 1, y: 1 };
const distance = PSVector.distance(vec1, vec2);
const normalized = PSVector.normalize(vec1);

// ByteArray utilities
const compressed = PSByteArray.compress(data);
const decompressed = PSByteArray.uncompress(compressed);
```

### 5.2 Configuration Management

```powerscript
import { ConfigLoader } from 'powerscript';

// Load configuration from various sources
const config = new ConfigLoader();

// Load from JSON file
await config.loadFromFile('./config.json');

// Load from environment variables
config.loadFromEnv('POWERSCRIPT_');

// Load from object
config.loadFromObject({
    database: {
        host: 'localhost',
        port: 5432
    }
});

// Access configuration values
const dbHost = config.get('database.host');
const dbPort = config.get('database.port', 3306); // with default

// Watch for configuration changes
config.watch('database.host', (newValue, oldValue) => {
    console.log('Database host changed:', oldValue, '->', newValue);
});
```

### 5.3 Dependency Injection

```powerscript
import { DependencyContainer } from 'powerscript';

// Create container
const container = new DependencyContainer();

// Register services
container.register('logger', Logger);
container.register('database', DatabaseService, { singleton: true });

// Register with factory
container.registerFactory('httpClient', () => {
    return new HttpClient({ timeout: 5000 });
});

// Resolve dependencies
const logger = container.resolve<Logger>('logger');
const db = container.resolve<DatabaseService>('database');

// Inject dependencies into class
class UserService {
    constructor(
        private logger: Logger,
        private database: DatabaseService
    ) {}
}

container.register('userService', UserService);
const userService = container.resolve<UserService>('userService');
```

## 6. API Reference

### 6.1 Error Types

```typescript
class PowerScriptError extends Error {
    constructor(message: string, code?: string, cause?: Error)
    
    readonly code: string;
    readonly cause?: Error;
    readonly timestamp: Date;
}

class PowerScriptRuntimeError extends PowerScriptError {}
class PowerScriptConfigError extends PowerScriptError {}
class PowerScriptModuleError extends PowerScriptError {}
```

### 6.2 Logger Interface

```typescript
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
```

## 7. Examples

### 7.1 Complete Core Module Example

```powerscript
import { 
    PowerScriptCore, 
    EventDispatcher, 
    Timer, 
    Vector, 
    ByteArray 
} from 'powerscript';

class PowerScriptApplication extends EventDispatcher {
    private core: PowerScriptCore;
    private gameLoop: Timer;
    private entities: Vector<GameEntity>;
    
    constructor() {
        super();
        this.core = new PowerScriptCore();
        this.entities = new Vector<GameEntity>();
    }
    
    async initialize(): Promise<void> {
        // Initialize core runtime
        await this.core.initialize({
            logging: { level: 'info' },
            performance: { monitoring: true }
        });
        
        // Set up game loop
        this.gameLoop = new Timer(16); // ~60 FPS
        this.gameLoop.addEventListener('timer', () => this.update());
        
        console.log('Application initialized');
        this.dispatchEvent({
            type: 'initialized',
            target: this,
            currentTarget: this,
            timestamp: new Date(),
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    }
    
    start(): void {
        this.gameLoop.start();
        console.log('Application started');
    }
    
    private update(): void {
        // Update all entities
        this.entities.forEach(entity => entity.update());
        
        // Dispatch update event
        this.dispatchEvent({
            type: 'update',
            target: this,
            currentTarget: this,
            data: { frameCount: this.gameLoop.currentCount },
            timestamp: new Date(),
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    }
    
    addEntity(entity: GameEntity): void {
        this.entities.push(entity);
    }
    
    async shutdown(): Promise<void> {
        this.gameLoop.stop();
        await this.core.shutdown();
        console.log('Application shutdown complete');
    }
}

interface GameEntity {
    update(): void;
}

// Usage
const app = new PowerScriptApplication();

app.addEventListener('initialized', () => {
    console.log('App is ready!');
    app.start();
});

app.addEventListener('update', (event) => {
    if (event.data.frameCount % 60 === 0) {
        console.log('One second elapsed');
    }
});

// Initialize and run
await app.initialize();
```

### 7.2 Binary Data Processing Example

```powerscript
import { ByteArray, Endian } from 'powerscript';

// Create a binary file format parser
class CustomFileFormat {
    static parse(buffer: ArrayBuffer): CustomFile {
        const data = new ByteArray(buffer);
        data.endian = Endian.LITTLE_ENDIAN;
        
        // Read header
        const magic = data.readUTFBytes(4);
        if (magic !== 'PSFT') {
            throw new Error('Invalid file format');
        }
        
        const version = data.readUnsignedShort();
        const fileSize = data.readUnsignedInt();
        const numSections = data.readUnsignedShort();
        
        // Read sections
        const sections: FileSection[] = [];
        for (let i = 0; i < numSections; i++) {
            const sectionType = data.readUnsignedByte();
            const sectionSize = data.readUnsignedInt();
            const sectionData = new ByteArray();
            data.readBytes(sectionData, 0, sectionSize);
            
            sections.push({
                type: sectionType,
                size: sectionSize,
                data: sectionData
            });
        }
        
        return {
            version,
            fileSize,
            sections
        };
    }
    
    static create(file: CustomFile): ByteArray {
        const data = new ByteArray();
        data.endian = Endian.LITTLE_ENDIAN;
        
        // Write header
        data.writeUTFBytes('PSFT');
        data.writeUnsignedShort(file.version);
        data.writeUnsignedInt(file.fileSize);
        data.writeUnsignedShort(file.sections.length);
        
        // Write sections
        file.sections.forEach(section => {
            data.writeByte(section.type);
            data.writeUnsignedInt(section.size);
            data.writeBytes(section.data);
        });
        
        return data;
    }
}

interface CustomFile {
    version: number;
    fileSize: number;
    sections: FileSection[];
}

interface FileSection {
    type: number;
    size: number;
    data: ByteArray;
}
```

## Performance Considerations

### Memory Management

- Use `Vector<T>` for dynamic arrays when you need PowerScript-style methods
- Prefer native JavaScript arrays for simple operations
- Always call `clear()` on `ByteArray` instances when done to free memory

### Event System Performance

- Remove event listeners when no longer needed to prevent memory leaks
- Use event delegation for handling many similar events
- Consider using weak references for temporary event handlers

### Timer Usage

- Stop timers when no longer needed
- Use `Timer.delayedCall()` for one-time delayed execution
- Consider using `requestAnimationFrame` for animation loops in browser environments

## See Also

- [PowerScript Main Documentation](index.md)
- [AI Module Documentation](ai.md)
- [Graphics Module Documentation](graphics.md)
- [Complete API Reference](api-reference.md)

---

*PowerScript Core Module - Version 1.0.0*