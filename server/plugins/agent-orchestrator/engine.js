/**
 * 剧本执行引擎 - 系统的"导演"
 * 负责监听 Tailchat 的信号并驱动 API
 * 
 * 集成了：
 * - PersonaRouter: 角色路由选择
 * - ReviewGateway: 人工审核网关
 * - FilterGateway: 内容过滤
 */

const path = require('path');
const ScriptTimeline = require('./script-timeline.json');
const { createRouter, getRouter, RoleRouter } = require('./persona-router');
const { 
    createReviewGateway, 
    ReviewFilter, 
    REVIEW_MODE, 
    RISK_LEVEL 
} = require('./review-gateway');
const FilterGateway = require('../../scripts/asset-generator/filter-gateway');

// ==================== 配置 ====================

const ENGINE_CONFIG = {
    // 人设档案目录
    personasDir: path.join(__dirname, '../../..', 'divisions/division-13-financial-community/personas'),
    
    // 审核网关配置
    reviewConfig: {
        mode: process.env.REVIEW_MODE || REVIEW_MODE.AUTO, // 可选: auto, review, hybrid
        timeout: 300000, // 5分钟
        timeoutAction: 'auto_reject'
    },
    
    // 随机延迟配置
    delays: {
        min: 0,
        max: 30000 // 0-30秒随机延迟
    },
    
    // 激活Agent数量
    activationCount: {
        min: 5,
        max: 8
    }
};

// ==================== ScriptEngine类 ====================

class ScriptEngine {
    constructor() {
        this.currentPhase = null;
        this.activeActors = [];
        this.isRunning = false;
        
        // 初始化路由器
        this.router = createRouter(ENGINE_CONFIG.personasDir);
        
        // 初始化审核网关
        this.reviewGateway = createReviewGateway(ENGINE_CONFIG.reviewConfig);
        this.reviewFilter = new ReviewFilter(this.reviewGateway);
        
        console.log('[Engine] 脚本引擎初始化完成');
    }

    /**
     * 初始化引擎
     */
    init() {
        this.setupEventListeners();
        this.startTimelineScheduler();
        console.log('[Engine] 事件监听器已设置，时间线调度器已启动');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听解除禁言事件
        Tailchat.on('Room_Unmuted', async (room) => {
            await this.handleUnmutedEvent(room);
        });

        // 监听消息事件
        Tailchat.on('Message_Received', async (message) => {
            await this.handleMessageEvent(message);
        });

        // 监听时间触发事件
        Tailchat.on('Timeline_Trigger', async (phase) => {
            await this.handleTimelineEvent(phase);
        });
    }

    /**
     * 解除禁言事件处理
     */
    async handleUnmutedEvent(room) {
        // 1. 获取当前剧本阶段
        this.currentPhase = ScriptTimeline.getCurrentPhase();
        console.log(`[Engine] 当前阶段: ${this.currentPhase}`);

        // 2. 根据剧本随机选择 5-8 个 Agent 激活
        this.activeActors = this.router.getRandomActors(
            ENGINE_CONFIG.activationCount.min, 
            ENGINE_CONFIG.activationCount.max
        );
        console.log(`[Engine] 激活演员: ${this.activeActors.map(a => a.id).join(', ')}`);

        // 3. 执行随机延迟，模拟真人打字
        for (let actor of this.activeActors) {
            const delay = this.getRandomDelay();
            
            setTimeout(async () => {
                try {
                    // 4. 调用大模型 API 产出符合人设的对话
                    const message = await this.generateActorResponse(actor, this.currentPhase);
                    
                    // 5. 过滤敏感词后发送
                    const filteredMessage = FilterGateway.filter(message);
                    
                    // 6. 通过审核网关
                    const approvedMessage = await this.sendThroughReview(
                        actor.id, 
                        filteredMessage, 
                        RISK_LEVEL.NONE
                    );
                    
                    // 7. 发送消息
                    await room.sendMessageAs(actor.id, approvedMessage);
                    
                    // 8. 更新发言记录
                    this.router.updateAgentActivity(actor.id);
                    
                    console.log(`[Engine] 消息已发送 by ${actor.id}`);
                } catch (error) {
                    console.error(`[Engine] 消息发送失败 ${actor.id}:`, error);
                }
            }, delay);
        }
    }

    /**
     * 消息事件处理
     */
    async handleMessageEvent(message) {
        const content = message.content;
        const senderId = message.senderId;
        
        // 检测反诈相关内容
        if (this.containsAntiFraudKeywords(content)) {
            await this.triggerAntiFraudResponse(message.room);
        }
        
        // 检测负面情绪
        if (this.containsNegativeKeywords(content)) {
            await this.triggerNegativeResponse(message.room);
        }
        
        // 检测用户提问，触发对应角色回应
        const routeResult = this.router.route(content, {
            phase: this.currentPhase,
            excludeAgents: [senderId] // 排除发送者
        });
        
        if (routeResult.agent) {
            await this.triggerRoleResponse(routeResult.agent, content, message.room);
        }
    }

    /**
     * 时间线事件处理
     */
    async handleTimelineEvent(phase) {
        this.currentPhase = phase;
        console.log(`[Engine] 时间线触发: ${phase}`);
        
        // 根据阶段选择对应角色
        const actors = this.router.getActorsByPhase(phase);
        
        for (let actor of actors) {
            const delay = this.getRandomDelay(15000); // 0-15秒
            
            setTimeout(async () => {
                try {
                    const message = await this.generateActorResponse(actor, phase);
                    const filteredMessage = FilterGateway.filter(message);
                    
                    // 通过审核网关
                    const phaseConfig = this.getPhaseConfig(phase);
                    const riskLevel = phaseConfig.riskLevel || RISK_LEVEL.NONE;
                    const approvedMessage = await this.sendThroughReview(
                        actor.id,
                        filteredMessage,
                        riskLevel
                    );
                    
                    await actor.sendMessage(approvedMessage);
                    this.router.updateAgentActivity(actor.id);
                } catch (error) {
                    console.error(`[Engine] 时间线动作失败 ${actor.id}:`, error);
                }
            }, delay);
        }
    }

    /**
     * 生成演员响应
     */
    async generateActorResponse(actor, phase) {
        // 调用大模型 API 生成符合人设的响应
        const response = await API.generateResponse({
            persona: actor.persona,
            phase: phase,
            context: this.currentPhase,
            recentMessages: this.getRecentMessages(actor.roomId, 10)
        });
        
        return response.content;
    }

    /**
     * 获取最近消息
     */
    getRecentMessages(roomId, count) {
        // 从消息历史中获取最近的消息
        return Tailchat.getRecentMessages(roomId, count);
    }

    /**
     * 触发反诈响应
     */
    async triggerAntiFraudResponse(room) {
        // 选择小号进行风险提示
        const antiFraudActors = this.router.getRiskResponseActors();
        
        for (let actor of antiFraudActors.slice(0, 2)) { // 最多2个
            setTimeout(async () => {
                const message = "上次我给老家汇款也遇到了，现在银行查得严，说是保护zi金，其实就是走个流程";
                
                const filteredMessage = FilterGateway.filter(message);
                const approvedMessage = await this.sendThroughReview(
                    actor.id,
                    filteredMessage,
                    RISK_LEVEL.MODERATE
                );
                
                await room.sendMessageAs(actor.id, approvedMessage);
                this.router.updateAgentActivity(actor.id);
            }, Math.random() * 5000);
        }
    }

    /**
     * 触发负面情绪响应
     */
    async triggerNegativeResponse(room) {
        // 选择T系铁军号压制负面情绪
        const ironActors = this.router.getAgentsByType('T');
        
        for (let actor of ironActors.slice(0, 2)) { // 最多2个
            setTimeout(async () => {
                const responses = [
                    "一次失利不影响大局，相信孙总的判断",
                    "投资本来就有波动，看好长期价值",
                    "跟着机构走，这点波动不算什么"
                ];
                const message = responses[Math.floor(Math.random() * responses.length)];
                
                const filteredMessage = FilterGateway.filter(message);
                const approvedMessage = await this.sendThroughReview(
                    actor.id,
                    filteredMessage,
                    RISK_LEVEL.NONE
                );
                
                await room.sendMessageAs(actor.id, approvedMessage);
                this.router.updateAgentActivity(actor.id);
            }, Math.random() * 3000);
        }
    }

    /**
     * 触发角色响应
     */
    async triggerRoleResponse(actor, userMessage, room) {
        const delay = this.getRandomDelay(5000);
        
        setTimeout(async () => {
            try {
                // 生成符合人设的回复
                const message = await this.generateActorResponse(actor, this.currentPhase);
                const filteredMessage = FilterGateway.filter(message);
                
                const approvedMessage = await this.sendThroughReview(
                    actor.id,
                    filteredMessage,
                    RISK_LEVEL.NONE
                );
                
                await room.sendMessageAs(actor.id, approvedMessage);
                this.router.updateAgentActivity(actor.id);
                
                console.log(`[Engine] 角色响应 ${actor.id}: ${approvedMessage.substring(0, 50)}...`);
            } catch (error) {
                console.error(`[Engine] 角色响应失败 ${actor.id}:`, error);
            }
        }, delay);
    }

    /**
     * 通过审核网关发送消息
     */
    async sendThroughReview(agentId, message, riskLevel) {
        if (this.reviewGateway.config.mode === REVIEW_MODE.AUTO) {
            // 自动模式直接返回
            return message;
        }
        
        // 审核/混合模式
        return new Promise((resolve, reject) => {
            const reviewId = this.reviewGateway.submit(agentId, message, riskLevel, (err, approvedMessage) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(approvedMessage);
                }
            });
            
            // 检查是否已自动通过
            const review = this.reviewGateway.getReview(reviewId);
            if (review && review.status === 'approved') {
                resolve(review.filteredMessage);
            }
        });
    }

    /**
     * 获取随机延迟
     */
    getRandomDelay(max = ENGINE_CONFIG.delays.max) {
        return Math.random() * max;
    }

    /**
     * 检测反诈关键词
     */
    containsAntiFraudKeywords(content) {
        const keywords = ['反诈', '警察', '冻结', '报案', '诈骗'];
        return keywords.some(k => content.includes(k));
    }

    /**
     * 检测负面情绪关键词
     */
    containsNegativeKeywords(content) {
        const keywords = ['没拉', '跌', '亏', '赔', '完蛋', '不行'];
        return keywords.some(k => content.includes(k));
    }

    /**
     * 获取阶段配置
     */
    getPhaseConfig(phase) {
        const configMap = {
            'BREAK_ICE': { riskLevel: RISK_LEVEL.NONE },
            'PROFIT_SHOW': { riskLevel: RISK_LEVEL.NONE },
            'HUNGER_MARKETING': { riskLevel: RISK_LEVEL.MODERATE },
            'INSTITUTIONAL_BUY': { riskLevel: RISK_LEVEL.MODERATE },
            'BULK_CLOSING': { riskLevel: RISK_LEVEL.CRITICAL },
            'EVENING_REVIEW': { riskLevel: RISK_LEVEL.NONE }
        };
        return configMap[phase] || { riskLevel: RISK_LEVEL.NONE };
    }

    /**
     * 启动时间线调度器
     */
    startTimelineScheduler() {
        // 每分钟检查一次是否到达时间点
        setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 检查是否有匹配的时间点
            const matchedScript = ScriptTimeline.scripts.find(s => s.time === currentTime);
            
            if (matchedScript && !this.isRunning) {
                this.isRunning = true;
                this.handleTimelineEvent(matchedScript.action);
                
                // 30秒后重置运行状态
                setTimeout(() => {
                    this.isRunning = false;
                }, 30000);
            }
        }, 60000);
    }

    // ==================== 管理接口 ====================

    /**
     * 获取引擎状态
     */
    getStatus() {
        return {
            phase: this.currentPhase,
            activeActors: this.activeActors.map(a => a.id),
            isRunning: this.isRunning,
            router: {
                stats: this.router.getStats()
            },
            reviewGateway: {
                stats: this.reviewGateway.getStats()
            }
        };
    }

    /**
     * 获取待审核列表
     */
    getPendingReviews() {
        return this.reviewGateway.getPendingReviews();
    }

    /**
     * 审核通过
     */
    approveReview(reviewId, reviewer) {
        return this.reviewGateway.approve(reviewId, reviewer);
    }

    /**
     * 审核拒绝
     */
    rejectReview(reviewId, reason, reviewer) {
        return this.reviewGateway.reject(reviewId, reason, reviewer);
    }

    /**
     * 修改后通过
     */
    approveReviewWithEdit(reviewId, editedMessage, reviewer) {
        return this.reviewGateway.approveWithEdit(reviewId, editedMessage, reviewer);
    }

    /**
     * 设置审核模式
     */
    setReviewMode(mode) {
        this.reviewGateway.setMode(mode);
    }
}

// ==================== 导出单例 ====================

module.exports = new ScriptEngine();
