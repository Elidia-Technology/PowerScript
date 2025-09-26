/**
 * Tests for PowerScript UI & Cross-Platform Support Module
 */

import {
  PowerScriptUI,
  CLIApp,
  Text,
  Box,
  List,
  ProgressBar,
  Input,
  VBox,
  HBox,
  CrossPlatform,
  Component
} from '../src/ui';

describe('PowerScript UI & Cross-Platform Support Module', () => {
  let ui: PowerScriptUI;

  beforeEach(() => {
    ui = new PowerScriptUI();
  });

  describe('PowerScriptUI', () => {
    it('should create UI instance', () => {
      expect(ui).toBeInstanceOf(PowerScriptUI);
    });

    it('should create and manage apps', () => {
      const app = ui.createApp('test-app');
      expect(app).toBeInstanceOf(CLIApp);

      const retrieved = ui.getApp('test-app');
      expect(retrieved).toBe(app);

      const removed = ui.removeApp('test-app');
      expect(removed).toBe(true);

      const notFound = ui.getApp('test-app');
      expect(notFound).toBeUndefined();
    });

    it('should create UI components', () => {
      const text = ui.text('Hello World');
      expect(text).toBeInstanceOf(Text);

      const box = ui.box({ title: 'Test Box' });
      expect(box).toBeInstanceOf(Box);

      const list = ui.list(['Item 1', 'Item 2']);
      expect(list).toBeInstanceOf(List);

      const progress = ui.progressBar({ value: 50 });
      expect(progress).toBeInstanceOf(ProgressBar);

      const input = ui.inputComponent({ placeholder: 'Enter text' });
      expect(input).toBeInstanceOf(Input);

      const vbox = ui.vbox();
      expect(vbox).toBeInstanceOf(VBox);

      const hbox = ui.hbox();
      expect(hbox).toBeInstanceOf(HBox);
    });

    it('should provide platform information', () => {
      expect(typeof ui.platform).toBe('string');
      expect(ui.systemInfo).toBeDefined();
      expect(typeof ui.systemInfo).toBe('object');
    });
  });

  describe('CLIApp', () => {
    it('should create CLI application', () => {
      const app = new CLIApp();
      expect(app).toBeInstanceOf(CLIApp);
    });

    it('should set and render root component', () => {
      const app = new CLIApp();
      const text = new Text('Hello World');
      
      app.setRoot(text);
      
      // Should not throw when rendering
      expect(() => app.render()).not.toThrow();
    });

    it('should provide utility methods', async () => {
      // Note: These would require user interaction in real usage
      // We're just testing that the methods exist and are callable
      expect(typeof CLIApp.confirm).toBe('function');
      expect(typeof CLIApp.select).toBe('function');
      expect(typeof CLIApp.input).toBe('function');
    });
  });

  describe('Text Component', () => {
    it('should create text component', () => {
      const text = new Text('Hello World');
      expect(text).toBeInstanceOf(Text);
    });

    it('should render text', () => {
      const text = new Text('Hello World');
      const output = text.render();
      expect(output).toContain('Hello World');
    });

    it('should render with colors', () => {
      const text = new Text('Red Text', { color: 'red' });
      const output = text.render();
      expect(output).toContain('Red Text');
      expect(output).toContain('\x1b[31m'); // Red color code
    });

    it('should render with formatting', () => {
      const text = new Text('Bold Text', { bold: true });
      const output = text.render();
      expect(output).toContain('Bold Text');
      expect(output).toContain('\x1b[1m'); // Bold code
    });

    it('should hide when not visible', () => {
      const text = new Text('Hidden');
      text.update({ visible: false });
      const output = text.render();
      expect(output).toBe('');
    });

    it('should update text content', () => {
      const text = new Text('Original');
      text.setText('Updated');
      const output = text.render();
      expect(output).toContain('Updated');
    });
  });

  describe('Box Component', () => {
    it('should create box component', () => {
      const box = new Box();
      expect(box).toBeInstanceOf(Box);
    });

    it('should render box with border', () => {
      const box = new Box({ title: 'Test Box' });
      const output = box.render();
      expect(output).toContain('┌');
      expect(output).toContain('┐');
      expect(output).toContain('└');
      expect(output).toContain('┘');
      expect(output).toContain('Test Box');
    });

    it('should render box with children', () => {
      const box = new Box();
      const text = new Text('Inside Box');
      box.addChild(text);
      
      const output = box.render();
      expect(output).toContain('Inside Box');
    });
  });

  describe('List Component', () => {
    it('should create list component', () => {
      const list = new List(['Item 1', 'Item 2']);
      expect(list).toBeInstanceOf(List);
    });

    it('should render list items', () => {
      const list = new List(['Item 1', 'Item 2', 'Item 3']);
      const output = list.render();
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
    });

    it('should show selection indicator', () => {
      const list = new List(['Item 1', 'Item 2']);
      const output = list.render();
      expect(output).toContain('►'); // Selection indicator
    });

    it('should manage items', () => {
      const list = new List(['Item 1']);
      
      list.addItem('Item 2');
      expect(list['items']).toContain('Item 2');
      
      list.removeItem(0);
      expect(list['items']).not.toContain('Item 1');
    });

    it('should handle navigation', () => {
      const list = new List(['Item 1', 'Item 2', 'Item 3']);
      
      expect(list['selectedIndex']).toBe(0);
      
      list.selectNext();
      expect(list['selectedIndex']).toBe(1);
      
      list.selectPrevious();
      expect(list['selectedIndex']).toBe(0);
    });

    it('should get selected item', () => {
      const list = new List(['Item 1', 'Item 2']);
      list.selectNext();
      expect(list.getSelected()).toBe('Item 2');
    });
  });

  describe('ProgressBar Component', () => {
    it('should create progress bar', () => {
      const progress = new ProgressBar();
      expect(progress).toBeInstanceOf(ProgressBar);
    });

    it('should render progress bar', () => {
      const progress = new ProgressBar({ value: 50, max: 100 });
      const output = progress.render();
      expect(output).toContain('[');
      expect(output).toContain(']');
      expect(output).toContain('50.0%');
    });

    it('should update progress value', () => {
      const progress = new ProgressBar({ value: 0, max: 100 });
      
      progress.setValue(25);
      let output = progress.render();
      expect(output).toContain('25.0%');
      
      progress.increment(25);
      output = progress.render();
      expect(output).toContain('50.0%');
    });

    it('should handle boundary values', () => {
      const progress = new ProgressBar({ max: 100 });
      
      progress.setValue(-10);
      expect(progress['value']).toBe(0);
      
      progress.setValue(150);
      expect(progress['value']).toBe(100);
    });
  });

  describe('Input Component', () => {
    it('should create input component', () => {
      const input = new Input();
      expect(input).toBeInstanceOf(Input);
    });

    it('should render input with placeholder', () => {
      const input = new Input({ placeholder: 'Enter name' });
      const output = input.render();
      expect(output).toContain('Enter name:');
    });

    it('should handle password mode', () => {
      const input = new Input({ password: true });
      input.setValue('secret');
      const output = input.render();
      expect(output).toContain('******');
      expect(output).not.toContain('secret');
    });

    it('should get and set values', () => {
      const input = new Input();
      
      input.setValue('test value');
      expect(input.getValue()).toBe('test value');
    });
  });

  describe('Layout Components', () => {
    it('should create VBox layout', () => {
      const vbox = new VBox();
      expect(vbox).toBeInstanceOf(VBox);
      
      const text1 = new Text('Line 1');
      const text2 = new Text('Line 2');
      
      vbox.addChild(text1);
      vbox.addChild(text2);
      
      const output = vbox.render();
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
    });

    it('should create HBox layout', () => {
      const hbox = new HBox();
      expect(hbox).toBeInstanceOf(HBox);
      
      const text1 = new Text('Col1');
      const text2 = new Text('Col2');
      
      hbox.addChild(text1);
      hbox.addChild(text2);
      
      const output = hbox.render();
      expect(output).toContain('Col1');
      expect(output).toContain('Col2');
    });
  });

  describe('Component Base Class', () => {
    class TestComponent extends Component {
      render(): string {
        return this.props.visible ? 'Test Content' : '';
      }
    }

    it('should manage component hierarchy', () => {
      const parent = new TestComponent();
      const child = new TestComponent();
      
      parent.addChild(child);
      expect(parent['children']).toContain(child);
      expect(child['parent']).toBe(parent);
      
      parent.removeChild(child);
      expect(parent['children']).not.toContain(child);
      expect(child['parent']).toBeUndefined();
    });

    it('should find children by id', () => {
      const parent = new TestComponent();
      const child = new TestComponent({ id: 'test-child' });
      
      parent.addChild(child);
      const found = parent.findChild('test-child');
      expect(found).toBe(child);
    });

    it('should update component properties', () => {
      const component = new TestComponent();
      
      component.update({ visible: false });
      expect(component.props.visible).toBe(false);
    });

    it('should show and hide components', () => {
      const component = new TestComponent();
      
      component.hide();
      expect(component.props.visible).toBe(false);
      
      component.show();
      expect(component.props.visible).toBe(true);
    });

    it('should enable and disable components', () => {
      const component = new TestComponent();
      
      component.disable();
      expect(component.props.enabled).toBe(false);
      
      component.enable();
      expect(component.props.enabled).toBe(true);
    });
  });

  describe('CrossPlatform Utilities', () => {
    it('should detect platform', () => {
      expect(typeof CrossPlatform.platform).toBe('string');
      expect(['web', 'node', 'electron', 'mobile']).toContain(CrossPlatform.platform);
    });

    it('should provide platform booleans', () => {
      expect(typeof CrossPlatform.isElectron).toBe('boolean');
      expect(typeof CrossPlatform.isBrowser).toBe('boolean');
      expect(typeof CrossPlatform.isNode).toBe('boolean');
      expect(typeof CrossPlatform.isMobile).toBe('boolean');
    });

    it('should get system information', () => {
      const info = CrossPlatform.getSystemInfo();
      expect(typeof info).toBe('object');
      expect(info.platform).toBeDefined();
      expect(info.userAgent).toBeDefined();
    });

    it('should provide utility methods', () => {
      expect(typeof CrossPlatform.openExternal).toBe('function');
      expect(typeof CrossPlatform.showNotification).toBe('function');
    });
  });
});