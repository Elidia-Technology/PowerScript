"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgent = void 0;
const events_1 = require("events");
/**
 * PowerScript AI Agent - Individual Agent Implementation
 *
 * Implements an autonomous AI agent with capabilities for reasoning,
 * planning, memory management, and collaboration with other agents.
 *
 * Features:
 * - Autonomous task execution with planning and reasoning
 * - Long-term and short-term memory management
 * - Multi-modal capabilities (text, code, analysis, etc.)
 * - Collaboration and communication with other agents
 * - Personality-based behavior and decision making
 * - Self-reflection and learning from past actions
 * - Error handling and recovery mechanisms
 * - Performance monitoring and optimization
 *
 * @example
 * ```typescript
 * const agent = new AIAgent({
 *   id: 'researcher',
 *   name: 'Research Assistant',
 *   personality: {
 *     name: 'Dr. Research',
 *     role: 'Research Specialist',
 *     traits: ['analytical', 'thorough', 'curious'],
 *     expertise: ['data analysis', 'literature review'],
 *     communicationStyle: 'technical',
 *     decisionMaking: 'analytical'
 *   },
 *   capabilities: [
 *     {
 *       name: 'research',
 *       description: 'Conduct research on topics',
 *       inputTypes: ['query'],
 *       outputTypes: ['research_report']
 *     }
 *   ]
 * });
 *
 * // Execute a task
 * const result = await agent.executeTask('research', {
 *   query: 'Latest trends in AI',
 *   depth: 'comprehensive'
 * });
 * ```
 */
class AIAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = {
            temperature: 0.7,
            maxTokens: 2000,
            memorySize: 1000,
            autonomyLevel: 0.7,
            ...config
        };
        this.state = {
            status: 'idle',
            memory: new Map(),
            progress: 0
        };
        this.conversationHistory = [];
        this.taskQueue = [];
        this.collaborators = new Set();
        this.performanceMetrics = new Map();
        this.lastActivity = new Date();
        this.initializeAgent();
    }
    /**
     * Initialize the agent with default memory and setup
     */
    initializeAgent() {
        // Initialize memory with agent information
        this.state.memory.set('agent_id', this.config.id);
        this.state.memory.set('agent_name', this.config.name);
        this.state.memory.set('personality', this.config.personality);
        this.state.memory.set('capabilities', this.config.capabilities);
        this.state.memory.set('created_at', new Date());
        // Initialize performance metrics
        this.performanceMetrics.set('tasks_completed', 0);
        this.performanceMetrics.set('success_rate', 1.0);
        this.performanceMetrics.set('avg_response_time', 0);
        this.performanceMetrics.set('collaboration_score', 0);
        this.emit('agentInitialized', {
            agentId: this.config.id,
            timestamp: new Date()
        });
    }
    /**
     * Execute a task using the agent's capabilities
     */
    async executeTask(taskType, parameters) {
        const startTime = Date.now();
        this.setState({ status: 'thinking', currentTask: taskType, progress: 0 });
        try {
            // Check if agent has the required capability
            const capability = this.config.capabilities.find(cap => cap.name === taskType);
            if (!capability) {
                throw new Error(`Agent ${this.config.id} does not have capability: ${taskType}`);
            }
            this.emit('taskStarted', {
                agentId: this.config.id,
                taskType,
                parameters,
                timestamp: new Date()
            });
            // Plan the task execution
            const plan = await this.planTask(taskType, parameters, capability);
            this.setState({ progress: 20 });
            // Execute the plan
            const result = await this.executePlan(plan, parameters);
            this.setState({ progress: 80 });
            // Reflect on the result
            const finalResult = await this.reflectOnResult(result, taskType, parameters);
            this.setState({ status: 'completed', progress: 100, lastResult: finalResult });
            // Update memory and metrics
            this.updateMemory(taskType, parameters, finalResult);
            this.updatePerformanceMetrics(startTime, true);
            this.emit('taskCompleted', {
                agentId: this.config.id,
                taskType,
                result: finalResult,
                duration: Date.now() - startTime,
                timestamp: new Date()
            });
            return finalResult;
        }
        catch (error) {
            this.setState({
                status: 'error',
                errorMessage: error instanceof Error ? error.message : String(error)
            });
            this.updatePerformanceMetrics(startTime, false);
            this.emit('taskError', {
                agentId: this.config.id,
                taskType,
                error,
                timestamp: new Date()
            });
            return {
                success: false,
                result: null,
                confidence: 0,
                reasoning: `Task failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Plan task execution based on capability and parameters
     */
    async planTask(taskType, parameters, capability) {
        // Generate a plan based on the agent's personality and expertise
        const personality = this.config.personality;
        const expertise = personality.expertise;
        // Check if task aligns with expertise
        const isExpertiseMatch = expertise.some(exp => taskType.toLowerCase().includes(exp.toLowerCase()) ||
            JSON.stringify(parameters).toLowerCase().includes(exp.toLowerCase()));
        let approach = 'standard';
        if (personality.decisionMaking === 'analytical') {
            approach = 'methodical';
        }
        else if (personality.decisionMaking === 'intuitive') {
            approach = 'creative';
        }
        else if (personality.decisionMaking === 'collaborative') {
            approach = 'team-based';
        }
        const plan = {
            taskType,
            approach,
            steps: this.generateTaskSteps(taskType, parameters, approach),
            expertiseMatch: isExpertiseMatch,
            estimatedDuration: this.estimateTaskDuration(taskType, parameters),
            collaborationNeeded: this.shouldCollaborate(taskType, parameters),
            riskLevel: this.assessTaskRisk(taskType, parameters)
        };
        // Store plan in memory
        this.state.memory.set(`plan_${taskType}_${Date.now()}`, plan);
        return plan;
    }
    /**
     * Execute the planned steps
     */
    async executePlan(plan, parameters) {
        const results = [];
        let overallConfidence = 1.0;
        this.setState({ status: 'acting' });
        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];
            this.setState({ progress: 20 + (60 * i / plan.steps.length) });
            try {
                const stepResult = await this.executeStep(step, parameters, results);
                results.push(stepResult);
                // Adjust confidence based on step success
                if (stepResult.confidence) {
                    overallConfidence *= stepResult.confidence;
                }
            }
            catch (error) {
                // Handle step failure
                const errorResult = {
                    step: step.name,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    confidence: 0
                };
                results.push(errorResult);
                overallConfidence *= 0.5; // Reduce confidence for failures
            }
        }
        // Compile final result
        const finalResult = {
            success: results.some(r => r.success !== false),
            result: this.compileResults(results, plan),
            confidence: overallConfidence,
            reasoning: this.generateReasoning(plan, results),
            artifacts: results.filter(r => r.artifact),
            nextSteps: this.suggestNextSteps(plan, results),
            collaborationNeeded: plan.collaborationNeeded && overallConfidence < 0.7
        };
        return finalResult;
    }
    /**
     * Execute individual step of the plan
     */
    async executeStep(step, parameters, previousResults) {
        // Simulate step execution based on step type
        await this.simulateThinking(step.complexity || 1);
        switch (step.type) {
            case 'analysis':
                return await this.performAnalysis(step, parameters, previousResults);
            case 'research':
                return await this.performResearch(step, parameters, previousResults);
            case 'generation':
                return await this.performGeneration(step, parameters, previousResults);
            case 'validation':
                return await this.performValidation(step, parameters, previousResults);
            case 'collaboration':
                return await this.performCollaboration(step, parameters, previousResults);
            default:
                return {
                    success: true,
                    result: `Completed ${step.name}`,
                    confidence: 0.8
                };
        }
    }
    /**
     * Reflect on the task result and improve
     */
    async reflectOnResult(result, taskType, parameters) {
        // Self-reflection based on personality
        const personality = this.config.personality;
        if (personality.traits.includes('perfectionist') && result.confidence < 0.9) {
            // Try to improve the result
            result.reasoning += ' (Note: Result could be improved with additional iteration)';
            result.nextSteps = result.nextSteps || [];
            result.nextSteps.push('Consider refinement and iteration');
        }
        if (personality.traits.includes('collaborative') && !result.collaborationNeeded) {
            // Consider if collaboration could have helped
            result.reasoning += ' (Note: Collaboration might enhance this result)';
        }
        // Learn from the experience
        const experience = {
            taskType,
            parameters,
            result: result.success,
            confidence: result.confidence,
            timestamp: new Date()
        };
        this.state.memory.set(`experience_${Date.now()}`, experience);
        return result;
    }
    /**
     * Generate task steps based on approach
     */
    generateTaskSteps(taskType, parameters, approach) {
        const baseSteps = [
            { name: 'understand_requirements', type: 'analysis', complexity: 1 },
            { name: 'plan_approach', type: 'analysis', complexity: 2 },
            { name: 'execute_main_task', type: this.getMainTaskType(taskType), complexity: 3 },
            { name: 'validate_result', type: 'validation', complexity: 1 }
        ];
        if (approach === 'methodical') {
            baseSteps.splice(2, 0, { name: 'detailed_analysis', type: 'analysis', complexity: 2 });
        }
        else if (approach === 'team-based') {
            baseSteps.splice(1, 0, { name: 'seek_collaboration', type: 'collaboration', complexity: 1 });
        }
        return baseSteps;
    }
    /**
     * Get main task type for step generation
     */
    getMainTaskType(taskType) {
        if (taskType.includes('research'))
            return 'research';
        if (taskType.includes('analyze'))
            return 'analysis';
        if (taskType.includes('generate') || taskType.includes('create'))
            return 'generation';
        return 'analysis';
    }
    /**
     * Various execution methods for different step types
     */
    async performAnalysis(step, parameters, previousResults) {
        await this.simulateThinking(2);
        return {
            success: true,
            result: `Analysis completed for ${step.name}`,
            confidence: 0.85,
            artifact: { type: 'analysis', data: parameters }
        };
    }
    async performResearch(step, parameters, previousResults) {
        await this.simulateThinking(3);
        return {
            success: true,
            result: `Research completed for ${step.name}`,
            confidence: 0.80,
            artifact: { type: 'research', data: `Research findings for ${JSON.stringify(parameters)}` }
        };
    }
    async performGeneration(step, parameters, previousResults) {
        await this.simulateThinking(2);
        return {
            success: true,
            result: `Generated content for ${step.name}`,
            confidence: 0.75,
            artifact: { type: 'generated', data: `Generated content based on ${JSON.stringify(parameters)}` }
        };
    }
    async performValidation(step, parameters, previousResults) {
        await this.simulateThinking(1);
        const hasSuccesses = previousResults.some(r => r.success !== false);
        return {
            success: hasSuccesses,
            result: hasSuccesses ? 'Validation passed' : 'Validation failed',
            confidence: hasSuccesses ? 0.90 : 0.30
        };
    }
    async performCollaboration(step, parameters, previousResults) {
        await this.simulateThinking(1);
        // In a real implementation, this would reach out to other agents
        return {
            success: true,
            result: 'Collaboration initiated (simulated)',
            confidence: 0.70,
            collaborationRequested: true
        };
    }
    /**
     * Simulate thinking time based on complexity
     */
    async simulateThinking(complexity) {
        const thinkingTime = complexity * 100; // milliseconds
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
    }
    /**
     * Estimate task duration
     */
    estimateTaskDuration(taskType, parameters) {
        // Simple estimation based on task type and complexity
        let baseTime = 5000; // 5 seconds base
        if (taskType.includes('research'))
            baseTime *= 2;
        if (taskType.includes('complex') || JSON.stringify(parameters).length > 1000)
            baseTime *= 1.5;
        return baseTime;
    }
    /**
     * Determine if collaboration is needed
     */
    shouldCollaborate(taskType, parameters) {
        const personality = this.config.personality;
        // Collaborative personalities are more likely to collaborate
        if (personality.decisionMaking === 'collaborative')
            return true;
        // Complex tasks might need collaboration
        if (taskType.includes('complex') || JSON.stringify(parameters).length > 1000)
            return true;
        // Tasks outside expertise might need collaboration
        const isOutsideExpertise = !personality.expertise.some(exp => taskType.toLowerCase().includes(exp.toLowerCase()));
        return isOutsideExpertise && this.config.autonomyLevel < 0.8;
    }
    /**
     * Assess task risk level
     */
    assessTaskRisk(taskType, parameters) {
        if (taskType.includes('delete') || taskType.includes('critical'))
            return 'high';
        if (taskType.includes('modify') || taskType.includes('update'))
            return 'medium';
        return 'low';
    }
    /**
     * Compile step results into final result
     */
    compileResults(stepResults, plan) {
        const successful = stepResults.filter(r => r.success !== false);
        const artifacts = stepResults.filter(r => r.artifact).map(r => r.artifact);
        return {
            summary: `Completed ${successful.length}/${stepResults.length} steps successfully`,
            details: stepResults,
            artifacts,
            approach: plan.approach,
            expertiseMatch: plan.expertiseMatch
        };
    }
    /**
     * Generate reasoning for the result
     */
    generateReasoning(plan, results) {
        const successfulSteps = results.filter(r => r.success !== false).length;
        const totalSteps = results.length;
        const successRate = successfulSteps / totalSteps;
        let reasoning = `Executed ${plan.approach} approach with ${successRate * 100}% step success rate. `;
        if (plan.expertiseMatch) {
            reasoning += 'Task aligned with agent expertise. ';
        }
        else {
            reasoning += 'Task outside primary expertise, relied on general capabilities. ';
        }
        if (successRate > 0.8) {
            reasoning += 'High confidence in result quality.';
        }
        else if (successRate > 0.5) {
            reasoning += 'Moderate confidence, some steps encountered issues.';
        }
        else {
            reasoning += 'Low confidence, significant challenges encountered.';
        }
        return reasoning;
    }
    /**
     * Suggest next steps based on results
     */
    suggestNextSteps(plan, results) {
        const nextSteps = [];
        const failedSteps = results.filter(r => r.success === false);
        if (failedSteps.length > 0) {
            nextSteps.push('Retry failed steps with refined approach');
        }
        if (plan.collaborationNeeded) {
            nextSteps.push('Seek collaboration with domain experts');
        }
        if (plan.riskLevel === 'high') {
            nextSteps.push('Review results with human oversight');
        }
        nextSteps.push('Monitor result quality and gather feedback');
        return nextSteps;
    }
    /**
     * Update agent memory with new information
     */
    updateMemory(taskType, parameters, result) {
        const memoryKey = `task_${taskType}_${Date.now()}`;
        const memoryEntry = {
            taskType,
            parameters,
            result: result.success,
            confidence: result.confidence,
            timestamp: new Date(),
            artifacts: result.artifacts?.length || 0
        };
        this.state.memory.set(memoryKey, memoryEntry);
        // Implement memory size limit
        if (this.state.memory.size > (this.config.memorySize || 1000)) {
            const oldestKey = Array.from(this.state.memory.keys())[0];
            this.state.memory.delete(oldestKey);
        }
    }
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(startTime, success) {
        const duration = Date.now() - startTime;
        const tasksCompleted = this.performanceMetrics.get('tasks_completed') || 0;
        const successRate = this.performanceMetrics.get('success_rate') || 1.0;
        const avgResponseTime = this.performanceMetrics.get('avg_response_time') || 0;
        this.performanceMetrics.set('tasks_completed', tasksCompleted + 1);
        this.performanceMetrics.set('success_rate', (successRate * tasksCompleted + (success ? 1 : 0)) / (tasksCompleted + 1));
        this.performanceMetrics.set('avg_response_time', (avgResponseTime * tasksCompleted + duration) / (tasksCompleted + 1));
        this.lastActivity = new Date();
    }
    /**
     * Send message to another agent or broadcast
     */
    async sendMessage(message) {
        const fullMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromAgent: this.config.id,
            timestamp: new Date(),
            ...message
        };
        this.conversationHistory.push(fullMessage);
        this.emit('messageSent', {
            agentId: this.config.id,
            message: fullMessage,
            timestamp: new Date()
        });
    }
    /**
     * Receive message from another agent
     */
    async receiveMessage(message) {
        this.conversationHistory.push(message);
        this.emit('messageReceived', {
            agentId: this.config.id,
            message,
            timestamp: new Date()
        });
        // Process message based on type
        await this.processIncomingMessage(message);
    }
    /**
     * Process incoming message
     */
    async processIncomingMessage(message) {
        switch (message.type) {
            case 'task':
                // Add task to queue
                this.taskQueue.push({
                    task: message.content.taskType,
                    params: message.content.parameters,
                    priority: this.getPriorityScore(message.priority || 'medium')
                });
                break;
            case 'question':
                // Respond to question if capable
                await this.handleQuestion(message);
                break;
            case 'collaboration':
                // Join collaboration
                this.collaborators.add(message.fromAgent);
                await this.respondToCollaboration(message);
                break;
        }
    }
    /**
     * Handle question from another agent
     */
    async handleQuestion(message) {
        const question = message.content;
        const expertise = this.config.personality.expertise;
        // Check if question is within expertise
        const canAnswer = expertise.some(exp => question.toLowerCase().includes(exp.toLowerCase()));
        if (canAnswer) {
            await this.sendMessage({
                toAgent: message.fromAgent,
                type: 'information',
                content: {
                    answer: `Based on my expertise in ${expertise.join(', ')}, here's my response to: ${question}`,
                    confidence: 0.8,
                    source: this.config.id
                }
            });
        }
    }
    /**
     * Respond to collaboration request
     */
    async respondToCollaboration(message) {
        const collaborationRequest = message.content;
        await this.sendMessage({
            toAgent: message.fromAgent,
            type: 'collaboration',
            content: {
                response: 'accepted',
                capabilities: this.config.capabilities.map(c => c.name),
                availability: this.state.status === 'idle',
                expertise: this.config.personality.expertise
            }
        });
    }
    /**
     * Get priority score for task ordering
     */
    getPriorityScore(priority) {
        switch (priority) {
            case 'urgent': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 2;
        }
    }
    /**
     * Process task queue
     */
    async processTaskQueue() {
        if (this.state.status !== 'idle' || this.taskQueue.length === 0) {
            return;
        }
        // Sort by priority
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
            await this.executeTask(nextTask.task, nextTask.params);
        }
    }
    /**
     * Set agent state
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.emit('stateChanged', {
            agentId: this.config.id,
            state: this.state,
            timestamp: new Date()
        });
    }
    /**
     * Get agent information
     */
    getInfo() {
        return {
            id: this.config.id,
            name: this.config.name,
            personality: this.config.personality,
            capabilities: this.config.capabilities,
            state: this.state,
            performanceMetrics: Array.from(this.performanceMetrics.entries()),
            conversationHistory: this.conversationHistory.length,
            taskQueueLength: this.taskQueue.length,
            collaborators: Array.from(this.collaborators),
            lastActivity: this.lastActivity
        };
    }
    /**
     * Get memory contents (filtered for privacy)
     */
    getMemorySnapshot() {
        const snapshot = {};
        for (const [key, value] of this.state.memory) {
            if (!key.includes('private') && !key.includes('secret')) {
                snapshot[key] = value;
            }
        }
        return snapshot;
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.state.memory.clear();
        this.conversationHistory = [];
        this.taskQueue = [];
        this.collaborators.clear();
        this.performanceMetrics.clear();
        this.removeAllListeners();
    }
}
exports.AIAgent = AIAgent;
