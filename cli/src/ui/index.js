"use strict";
/**
 * PowerScript UI & Cross-Platform Support Module
 * CLI UI components, Electron support, and mobile development capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptUI = exports.CrossPlatform = exports.CLIApp = exports.HBox = exports.VBox = exports.Input = exports.ProgressBar = exports.List = exports.Box = exports.Text = exports.Component = void 0;
const events_1 = require("events");
const readline = require("readline");
const process = require("process");
// Base component class
class Component extends events_1.EventEmitter {
    constructor(props = {}) {
        super();
        this.children = [];
        this.mounted = false;
        this.props = { visible: true, enabled: true, ...props };
    }
    mount(parent) {
        this.parent = parent;
        this.mounted = true;
        this.emit('mounted');
    }
    unmount() {
        this.mounted = false;
        this.parent = undefined;
        this.emit('unmounted');
    }
    addChild(child) {
        this.children.push(child);
        child.mount(this);
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
            child.unmount();
        }
    }
    findChild(id) {
        return this.children.find(child => child.props.id === id);
    }
    update(props) {
        this.props = { ...this.props, ...props };
        this.emit('updated', props);
    }
    show() {
        this.update({ visible: true });
    }
    hide() {
        this.update({ visible: false });
    }
    enable() {
        this.update({ enabled: true });
    }
    disable() {
        this.update({ enabled: false });
    }
}
exports.Component = Component;
// CLI Components
class Text extends Component {
    constructor(text, props = {}) {
        super(props);
        this.text = text;
        this.color = props.color;
        this.bold = props.bold;
        this.italic = props.italic;
    }
    render() {
        if (!this.props.visible)
            return '';
        let output = this.text;
        if (this.bold)
            output = `\x1b[1m${output}\x1b[0m`;
        if (this.italic)
            output = `\x1b[3m${output}\x1b[0m`;
        if (this.color) {
            const colors = {
                red: '\x1b[31m',
                green: '\x1b[32m',
                yellow: '\x1b[33m',
                blue: '\x1b[34m',
                magenta: '\x1b[35m',
                cyan: '\x1b[36m',
                white: '\x1b[37m',
                gray: '\x1b[90m'
            };
            const colorCode = colors[this.color] || '';
            output = `${colorCode}${output}\x1b[0m`;
        }
        return output;
    }
    setText(text) {
        this.text = text;
        this.emit('textChanged', text);
    }
}
exports.Text = Text;
class Box extends Component {
    constructor(props = {}) {
        super(props);
        this.border = true;
        this.padding = 1;
        this.title = props.title;
        this.border = props.border ?? true;
        this.padding = props.padding ?? 1;
    }
    render() {
        if (!this.props.visible)
            return '';
        const width = 40; // Default width
        const content = this.children.map(child => child.render()).join('\n');
        const lines = content ? content.split('\n') : [''];
        if (!this.border) {
            return lines.map(line => ' '.repeat(this.padding) + line).join('\n');
        }
        let output = '';
        // Top border
        if (this.title) {
            const titlePadding = Math.max(0, width - this.title.length - 4);
            output += `┌─ ${this.title} ${'─'.repeat(titlePadding)}┐\n`;
        }
        else {
            output += `┌${'─'.repeat(width - 2)}┐\n`;
        }
        // Content
        lines.forEach(line => {
            const padded = ' '.repeat(this.padding) + line + ' '.repeat(this.padding);
            const truncated = padded.length > width - 2 ? padded.substring(0, width - 2) : padded;
            const rightPadding = ' '.repeat(Math.max(0, width - 2 - truncated.length));
            output += `│${truncated}${rightPadding}│\n`;
        });
        // Bottom border
        output += `└${'─'.repeat(width - 2)}┘`;
        return output;
    }
}
exports.Box = Box;
class List extends Component {
    constructor(items = [], props = {}) {
        super(props);
        this.items = [];
        this.selectedIndex = 0;
        this.multiSelect = false;
        this.selectedItems = new Set();
        this.items = items;
        this.multiSelect = props.multiSelect ?? false;
    }
    render() {
        if (!this.props.visible)
            return '';
        return this.items.map((item, index) => {
            let prefix = '  ';
            if (this.multiSelect) {
                prefix = this.selectedItems.has(index) ? '✓ ' : '  ';
            }
            else if (index === this.selectedIndex) {
                prefix = '► ';
            }
            const color = index === this.selectedIndex ? 'cyan' : undefined;
            const text = new Text(`${prefix}${item}`, { color });
            return text.render();
        }).join('\n');
    }
    addItem(item) {
        this.items.push(item);
        this.emit('itemAdded', item);
    }
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items.splice(index, 1)[0];
            this.emit('itemRemoved', item, index);
        }
    }
    selectNext() {
        if (this.selectedIndex < this.items.length - 1) {
            this.selectedIndex++;
            this.emit('selectionChanged', this.selectedIndex);
        }
    }
    selectPrevious() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.emit('selectionChanged', this.selectedIndex);
        }
    }
    toggleSelection() {
        if (this.multiSelect) {
            if (this.selectedItems.has(this.selectedIndex)) {
                this.selectedItems.delete(this.selectedIndex);
            }
            else {
                this.selectedItems.add(this.selectedIndex);
            }
            this.emit('multiSelectionChanged', Array.from(this.selectedItems));
        }
    }
    getSelected() {
        if (this.multiSelect) {
            return Array.from(this.selectedItems).map(index => this.items[index]);
        }
        return this.items[this.selectedIndex];
    }
}
exports.List = List;
class ProgressBar extends Component {
    constructor(props = {}) {
        super(props);
        this.value = 0;
        this.max = 100;
        this.width = 30;
        this.showPercentage = true;
        this.value = props.value ?? 0;
        this.max = props.max ?? 100;
        this.width = props.width ?? 30;
        this.showPercentage = props.showPercentage ?? true;
    }
    render() {
        if (!this.props.visible)
            return '';
        const percentage = Math.min(100, Math.max(0, (this.value / this.max) * 100));
        const filled = Math.floor((percentage / 100) * this.width);
        const empty = this.width - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const percentText = this.showPercentage ? ` ${percentage.toFixed(1)}%` : '';
        return `[${bar}]${percentText}`;
    }
    setValue(value) {
        this.value = Math.max(0, Math.min(this.max, value));
        this.emit('valueChanged', this.value);
    }
    increment(amount = 1) {
        this.setValue(this.value + amount);
    }
}
exports.ProgressBar = ProgressBar;
class Input extends Component {
    constructor(props = {}) {
        super(props);
        this.value = '';
        this.placeholder = '';
        this.password = false;
        this.placeholder = props.placeholder ?? '';
        this.password = props.password ?? false;
        this.value = props.defaultValue ?? '';
    }
    render() {
        if (!this.props.visible)
            return '';
        const displayValue = this.password ? '*'.repeat(this.value.length) : this.value;
        const prompt = this.placeholder ? `${this.placeholder}: ` : '> ';
        return `${prompt}${displayValue}`;
    }
    async prompt() {
        return new Promise((resolve) => {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const promptText = this.placeholder ? `${this.placeholder}: ` : '> ';
            this.rl.question(promptText, (answer) => {
                this.value = answer;
                this.rl?.close();
                this.emit('valueChanged', this.value);
                resolve(this.value);
            });
        });
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = value;
        this.emit('valueChanged', this.value);
    }
}
exports.Input = Input;
// Layout components
class VBox extends Component {
    constructor(props = {}) {
        super(props);
        this.spacing = 1;
        this.spacing = props.spacing ?? 1;
    }
    render() {
        if (!this.props.visible)
            return '';
        return this.children
            .filter(child => child.props.visible)
            .map(child => child.render())
            .join('\n'.repeat(this.spacing));
    }
}
exports.VBox = VBox;
class HBox extends Component {
    constructor(props = {}) {
        super(props);
        this.spacing = 2;
        this.spacing = props.spacing ?? 2;
    }
    render() {
        if (!this.props.visible)
            return '';
        const renderedChildren = this.children
            .filter(child => child.props.visible)
            .map(child => child.render().split('\n'));
        if (renderedChildren.length === 0)
            return '';
        const maxLines = Math.max(...renderedChildren.map(lines => lines.length));
        const result = [];
        for (let i = 0; i < maxLines; i++) {
            const line = renderedChildren
                .map(lines => lines[i] || '')
                .join(' '.repeat(this.spacing));
            result.push(line);
        }
        return result.join('\n');
    }
}
exports.HBox = HBox;
// Application framework
class CLIApp extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.running = false;
        this.config = {
            theme: 'default',
            enableColors: true,
            enableAnimations: false,
            responsive: true,
            ...config
        };
    }
    setRoot(component) {
        this.root = component;
        component.mount();
    }
    render() {
        if (!this.root)
            return;
        // Clear screen
        console.clear();
        // Render component tree
        const output = this.root.render();
        console.log(output);
    }
    async run() {
        this.running = true;
        this.emit('started');
        // Initial render
        this.render();
        // Keep app running
        while (this.running) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.emit('stopped');
    }
    stop() {
        this.running = false;
    }
    // Utility methods for common UI patterns
    static async confirm(message) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(`${message} (y/N): `, (answer) => {
                rl.close();
                resolve(answer.toLowerCase().startsWith('y'));
            });
        });
    }
    static async select(message, choices) {
        const list = new List(choices);
        console.log(message);
        console.log(list.render());
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            let selectedIndex = 0;
            const handleKeypress = (str, key) => {
                if (key.name === 'up' && selectedIndex > 0) {
                    selectedIndex--;
                }
                else if (key.name === 'down' && selectedIndex < choices.length - 1) {
                    selectedIndex++;
                }
                else if (key.name === 'return') {
                    rl.close();
                    resolve(choices[selectedIndex]);
                    return;
                }
                // Re-render list
                process.stdout.moveCursor(0, -choices.length - 1);
                process.stdout.clearScreenDown();
                console.log(message);
                const updatedList = new List(choices);
                updatedList['selectedIndex'] = selectedIndex;
                console.log(updatedList.render());
            };
            process.stdin.setRawMode(true);
            process.stdin.on('keypress', handleKeypress);
            readline.emitKeypressEvents(process.stdin);
        });
    }
    static async input(message, options = {}) {
        const input = new Input({
            placeholder: message,
            password: options.password,
            defaultValue: options.defaultValue
        });
        return input.prompt();
    }
}
exports.CLIApp = CLIApp;
// Cross-platform utilities
class CrossPlatform {
    static get platform() {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            if (window.process && window.process.type) {
                return 'electron';
            }
            return 'web';
        }
        if (typeof process !== 'undefined' && process.versions?.node) {
            return 'node';
        }
        return 'mobile'; // Fallback for React Native, etc.
    }
    static get isElectron() {
        return this.platform === 'electron';
    }
    static get isBrowser() {
        return this.platform === 'web';
    }
    static get isNode() {
        return this.platform === 'node';
    }
    static get isMobile() {
        return this.platform === 'mobile';
    }
    static async openExternal(url) {
        if (this.isElectron) {
            // @ts-ignore
            const { shell } = require('electron');
            await shell.openExternal(url);
        }
        else if (this.isBrowser) {
            window.open(url, '_blank');
        }
        else if (this.isNode) {
            const { spawn } = require('child_process');
            const command = process.platform === 'win32' ? 'start' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';
            spawn(command, [url]);
        }
    }
    static async showNotification(title, body) {
        if (this.isElectron) {
            // @ts-ignore
            const { Notification } = require('electron');
            new Notification({ title, body }).show();
        }
        else if (this.isBrowser && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body });
            }
            else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            }
        }
        else {
            // Fallback to console for CLI environments
            console.log(`📢 ${title}: ${body}`);
        }
    }
    static getSystemInfo() {
        const info = {
            platform: this.platform,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
        };
        if (this.isNode || this.isElectron) {
            info.nodeVersion = process.version;
            info.arch = process.arch;
            info.osType = process.platform;
            info.cpus = require('os').cpus().length;
            info.memory = Math.round(require('os').totalmem() / 1024 / 1024 / 1024);
        }
        return info;
    }
}
exports.CrossPlatform = CrossPlatform;
// Main PowerScript UI class
class PowerScriptUI extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.apps = new Map();
        this.config = config;
    }
    createApp(id, config) {
        const app = new CLIApp({ ...this.config, ...config });
        this.apps.set(id, app);
        return app;
    }
    getApp(id) {
        return this.apps.get(id);
    }
    removeApp(id) {
        const app = this.apps.get(id);
        if (app) {
            app.stop();
            this.apps.delete(id);
            return true;
        }
        return false;
    }
    // Component factory methods
    text(content, options) {
        return new Text(content, options);
    }
    box(options) {
        return new Box(options);
    }
    list(items, options) {
        return new List(items, options);
    }
    progressBar(options) {
        return new ProgressBar(options);
    }
    inputComponent(options) {
        return new Input(options);
    }
    vbox(options) {
        return new VBox(options);
    }
    hbox(options) {
        return new HBox(options);
    }
    // Utility methods
    get platform() {
        return CrossPlatform.platform;
    }
    get systemInfo() {
        return CrossPlatform.getSystemInfo();
    }
    async confirm(message) {
        return CLIApp.confirm(message);
    }
    async select(message, choices) {
        return CLIApp.select(message, choices);
    }
    async promptInput(message, options) {
        return CLIApp.input(message, options);
    }
    async showNotification(title, body) {
        return CrossPlatform.showNotification(title, body);
    }
    async openExternal(url) {
        return CrossPlatform.openExternal(url);
    }
}
exports.PowerScriptUI = PowerScriptUI;
// Export everything
exports.default = PowerScriptUI;
