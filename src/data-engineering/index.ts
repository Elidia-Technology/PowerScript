/**
 * PowerScript Data Engineering Pipelines Module
 * Main exports for data pipeline functionality
 */

export * from './PowerScriptDataPipeline';
export * from './ETLFramework';
export * from './StreamProcessor';
export * from './DataConnectors';
export * from './types';

import { PowerScriptDataPipeline } from './PowerScriptDataPipeline';

// Factory function for easy pipeline creation
export const dataPipeline = {
  create: (config?: any) => new PowerScriptDataPipeline(),
  createETL: (config: any) => {
    const pipeline = new PowerScriptDataPipeline();
    return pipeline.createETLPipeline(config);
  },
  createStream: (id: string, config: any) => {
    const pipeline = new PowerScriptDataPipeline();
    return pipeline.createStreamProcessor(id, config);
  }
};

// Re-export the main class
export { PowerScriptDataPipeline };
export default PowerScriptDataPipeline;