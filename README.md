# PowerScript Documentation

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![ActionScript Style](https://img.shields.io/badge/ActionScript-Style-red?style=for-the-badge)](https://en.wikipedia.org/wiki/ActionScript)

**PowerScript** is a comprehensive TypeScript/Node.js framework that brings ActionScript 3.0 style development to modern JavaScript with built-in AI/ML capabilities, distributed systems support, and cloud integration.

## 🚀 Quick Start

```javascript
const { PowerScript, Timer, Logger, Vector } = require('powerscript');

// ActionScript-style development
const ps = new PowerScript();
const timer = new Timer(1000);
const logger = new Logger();
const vector = new Vector();

// Modern AI/ML capabilities
const ai = ps.getAI();
const security = ps.getSecurity();
```

## 📚 Documentation Structure

### 🏗️ Core Modules
- **[Core](./modules/core.md)** - AS3-style base classes and utilities
- **[Compiler](./modules/compiler.md)** - ActionScript-like compilation and code transformation
- **[Patterns](./modules/patterns.md)** - Design patterns and architectural utilities

### 🤖 AI & Machine Learning
- **[AI](./modules/ai.md)** - Basic AI capabilities and integrations
- **[AI Enhanced](./modules/ai-enhanced.md)** - Advanced AI with local model support
- **[Machine Learning](./modules/ml.md)** - ML algorithms and model management

### 🔒 Security & Authentication
- **[Security](./modules/security.md)** - Enterprise-grade security features
- **[Security Enhanced](./modules/security-enhanced.md)** - Advanced security with sandboxing
- **[Security Simple](./modules/security-simple.md)** - Lightweight security utilities

### 🌐 Networking & Communication
- **[Networking](./modules/networking.md)** - AS3-style networking and HTTP clients
- **[Networking Enhanced](./modules/networking-enhanced.md)** - Advanced networking with P2P support

### 🎨 Graphics & Multimedia
- **[Graphics](./modules/graphics.md)** - 2D/3D graphics and Canvas manipulation
- **[Multimedia](./modules/multimedia.md)** - Audio, video, and media processing

### 💾 Data & Storage
- **[Database](./modules/database.md)** - Multi-database support and ORM
- **[Filesystem](./modules/filesystem.md)** - File operations and storage management

### ⚡ System & Performance
- **[Concurrency](./modules/concurrency.md)** - Multi-threading and parallel processing
- **[Analytics](./modules/analytics.md)** - Performance monitoring and metrics

### ☁️ Cloud & Distributed
- **[Cloud](./modules/cloud.md)** - Multi-cloud provider support and deployment

## 🎯 Usage Guides

### Getting Started
- **[Installation Guide](./guides/installation.md)** - Setup and dependencies
- **[ActionScript Style Guide](./guides/actionscript-style.md)** - Writing AS3-style code
- **[Migration from AS3](./guides/migration.md)** - Porting ActionScript projects

### Development Patterns
- **[Project Structure](./guides/project-structure.md)** - Organizing PowerScript projects
- **[Best Practices](./guides/best-practices.md)** - Recommended coding patterns
- **[Performance Optimization](./guides/performance.md)** - Optimization techniques

### Integration
- **[Framework Integration](./guides/integration.md)** - Using with Express, Electron, etc.
- **[Deployment](./guides/deployment.md)** - Production deployment strategies
- **[Testing](./guides/testing.md)** - Testing PowerScript applications

## 📖 Examples

### Basic Examples
- **[Hello World](./examples/hello-world.md)** - Your first PowerScript application
- **[AS3 Porting](./examples/as3-porting.md)** - Converting ActionScript code
- **[Event Handling](./examples/events.md)** - Event-driven programming

### AI & ML Examples
- **[Text Generation](./examples/ai-text.md)** - AI-powered text generation
- **[Image Processing](./examples/ai-images.md)** - AI image manipulation
- **[ML Model Training](./examples/ml-training.md)** - Training custom models

### Advanced Examples
- **[Real-time Chat](./examples/realtime-chat.md)** - WebSocket-based chat application
- **[Game Development](./examples/game-dev.md)** - Creating games with PowerScript
- **[Microservices](./examples/microservices.md)** - Building distributed services

## 🔧 API Reference

### Core Classes
| Class | Description | ActionScript Equivalent |
|-------|-------------|------------------------|
| `Vector` | Dynamic array with AS3 methods | `Vector.<T>` |
| `ByteArray` | Binary data manipulation | `ByteArray` |
| `Timer` | Time-based operations | `Timer` |
| `EventDispatcher` | Event handling system | `EventDispatcher` |
| `Logger` | Logging and debugging | `trace()` |

### Module APIs
- **[Complete API Reference](./api/README.md)** - Full API documentation
- **[Type Definitions](./api/types.md)** - TypeScript type definitions
- **[Error Codes](./api/errors.md)** - Error handling reference

## 🛠️ Development

### Contributing
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- **[Code Standards](./CODE_STANDARDS.md)** - Coding conventions
- **[Testing Guide](./TESTING.md)** - Testing requirements

### Architecture
- **[Architecture Overview](./architecture/README.md)** - System architecture
- **[Module Design](./architecture/modules.md)** - Module structure
- **[Extension Points](./architecture/extensions.md)** - Extending PowerScript

## 📊 Compatibility

| Feature | Node.js | Browser | Electron | React Native |
|---------|---------|---------|----------|--------------|
| Core | ✅ | ✅ | ✅ | ✅ |
| AI/ML | ✅ | 🔶* | ✅ | 🔶* |
| Security | ✅ | 🔶* | ✅ | 🔶* |
| Networking | ✅ | 🔶* | ✅ | ✅ |
| Graphics | ✅ | ✅ | ✅ | ✅ |
| Database | ✅ | ❌ | ✅ | 🔶* |

*🔶 = Limited functionality or requires additional setup*

## 📋 Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **TypeScript**: 4.8.0 or higher (for development)

### Optional Dependencies
- **Python**: 3.8+ (for AI/ML features)
- **Docker**: Latest (for cloud deployment)
- **Redis**: 6.0+ (for advanced caching)

## 📝 License

PowerScript is released under the MIT License. See [LICENSE](../LICENSE) for details.

## 🤝 Community

- **GitHub**: [PowerScript Repository](https://github.com/PowerScript/PowerScript)
- **Discord**: [PowerScript Community](https://discord.gg/powerscript)
- **Stack Overflow**: Tag your questions with `powerscript`

---

*Built with ❤️ for ActionScript developers transitioning to modern JavaScript*