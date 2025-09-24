/**
 * PowerScript Core Types
 * 
 * Type definitions for PowerScript core functionality
 */

// Node.js Buffer compatibility
declare global {
  interface Buffer {
    length: number;
    readUInt8(offset: number): number;
    readInt8(offset: number): number;
    readUInt16BE(offset: number): number;
    readUInt16LE(offset: number): number;
    readInt16BE(offset: number): number;
    readInt16LE(offset: number): number;
    readUInt32BE(offset: number): number;
    readUInt32LE(offset: number): number;
    readInt32BE(offset: number): number;
    readInt32LE(offset: number): number;
    readFloatBE(offset: number): number;
    readFloatLE(offset: number): number;
    readDoubleBE(offset: number): number;
    readDoubleLE(offset: number): number;
    writeUInt8(value: number, offset: number): number;
    writeInt8(value: number, offset: number): number;
    writeUInt16BE(value: number, offset: number): number;
    writeUInt16LE(value: number, offset: number): number;
    writeInt16BE(value: number, offset: number): number;
    writeInt16LE(value: number, offset: number): number;
    writeUInt32BE(value: number, offset: number): number;
    writeUInt32LE(value: number, offset: number): number;
    writeInt32BE(value: number, offset: number): number;
    writeInt32LE(value: number, offset: number): number;
    writeFloatBE(value: number, offset: number): number;
    writeFloatLE(value: number, offset: number): number;
    writeDoubleBE(value: number, offset: number): number;
    writeDoubleLE(value: number, offset: number): number;
    toString(encoding?: string, start?: number, end?: number): string;
    copy(target: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    subarray(start?: number, end?: number): Buffer;
    buffer: ArrayBuffer;
    byteOffset: number;
    byteLength: number;
  }

  interface BufferConstructor {
    alloc(size: number, fill?: string | Buffer | number, encoding?: string): Buffer;
    from(arrayBuffer: ArrayBuffer): Buffer;
    from(data: Uint8Array): Buffer;
    from(data: number[]): Buffer;
    from(data: Buffer): Buffer;
    from(str: string, encoding?: string): Buffer;
    byteLength(string: string, encoding?: string): number;
  }

  var Buffer: BufferConstructor;

  interface RequireFunction {
    (id: string): any;
    main?: {
      filename: string;
    } | undefined;
  }

  var require: RequireFunction;

  interface Process {
    version: string;
    platform: string;
    arch: string;
    argv: string[];
    env: {
      [key: string]: string | undefined;
    };
    exit(code?: number): never;
    memoryUsage(): {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    cpuUsage(previousValue?: {
      user: number;
      system: number;
    }): {
      user: number;
      system: number;
    };
    on(event: 'uncaughtException', listener: (error: Error) => void): Process;
    on(event: 'unhandledRejection', listener: (reason: any, promise: Promise<any>) => void): Process;
    uptime(): number;
  }

  var process: Process;

  // Global Node.js functions
  function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any;
  function clearImmediate(immediateId: any): void;

  // Node.js module system
  var module: {
    exports: any;
    filename: string;
    id: string;
    loaded: boolean;
    parent?: any;
    children: any[];
  };
}

// PowerScript specific types
export type PowerScriptEventListener = (event: any) => void;

export interface PowerScriptConfig {
  ai?: {
    providers?: string[];
    defaultProvider?: string;
    apiKeys?: Record<string, string>;
  };
  ml?: {
    backend?: 'tensorflow' | 'pytorch' | 'onnx';
    device?: 'cpu' | 'gpu' | 'auto';
  };
  compiler?: {
    target?: 'es5' | 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext';
    module?: 'commonjs' | 'es6' | 'amd' | 'umd';
    sourceMaps?: boolean;
    minify?: boolean;
  };
  runtime?: {
    sandbox?: boolean;
    strictMode?: boolean;
  };
}

export interface PowerScriptRuntime {
  node: string;
  platform: string;
  arch: string;
  powerscript: string;
  features: {
    ai: boolean;
    ml: boolean;
    blockchain: boolean;
    iot: boolean;
    cloud: boolean;
    quantum: boolean;
  };
}