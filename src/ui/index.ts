/**
 * PowerScript UI & Cross-Platform Support Module
 * CLI UI components, Electron support, and mobile development capabilities
 */

import { EventEmitter } from 'events';
import * as readline from 'readline';
import * as process from 'process';

// Core UI interfaces
export interface UIConfig {
  theme?: 'default' | 'dark' | 'light' | 'colorful';
  enableColors?: boolean;
  enableAnimations?: boolean;
  width?: number;
  height?: number;
  responsive?: boolean;
}

export interface ComponentProps {
  id?: string;
  className?: string;
  style?: Record<string, any>;
  visible?: boolean;
  enabled?: boolean;
  children?: Component[];
}

export interface LayoutOptions {
  direction?: 'horizontal' | 'vertical';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  spacing?: number;
  padding?: number | [number, number, number, number];
  margin?: number | [number, number, number, number];
}

// Base component class
export abstract class Component extends EventEmitter {
  public props: ComponentProps;
  protected children: Component[] = [];
  protected parent?: Component;
  protected mounted = false;

  constructor(props: ComponentProps = {}) {
    super();
    this.props = { visible: true, enabled: true, ...props };
  }

  abstract render(): string;

  mount(parent?: Component): void {
    this.parent = parent;
    this.mounted = true;
    this.emit('mounted');
  }

  unmount(): void {
    this.mounted = false;
    this.parent = undefined;
    this.emit('unmounted');
  }

  addChild(child: Component): void {
    this.children.push(child);
    child.mount(this);
  }

  removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.unmount();
    }
  }

  findChild(id: string): Component | undefined {
    return this.children.find(child => child.props.id === id);
  }

  update(props: Partial<ComponentProps>): void {
    this.props = { ...this.props, ...props };
    this.emit('updated', props);
  }

  show(): void {
    this.update({ visible: true });
  }

  hide(): void {
    this.update({ visible: false });
  }

  enable(): void {
    this.update({ enabled: true });
  }

  disable(): void {
    this.update({ enabled: false });
  }
}

// CLI Components
export class Text extends Component {
  private text: string;
  private color?: string;
  private bold?: boolean;
  private italic?: boolean;

  constructor(text: string, props: ComponentProps & { 
    color?: string; 
    bold?: boolean; 
    italic?: boolean; 
  } = {}) {
    super(props);
    this.text = text;
    this.color = props.color;
    this.bold = props.bold;
    this.italic = props.italic;
  }

  render(): string {
    if (!this.props.visible) return '';
    
    let output = this.text;
    
    if (this.bold) output = `\x1b[1m${output}\x1b[0m`;
    if (this.italic) output = `\x1b[3m${output}\x1b[0m`;
    if (this.color) {
      const colors: Record<string, string> = {
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

  setText(text: string): void {
    this.text = text;
    this.emit('textChanged', text);
  }
}

export class Box extends Component {
  private title?: string;
  private border = true;
  private padding = 1;

  constructor(props: ComponentProps & {
    title?: string;
    border?: boolean;
    padding?: number;
  } = {}) {
    super(props);
    this.title = props.title;
    this.border = props.border ?? true;
    this.padding = props.padding ?? 1;
  }

  render(): string {
    if (!this.props.visible) return '';

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
    } else {
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

export class List extends Component {
  private items: string[] = [];
  private selectedIndex = 0;
  private multiSelect = false;
  private selectedItems = new Set<number>();

  constructor(items: string[] = [], props: ComponentProps & {
    multiSelect?: boolean;
  } = {}) {
    super(props);
    this.items = items;
    this.multiSelect = props.multiSelect ?? false;
  }

  render(): string {
    if (!this.props.visible) return '';

    return this.items.map((item, index) => {
      let prefix = '  ';
      
      if (this.multiSelect) {
        prefix = this.selectedItems.has(index) ? '✓ ' : '  ';
      } else if (index === this.selectedIndex) {
        prefix = '► ';
      }

      const color = index === this.selectedIndex ? 'cyan' : undefined;
      const text = new Text(`${prefix}${item}`, { color });
      return text.render();
    }).join('\n');
  }

  addItem(item: string): void {
    this.items.push(item);
    this.emit('itemAdded', item);
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      const item = this.items.splice(index, 1)[0];
      this.emit('itemRemoved', item, index);
    }
  }

  selectNext(): void {
    if (this.selectedIndex < this.items.length - 1) {
      this.selectedIndex++;
      this.emit('selectionChanged', this.selectedIndex);
    }
  }

  selectPrevious(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.emit('selectionChanged', this.selectedIndex);
    }
  }

  toggleSelection(): void {
    if (this.multiSelect) {
      if (this.selectedItems.has(this.selectedIndex)) {
        this.selectedItems.delete(this.selectedIndex);
      } else {
        this.selectedItems.add(this.selectedIndex);
      }
      this.emit('multiSelectionChanged', Array.from(this.selectedItems));
    }
  }

  getSelected(): string | string[] {
    if (this.multiSelect) {
      return Array.from(this.selectedItems).map(index => this.items[index]);
    }
    return this.items[this.selectedIndex];
  }
}

export class ProgressBar extends Component {
  private value = 0;
  private max = 100;
  private width = 30;
  private showPercentage = true;

  constructor(props: ComponentProps & {
    value?: number;
    max?: number;
    width?: number;
    showPercentage?: boolean;
  } = {}) {
    super(props);
    this.value = props.value ?? 0;
    this.max = props.max ?? 100;
    this.width = props.width ?? 30;
    this.showPercentage = props.showPercentage ?? true;
  }

  render(): string {
    if (!this.props.visible) return '';

    const percentage = Math.min(100, Math.max(0, (this.value / this.max) * 100));
    const filled = Math.floor((percentage / 100) * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentText = this.showPercentage ? ` ${percentage.toFixed(1)}%` : '';

    return `[${bar}]${percentText}`;
  }

  setValue(value: number): void {
    this.value = Math.max(0, Math.min(this.max, value));
    this.emit('valueChanged', this.value);
  }

  increment(amount = 1): void {
    this.setValue(this.value + amount);
  }
}

export class Input extends Component {
  private value = '';
  private placeholder = '';
  private password = false;
  private rl?: readline.Interface;

  constructor(props: ComponentProps & {
    placeholder?: string;
    password?: boolean;
    defaultValue?: string;
  } = {}) {
    super(props);
    this.placeholder = props.placeholder ?? '';
    this.password = props.password ?? false;
    this.value = props.defaultValue ?? '';
  }

  render(): string {
    if (!this.props.visible) return '';

    const displayValue = this.password ? '*'.repeat(this.value.length) : this.value;
    const prompt = this.placeholder ? `${this.placeholder}: ` : '> ';
    
    return `${prompt}${displayValue}`;
  }

  async prompt(): Promise<string> {
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

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
    this.emit('valueChanged', this.value);
  }
}

// Layout components
export class VBox extends Component {
  private spacing = 1;

  constructor(props: ComponentProps & { spacing?: number } = {}) {
    super(props);
    this.spacing = props.spacing ?? 1;
  }

  render(): string {
    if (!this.props.visible) return '';

    return this.children
      .filter(child => child.props.visible)
      .map(child => child.render())
      .join('\n'.repeat(this.spacing));
  }
}

export class HBox extends Component {
  private spacing = 2;

  constructor(props: ComponentProps & { spacing?: number } = {}) {
    super(props);
    this.spacing = props.spacing ?? 2;
  }

  render(): string {
    if (!this.props.visible) return '';

    const renderedChildren = this.children
      .filter(child => child.props.visible)
      .map(child => child.render().split('\n'));

    if (renderedChildren.length === 0) return '';

    const maxLines = Math.max(...renderedChildren.map(lines => lines.length));
    const result: string[] = [];

    for (let i = 0; i < maxLines; i++) {
      const line = renderedChildren
        .map(lines => lines[i] || '')
        .join(' '.repeat(this.spacing));
      result.push(line);
    }

    return result.join('\n');
  }
}

// Application framework
export class CLIApp extends EventEmitter {
  private root?: Component;
  private config: UIConfig;
  private running = false;

  constructor(config: UIConfig = {}) {
    super();
    this.config = {
      theme: 'default',
      enableColors: true,
      enableAnimations: false,
      responsive: true,
      ...config
    };
  }

  setRoot(component: Component): void {
    this.root = component;
    component.mount();
  }

  render(): void {
    if (!this.root) return;

    // Clear screen
    console.clear();
    
    // Render component tree
    const output = this.root.render();
    console.log(output);
  }

  async run(): Promise<void> {
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

  stop(): void {
    this.running = false;
  }

  // Utility methods for common UI patterns
  static async confirm(message: string): Promise<boolean> {
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

  static async select(message: string, choices: string[]): Promise<string> {
    const list = new List(choices);
    console.log(message);
    console.log(list.render());

    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      let selectedIndex = 0;

      const handleKeypress = (str: string, key: any) => {
        if (key.name === 'up' && selectedIndex > 0) {
          selectedIndex--;
        } else if (key.name === 'down' && selectedIndex < choices.length - 1) {
          selectedIndex++;
        } else if (key.name === 'return') {
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

  static async input(message: string, options: { password?: boolean; defaultValue?: string } = {}): Promise<string> {
    const input = new Input({
      placeholder: message,
      password: options.password,
      defaultValue: options.defaultValue
    });

    return input.prompt();
  }
}

// Cross-platform utilities
export class CrossPlatform {
  static get platform(): 'web' | 'node' | 'electron' | 'mobile' {
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

  static get isElectron(): boolean {
    return this.platform === 'electron';
  }

  static get isBrowser(): boolean {
    return this.platform === 'web';
  }

  static get isNode(): boolean {
    return this.platform === 'node';
  }

  static get isMobile(): boolean {
    return this.platform === 'mobile';
  }

  static async openExternal(url: string): Promise<void> {
    if (this.isElectron) {
      // @ts-ignore
      const { shell } = require('electron');
      await shell.openExternal(url);
    } else if (this.isBrowser) {
      window.open(url, '_blank');
    } else if (this.isNode) {
      const { spawn } = require('child_process');
      const command = process.platform === 'win32' ? 'start' : 
                    process.platform === 'darwin' ? 'open' : 'xdg-open';
      spawn(command, [url]);
    }
  }

  static async showNotification(title: string, body: string): Promise<void> {
    if (this.isElectron) {
      // @ts-ignore
      const { Notification } = require('electron');
      new Notification({ title, body }).show();
    } else if (this.isBrowser && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    } else {
      // Fallback to console for CLI environments
      console.log(`📢 ${title}: ${body}`);
    }
  }

  static getSystemInfo(): Record<string, any> {
    const info: Record<string, any> = {
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

// Main PowerScript UI class
export class PowerScriptUI extends EventEmitter {
  private config: UIConfig;
  private apps = new Map<string, CLIApp>();

  constructor(config: UIConfig = {}) {
    super();
    this.config = config;
  }

  createApp(id: string, config?: UIConfig): CLIApp {
    const app = new CLIApp({ ...this.config, ...config });
    this.apps.set(id, app);
    return app;
  }

  getApp(id: string): CLIApp | undefined {
    return this.apps.get(id);
  }

  removeApp(id: string): boolean {
    const app = this.apps.get(id);
    if (app) {
      app.stop();
      this.apps.delete(id);
      return true;
    }
    return false;
  }

  // Component factory methods
  text(content: string, options?: any): Text {
    return new Text(content, options);
  }

  box(options?: any): Box {
    return new Box(options);
  }

  list(items?: string[], options?: any): List {
    return new List(items, options);
  }

  progressBar(options?: any): ProgressBar {
    return new ProgressBar(options);
  }

  inputComponent(options?: any): Input {
    return new Input(options);
  }

  vbox(options?: any): VBox {
    return new VBox(options);
  }

  hbox(options?: any): HBox {
    return new HBox(options);
  }

  // Utility methods
  get platform(): string {
    return CrossPlatform.platform;
  }

  get systemInfo(): Record<string, any> {
    return CrossPlatform.getSystemInfo();
  }

  async confirm(message: string): Promise<boolean> {
    return CLIApp.confirm(message);
  }

  async select(message: string, choices: string[]): Promise<string> {
    return CLIApp.select(message, choices);
  }

  async promptInput(message: string, options?: any): Promise<string> {
    return CLIApp.input(message, options);
  }

  async showNotification(title: string, body: string): Promise<void> {
    return CrossPlatform.showNotification(title, body);
  }

  async openExternal(url: string): Promise<void> {
    return CrossPlatform.openExternal(url);
  }
}

// Export everything
export default PowerScriptUI;