"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAgentSystem = void 0;
const events_1 = require("events");
const AIAgent_1 = require("./AIAgent");
/**
 * PowerScript Multi-Agent System
 *
 * Orchestrates multiple AI agents to work together on complex tasks,
 * inspired by AutoGPT, BabyAGI, and CrewAI architectures.
 *
 * Features:
 * - Agent lifecycle management (creation, monitoring, termination)
 * - Task decomposition and assignment
 * - Multiple collaboration strategies (sequential, parallel, hierarchical)
 * - Intelligent agent selection and load balancing
 * - Conflict resolution and consensus building
 * - Real-time monitoring and performance analytics
 * - Fault tolerance and automatic recovery
 * - Knowledge sharing between agents
 * - Dynamic agent scaling based on workload
 *
 * @example
 * ```typescript
 * const multiAgent = new MultiAgentSystem({
 *   maxConcurrentTasks: 10,
 *   taskTimeout: 300000,
 *   collaborationTimeout: 600000,
 *   loadBalancing: true,
 *   failoverEnabled: true
 * });
 *
 * // Add agents to the system
 * await multiAgent.addAgent(researcherConfig);
 * await multiAgent.addAgent(analyzerConfig);
 * await multiAgent.addAgent(writerConfig);
 *
 * // Execute complex task
 * const result = await multiAgent.executeComplexTask({
 *   type: 'research_and_report',
 *   description: 'Research AI trends and write comprehensive report',
 *   parameters: { topic: 'AI in healthcare', depth: 'comprehensive' },
 *   priority: 'high',
 *   requiredCapabilities: ['research', 'analysis', 'writing']
 * });
 * ```
 */
class MultiAgentSystem extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxConcurrentTasks: 10,
            taskTimeout: 300000, // 5 minutes
            collaborationTimeout: 600000, // 10 minutes
            messageRetention: 10000,
            loadBalancing: true,
            failoverEnabled: true,
            monitoringEnabled: true,
            ...config
        };
        this.agents = new Map();
        this.tasks = new Map();
        this.collaborations = new Map();
        this.messageQueue = [];
        this.startTime = new Date();
        this.isRunning = false;
        this.metrics = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageTaskTime: 0,
            agentUtilization: new Map(),
            collaborationSuccess: 0,
            systemUptime: 0,
            messagesProcessed: 0
        };
        this.initializeSystem();
    }
    /**
     * Initialize the multi-agent system
     */
    initializeSystem() {
        this.isRunning = true;
        // Start message processing loop
        this.startMessageProcessing();
        // Start monitoring loop
        if (this.config.monitoringEnabled) {
            this.startMonitoring();
        }
        this.emit('systemInitialized', {
            timestamp: new Date(),
            config: this.config
        });
    }
    /**
     * Add an agent to the system
     */
    async addAgent(agentConfig) {
        try {
            const agent = new AIAgent_1.AIAgent(agentConfig);
            // Set up event listeners
            agent.on('taskCompleted', (data) => {
                this.handleAgentTaskCompleted(data);
            });
            agent.on('taskError', (data) => {
                this.handleAgentTaskError(data);
            });
            agent.on('messageSent', (data) => {
                this.handleAgentMessage(data.message);
            });
            agent.on('stateChanged', (data) => {
                this.updateAgentMetrics(data.agentId, data.state);
            });
            this.agents.set(agentConfig.id, agent);
            this.metrics.agentUtilization.set(agentConfig.id, 0);
            this.emit('agentAdded', {
                agentId: agentConfig.id,
                agentName: agentConfig.name,
                capabilities: agentConfig.capabilities.map(c => c.name),
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('error', { error, operation: 'addAgent', agentId: agentConfig.id });
            throw error;
        }
    }
    /**
     * Remove an agent from the system
     */
    async removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        // Complete any ongoing tasks
        await this.reassignAgentTasks(agentId);
        // Clean up agent
        agent.dispose();
        this.agents.delete(agentId);
        this.metrics.agentUtilization.delete(agentId);
        this.emit('agentRemoved', {
            agentId,
            timestamp: new Date()
        });
    }
    /**
     * Execute a complex task using multiple agents
     */
    async executeComplexTask(taskRequest) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            createdAt: new Date(),
            ...taskRequest
        };
        this.tasks.set(task.id, task);
        this.metrics.totalTasks++;
        try {
            this.emit('taskStarted', {
                taskId: task.id,
                taskType: task.type,
                timestamp: new Date()
            });
            // Decompose task if complex
            const subtasks = await this.decomposeTask(task);
            // Select appropriate agents
            const selectedAgents = await this.selectAgents(task, subtasks);
            // Create collaboration strategy
            const collaboration = await this.createCollaboration(task, selectedAgents, subtasks);
            // Execute the collaboration
            const result = await this.executeCollaboration(collaboration);
            // Update task status
            task.status = result.success ? 'completed' : 'failed';
            task.result = result;
            task.completedAt = new Date();
            // Update metrics
            this.updateTaskMetrics(task, result.success);
            this.emit('taskCompleted', {
                taskId: task.id,
                result,
                duration: task.completedAt.getTime() - task.createdAt.getTime(),
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            task.status = 'failed';
            task.completedAt = new Date();
            this.metrics.failedTasks++;
            this.emit('taskFailed', {
                taskId: task.id,
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
     * Decompose complex task into subtasks
     */
    async decomposeTask(task) {
        // Simple task decomposition logic
        // In production, this would use more sophisticated AI-based decomposition
        const subtasks = [];
        if (task.type === 'research_and_report') {
            subtasks.push({
                id: `${task.id}_research`,
                type: 'research',
                description: `Research ${task.parameters.topic}`,
                parameters: { ...task.parameters, phase: 'research' },
                priority: task.priority,
                requiredCapabilities: ['research'],
                status: 'pending',
                createdAt: new Date()
            });
            subtasks.push({
                id: `${task.id}_analysis`,
                type: 'analysis',
                description: `Analyze research findings on ${task.parameters.topic}`,
                parameters: { ...task.parameters, phase: 'analysis' },
                priority: task.priority,
                requiredCapabilities: ['analysis'],
                status: 'pending',
                createdAt: new Date()
            });
            subtasks.push({
                id: `${task.id}_writing`,
                type: 'writing',
                description: `Write comprehensive report on ${task.parameters.topic}`,
                parameters: { ...task.parameters, phase: 'writing' },
                priority: task.priority,
                requiredCapabilities: ['writing'],
                status: 'pending',
                createdAt: new Date()
            });
        }
        else {
            // For simpler tasks, return as single subtask
            subtasks.push(task);
        }
        return subtasks;
    }
    /**
     * Select appropriate agents for tasks
     */
    async selectAgents(mainTask, subtasks) {
        const selectedAgents = new Set();
        for (const subtask of subtasks) {
            const suitableAgents = this.findSuitableAgents(subtask);
            if (suitableAgents.length === 0) {
                throw new Error(`No suitable agents found for task: ${subtask.type}`);
            }
            // Select best agent based on load balancing and capability match
            const bestAgent = this.selectBestAgent(suitableAgents, subtask);
            selectedAgents.add(bestAgent);
        }
        return Array.from(selectedAgents);
    }
    /**
     * Find agents with required capabilities
     */
    findSuitableAgents(task) {
        const suitableAgents = [];
        for (const [agentId, agent] of this.agents) {
            const agentInfo = agent.getInfo();
            const hasRequiredCapabilities = task.requiredCapabilities.every(reqCap => agentInfo.capabilities.some(cap => cap.name === reqCap));
            if (hasRequiredCapabilities) {
                suitableAgents.push(agentId);
            }
        }
        return suitableAgents;
    }
    /**
     * Select best agent considering load balancing
     */
    selectBestAgent(candidates, task) {
        if (candidates.length === 1) {
            return candidates[0];
        }
        // Score agents based on multiple factors
        const agentScores = candidates.map(agentId => {
            const agent = this.agents.get(agentId);
            const agentInfo = agent.getInfo();
            const utilization = this.metrics.agentUtilization.get(agentId) || 0;
            let score = 0;
            // Favor agents with lower utilization
            score += (1 - utilization) * 40;
            // Favor agents with matching expertise
            const expertiseMatch = agentInfo.personality.expertise.some(exp => task.type.toLowerCase().includes(exp.toLowerCase()));
            if (expertiseMatch)
                score += 30;
            // Favor agents with good performance
            const successRate = agentInfo.performanceMetrics.find(([key]) => key === 'success_rate')?.[1] || 0.5;
            score += successRate * 20;
            // Favor idle agents
            if (agentInfo.state.status === 'idle')
                score += 10;
            return { agentId, score };
        });
        // Return agent with highest score
        agentScores.sort((a, b) => b.score - a.score);
        return agentScores[0].agentId;
    }
    /**
     * Create collaboration between selected agents
     */
    async createCollaboration(task, agentIds, subtasks) {
        const collaboration = {
            id: `collab_${task.id}`,
            participants: agentIds,
            task,
            strategy: this.determineCollaborationStrategy(task, agentIds, subtasks),
            coordinator: this.selectCoordinator(agentIds),
            messages: [],
            startedAt: new Date(),
            status: 'active'
        };
        this.collaborations.set(collaboration.id, collaboration);
        this.emit('collaborationStarted', {
            collaborationId: collaboration.id,
            participants: agentIds,
            strategy: collaboration.strategy,
            timestamp: new Date()
        });
        return collaboration;
    }
    /**
     * Determine optimal collaboration strategy
     */
    determineCollaborationStrategy(task, agentIds, subtasks) {
        // Simple strategy selection logic
        if (subtasks.length > 1 && agentIds.length > 1) {
            // Multiple subtasks with multiple agents - use sequential for dependencies
            if (task.type === 'research_and_report') {
                return 'sequential'; // Research -> Analysis -> Writing
            }
            return 'parallel'; // Independent subtasks
        }
        if (agentIds.length > 3) {
            return 'hierarchical'; // Large team needs coordination
        }
        return 'democratic'; // Small team can self-organize
    }
    /**
     * Select coordinator for collaboration
     */
    selectCoordinator(agentIds) {
        // Select agent with best leadership qualities
        let bestCoordinator = agentIds[0];
        let bestScore = 0;
        for (const agentId of agentIds) {
            const agent = this.agents.get(agentId);
            const agentInfo = agent.getInfo();
            let score = 0;
            // Leadership traits
            if (agentInfo.personality.traits.includes('leadership'))
                score += 30;
            if (agentInfo.personality.decisionMaking === 'analytical')
                score += 20;
            if (agentInfo.personality.communicationStyle === 'formal')
                score += 10;
            // Experience
            const tasksCompleted = agentInfo.performanceMetrics.find(([key]) => key === 'tasks_completed')?.[1] || 0;
            score += Math.min(tasksCompleted * 2, 20);
            if (score > bestScore) {
                bestScore = score;
                bestCoordinator = agentId;
            }
        }
        return bestCoordinator;
    }
    /**
     * Execute collaboration between agents
     */
    async executeCollaboration(collaboration) {
        const startTime = Date.now();
        try {
            let result;
            switch (collaboration.strategy) {
                case 'sequential':
                    result = await this.executeSequentialCollaboration(collaboration);
                    break;
                case 'parallel':
                    result = await this.executeParallelCollaboration(collaboration);
                    break;
                case 'hierarchical':
                    result = await this.executeHierarchicalCollaboration(collaboration);
                    break;
                case 'democratic':
                    result = await this.executeDemocraticCollaboration(collaboration);
                    break;
                case 'auction':
                    result = await this.executeAuctionCollaboration(collaboration);
                    break;
                default:
                    throw new Error(`Unknown collaboration strategy: ${collaboration.strategy}`);
            }
            collaboration.status = result.success ? 'completed' : 'failed';
            collaboration.completedAt = new Date();
            this.emit('collaborationCompleted', {
                collaborationId: collaboration.id,
                result,
                duration: Date.now() - startTime,
                timestamp: new Date()
            });
            return result;
        }
        catch (error) {
            collaboration.status = 'failed';
            collaboration.completedAt = new Date();
            this.emit('collaborationFailed', {
                collaborationId: collaboration.id,
                error,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Execute sequential collaboration (pipeline)
     */
    async executeSequentialCollaboration(collaboration) {
        const results = [];
        let previousResult = null;
        for (const agentId of collaboration.participants) {
            const agent = this.agents.get(agentId);
            const taskParams = {
                ...collaboration.task.parameters,
                previousResult
            };
            const result = await agent.executeTask(collaboration.task.type, taskParams);
            results.push(result);
            if (!result.success) {
                // Stop pipeline on failure
                break;
            }
            previousResult = result.result;
        }
        // Combine results
        const overallSuccess = results.every(r => r.success);
        const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        return {
            success: overallSuccess,
            result: {
                type: 'sequential_collaboration',
                steps: results,
                finalResult: previousResult
            },
            confidence: averageConfidence,
            reasoning: `Sequential collaboration with ${results.length} steps, ${results.filter(r => r.success).length} successful`,
            artifacts: results.flatMap(r => r.artifacts || [])
        };
    }
    /**
     * Execute parallel collaboration
     */
    async executeParallelCollaboration(collaboration) {
        const agentPromises = collaboration.participants.map(async (agentId) => {
            const agent = this.agents.get(agentId);
            return await agent.executeTask(collaboration.task.type, collaboration.task.parameters);
        });
        const results = await Promise.all(agentPromises);
        // Combine results using voting or consensus
        const successCount = results.filter(r => r.success).length;
        const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        return {
            success: successCount > results.length / 2, // Majority vote
            result: {
                type: 'parallel_collaboration',
                results,
                consensus: this.buildConsensus(results)
            },
            confidence: averageConfidence,
            reasoning: `Parallel collaboration with ${results.length} agents, ${successCount} successful`,
            artifacts: results.flatMap(r => r.artifacts || [])
        };
    }
    /**
     * Execute hierarchical collaboration
     */
    async executeHierarchicalCollaboration(collaboration) {
        const coordinator = this.agents.get(collaboration.coordinator);
        // Coordinator delegates and oversees
        const delegationResult = await coordinator.executeTask('coordinate', {
            task: collaboration.task,
            participants: collaboration.participants.filter(id => id !== collaboration.coordinator),
            strategy: 'hierarchical'
        });
        return delegationResult;
    }
    /**
     * Execute democratic collaboration
     */
    async executeDemocraticCollaboration(collaboration) {
        // All agents participate in decision making
        const votingResults = await this.conductVoting(collaboration);
        return votingResults;
    }
    /**
     * Execute auction-based collaboration
     */
    async executeAuctionCollaboration(collaboration) {
        // Agents bid for task execution based on capability and availability
        const winner = await this.conductAuction(collaboration);
        const winningAgent = this.agents.get(winner);
        return await winningAgent.executeTask(collaboration.task.type, collaboration.task.parameters);
    }
    /**
     * Build consensus from multiple results
     */
    buildConsensus(results) {
        // Simple consensus building - in production, this would be more sophisticated
        const successfulResults = results.filter(r => r.success);
        if (successfulResults.length === 0) {
            return { message: 'No successful results to build consensus from' };
        }
        // Return the result with highest confidence
        successfulResults.sort((a, b) => b.confidence - a.confidence);
        return successfulResults[0].result;
    }
    /**
     * Conduct voting among agents
     */
    async conductVoting(collaboration) {
        // Simplified voting mechanism
        const votes = [];
        for (const agentId of collaboration.participants) {
            const agent = this.agents.get(agentId);
            const vote = await agent.executeTask('vote', {
                proposal: collaboration.task,
                participants: collaboration.participants
            });
            votes.push(vote);
        }
        const consensus = this.buildConsensus(votes);
        const averageConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;
        return {
            success: votes.filter(v => v.success).length > votes.length / 2,
            result: consensus,
            confidence: averageConfidence,
            reasoning: 'Democratic decision through agent voting'
        };
    }
    /**
     * Conduct auction for task assignment
     */
    async conductAuction(collaboration) {
        const bids = new Map();
        for (const agentId of collaboration.participants) {
            const agent = this.agents.get(agentId);
            const agentInfo = agent.getInfo();
            // Calculate bid based on capability, availability, and performance
            let bid = 0;
            // Capability match
            const hasCapability = collaboration.task.requiredCapabilities.every(reqCap => agentInfo.capabilities.some(cap => cap.name === reqCap));
            if (hasCapability)
                bid += 50;
            // Availability
            if (agentInfo.state.status === 'idle')
                bid += 30;
            // Performance
            const successRate = agentInfo.performanceMetrics.find(([key]) => key === 'success_rate')?.[1] || 0.5;
            bid += successRate * 20;
            bids.set(agentId, bid);
        }
        // Select highest bidder
        let winner = collaboration.participants[0];
        let highestBid = 0;
        for (const [agentId, bid] of bids) {
            if (bid > highestBid) {
                highestBid = bid;
                winner = agentId;
            }
        }
        return winner;
    }
    /**
     * Handle message routing between agents
     */
    handleAgentMessage(message) {
        this.messageQueue.push(message);
        this.metrics.messagesProcessed++;
        // Route message to target agent or broadcast
        if (message.toAgent) {
            const targetAgent = this.agents.get(message.toAgent);
            if (targetAgent) {
                targetAgent.receiveMessage(message);
            }
        }
        else {
            // Broadcast to all agents except sender
            for (const [agentId, agent] of this.agents) {
                if (agentId !== message.fromAgent) {
                    agent.receiveMessage(message);
                }
            }
        }
        this.emit('messageRouted', {
            messageId: message.id,
            fromAgent: message.fromAgent,
            toAgent: message.toAgent,
            type: message.type,
            timestamp: new Date()
        });
    }
    /**
     * Handle agent task completion
     */
    handleAgentTaskCompleted(data) {
        this.updateAgentUtilization(data.agentId, false);
        this.emit('agentTaskCompleted', {
            agentId: data.agentId,
            taskType: data.taskType,
            duration: data.duration,
            timestamp: new Date()
        });
    }
    /**
     * Handle agent task error
     */
    handleAgentTaskError(data) {
        this.updateAgentUtilization(data.agentId, false);
        // Implement failover if enabled
        if (this.config.failoverEnabled) {
            this.handleAgentFailover(data.agentId, data.taskType, data.error);
        }
        this.emit('agentTaskError', {
            agentId: data.agentId,
            taskType: data.taskType,
            error: data.error,
            timestamp: new Date()
        });
    }
    /**
     * Handle agent failover
     */
    async handleAgentFailover(failedAgentId, taskType, error) {
        // Find backup agent
        const backupAgents = Array.from(this.agents.keys()).filter(id => id !== failedAgentId);
        if (backupAgents.length > 0) {
            const backupAgent = this.agents.get(backupAgents[0]);
            this.emit('failoverTriggered', {
                failedAgent: failedAgentId,
                backupAgent: backupAgents[0],
                taskType,
                timestamp: new Date()
            });
            // Reassign task would happen here in production
        }
    }
    /**
     * Update agent utilization metrics
     */
    updateAgentUtilization(agentId, isBusy) {
        const currentUtil = this.metrics.agentUtilization.get(agentId) || 0;
        const newUtil = isBusy ? Math.min(currentUtil + 0.1, 1.0) : Math.max(currentUtil - 0.1, 0);
        this.metrics.agentUtilization.set(agentId, newUtil);
    }
    /**
     * Update agent metrics from state changes
     */
    updateAgentMetrics(agentId, state) {
        const isBusy = state.status !== 'idle';
        this.updateAgentUtilization(agentId, isBusy);
    }
    /**
     * Update task completion metrics
     */
    updateTaskMetrics(task, success) {
        if (success) {
            this.metrics.completedTasks++;
        }
        else {
            this.metrics.failedTasks++;
        }
        // Update average task time
        if (task.completedAt) {
            const duration = task.completedAt.getTime() - task.createdAt.getTime();
            const totalTasks = this.metrics.completedTasks + this.metrics.failedTasks;
            this.metrics.averageTaskTime =
                (this.metrics.averageTaskTime * (totalTasks - 1) + duration) / totalTasks;
        }
    }
    /**
     * Reassign tasks from removed agent
     */
    async reassignAgentTasks(removedAgentId) {
        // Find tasks assigned to removed agent and reassign them
        for (const task of this.tasks.values()) {
            if (task.assignedAgents?.includes(removedAgentId) && task.status === 'in_progress') {
                // Mark for reassignment (simplified)
                task.status = 'pending';
                task.assignedAgents = task.assignedAgents.filter(id => id !== removedAgentId);
            }
        }
    }
    /**
     * Start message processing loop
     */
    startMessageProcessing() {
        const processMessages = () => {
            if (!this.isRunning)
                return;
            // Process message queue
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                // Message is already routed in handleAgentMessage
            }
            // Clean up old messages
            if (this.messageQueue.length > this.config.messageRetention) {
                this.messageQueue.splice(0, this.messageQueue.length - this.config.messageRetention);
            }
            setTimeout(processMessages, 100); // Process every 100ms
        };
        processMessages();
    }
    /**
     * Start monitoring loop
     */
    startMonitoring() {
        const monitor = () => {
            if (!this.isRunning)
                return;
            // Update system metrics
            this.metrics.systemUptime = Date.now() - this.startTime.getTime();
            // Process agent task queues
            for (const agent of this.agents.values()) {
                agent.processTaskQueue();
            }
            this.emit('systemMonitoring', {
                metrics: this.metrics,
                timestamp: new Date()
            });
            setTimeout(monitor, 5000); // Monitor every 5 seconds
        };
        monitor();
    }
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            agentCount: this.agents.size,
            activeTasks: Array.from(this.tasks.values()).filter(t => t.status === 'in_progress').length,
            activeCollaborations: Array.from(this.collaborations.values()).filter(c => c.status === 'active').length,
            messageQueueLength: this.messageQueue.length,
            metrics: this.metrics,
            uptime: Date.now() - this.startTime.getTime(),
            config: this.config
        };
    }
    /**
     * Get agent details
     */
    getAgentDetails(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? agent.getInfo() : null;
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        const agentDetails = [];
        for (const [agentId, agent] of this.agents) {
            agentDetails.push(agent.getInfo());
        }
        return agentDetails;
    }
    /**
     * Get task history
     */
    getTaskHistory() {
        return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * Get collaboration history
     */
    getCollaborationHistory() {
        return Array.from(this.collaborations.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
    /**
     * Shutdown the system
     */
    async shutdown() {
        this.isRunning = false;
        // Complete ongoing tasks (with timeout)
        const activeCollaborations = Array.from(this.collaborations.values())
            .filter(c => c.status === 'active');
        await Promise.allSettled(activeCollaborations.map(async (collaboration) => new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
        ));
        // Clean up all agents
        for (const agent of this.agents.values()) {
            agent.dispose();
        }
        this.agents.clear();
        this.tasks.clear();
        this.collaborations.clear();
        this.messageQueue = [];
        this.emit('systemShutdown', {
            timestamp: new Date(),
            uptime: Date.now() - this.startTime.getTime()
        });
        this.removeAllListeners();
    }
}
exports.MultiAgentSystem = MultiAgentSystem;
