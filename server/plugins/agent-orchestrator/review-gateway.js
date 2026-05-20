/**
 * Review Gateway: 人工审核网关
 * 负责对Agent产出内容进行合规审核和人工审核
 * 
 * 功能：
 * 1. 审核模式管理（auto/review/hybrid）
 * 2. 审核队列管理
 * 3. 风险等级处理
 * 4. 超时处理
 * 5. 审核日志
 */

const fs = require('fs');
const path = require('path');

// ==================== 常量定义 ====================

// 审核模式
const REVIEW_MODE = {
    AUTO: 'auto',      // 自动放行
    REVIEW: 'review',   // 人工审核模式
    HYBRID: 'hybrid'    // 混合模式
};

// 风险等级
const RISK_LEVEL = {
    NONE: 'none',           // 无风险
    MODERATE: 'moderate',   // 中等风险
    CRITICAL: 'critical'    // 高风险
};

// 审核状态
const REVIEW_STATUS = {
    PENDING: 'pending',     // 待审核
    APPROVED: 'approved',    // 已通过
    REJECTED: 'rejected'     // 已拒绝
};

// 默认配置
const DEFAULT_CONFIG = {
    mode: REVIEW_MODE.AUTO,
    timeout: 300000,                    // 5分钟超时
    timeoutAction: 'auto_reject',        // 超时后自动拒绝（安全优先）
    autoApproveNone: true,               // none级别自动放行
    autoApproveModerate: false,         // moderate级别不自动放行
    requireApprovalForCritical: true,   // critical必须审核
    logDir: './logs/review',
    maxLogFiles: 30                      // 保留30天日志
};

// ==================== Review类 ====================

class Review {
    constructor(id, agentId, message, riskLevel) {
        this.id = id;
        this.agentId = agentId;
        this.originalMessage = message;
        this.filteredMessage = message;
        this.riskLevel = riskLevel;
        this.status = REVIEW_STATUS.PENDING;
        this.submittedAt = Date.now();
        this.reviewedAt = null;
        this.reviewer = null;
        this.editHistory = [];
        this.callback = null; // 审核完成后的回调函数
        this.editNote = null; // 审核备注
    }
    
    /**
     * 审核通过
     * @param {string} reviewer - 审核人
     * @param {string} editedMessage - 修改后的消息（可选）
     */
    approve(reviewer, editedMessage = null) {
        this.status = REVIEW_STATUS.APPROVED;
        this.reviewedAt = Date.now();
        this.reviewer = reviewer;
        
        if (editedMessage && editedMessage !== this.filteredMessage) {
            this.editHistory.push({
                type: 'edit',
                before: this.filteredMessage,
                after: editedMessage,
                timestamp: Date.now()
            });
            this.filteredMessage = editedMessage;
        }
    }
    
    /**
     * 审核拒绝
     * @param {string} reviewer - 审核人
     * @param {string} reason - 拒绝原因
     */
    reject(reviewer, reason) {
        this.status = REVIEW_STATUS.REJECTED;
        this.reviewedAt = Date.now();
        this.reviewer = reviewer;
        this.editNote = reason;
    }
    
    /**
     * 检查是否超时
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {boolean}
     */
    isTimeout(timeout) {
        return Date.now() - this.submittedAt > timeout;
    }
    
    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            agentId: this.agentId,
            originalMessage: this.originalMessage,
            filteredMessage: this.filteredMessage,
            riskLevel: this.riskLevel,
            status: this.status,
            submittedAt: this.submittedAt,
            reviewedAt: this.reviewedAt,
            reviewer: this.reviewer,
            editHistory: this.editHistory,
            editNote: this.editNote
        };
    }
}

// ==================== ReviewGateway类 ====================

class ReviewGateway {
    constructor(config = {}) {
        // 合并配置
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // 审核队列
        this.reviews = new Map(); // id -> Review
        this.pendingQueue = []; // 待审核队列（按时间排序）
        
        // 统计数据
        this.stats = {
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
            autoApproved: 0,
            timeoutRejected: 0,
            avgResponseTime: 0,
            totalReviewTime: 0
        };
        
        // 审核历史记录
        this.history = [];
        
        // 初始化日志目录
        this.initLogDir();
        
        // 启动超时检查
        this.startTimeoutChecker();
    }
    
    /**
     * 初始化日志目录
     */
    initLogDir() {
        try {
            if (!fs.existsSync(this.config.logDir)) {
                fs.mkdirSync(this.config.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('[ReviewGateway] 初始化日志目录失败:', error);
        }
    }
    
    /**
     * 生成唯一ID
     * @returns {string}
     */
    generateId() {
        return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 提交Agent输出到审核队列
     * @param {string} agentId - Agent ID
     * @param {string} message - 消息内容
     * @param {string} riskLevel - 风险等级
     * @param {function} callback - 审核完成后的回调
     * @returns {string} reviewId
     */
    submit(agentId, message, riskLevel = RISK_LEVEL.NONE, callback = null) {
        const reviewId = this.generateId();
        const review = new Review(reviewId, agentId, message, riskLevel);
        review.callback = callback;
        
        this.reviews.set(reviewId, review);
        this.pendingQueue.push(review);
        this.stats.total++;
        this.stats.pending++;
        
        // 根据模式决定是否自动放行
        if (this.shouldAutoApprove(riskLevel)) {
            this.autoApprove(reviewId, 'system');
        }
        
        // 记录日志
        this.logReviewAction(reviewId, 'submit', {
            agentId,
            riskLevel,
            mode: this.config.mode
        });
        
        return reviewId;
    }
    
    /**
     * 判断是否应该自动放行
     * @param {string} riskLevel - 风险等级
     * @returns {boolean}
     */
    shouldAutoApprove(riskLevel) {
        switch (this.config.mode) {
            case REVIEW_MODE.AUTO:
                return true;
                
            case REVIEW_MODE.HYBRID:
                if (riskLevel === RISK_LEVEL.NONE && this.config.autoApproveNone) {
                    return true;
                }
                if (riskLevel === RISK_LEVEL.MODERATE && this.config.autoApproveModerate) {
                    return true;
                }
                return false;
                
            case REVIEW_MODE.REVIEW:
            default:
                return false;
        }
    }
    
    /**
     * 自动放行
     * @param {string} reviewId - 审核ID
     * @param {string} reviewer - 审核人
     */
    autoApprove(reviewId, reviewer = 'system') {
        const review = this.reviews.get(reviewId);
        if (!review || review.status !== REVIEW_STATUS.PENDING) {
            return false;
        }
        
        review.approve(reviewer);
        this.stats.approved++;
        this.stats.pending--;
        this.stats.autoApproved++;
        
        // 从待审核队列移除
        this.pendingQueue = this.pendingQueue.filter(r => r.id !== reviewId);
        
        // 执行回调
        if (review.callback) {
            try {
                review.callback(null, review.filteredMessage);
            } catch (error) {
                console.error('[ReviewGateway] 回调执行失败:', error);
            }
        }
        
        // 记录日志
        this.logReviewAction(reviewId, 'auto_approve', { reviewer });
        
        return true;
    }
    
    /**
     * 获取待审核消息列表
     * @param {object} filter - 过滤条件 { agentId, riskLevel, limit }
     * @returns {Review[]}
     */
    getPendingReviews(filter = {}) {
        let pending = this.pendingQueue.filter(r => r.status === REVIEW_STATUS.PENDING);
        
        if (filter.agentId) {
            pending = pending.filter(r => r.agentId === filter.agentId);
        }
        
        if (filter.riskLevel) {
            pending = pending.filter(r => r.riskLevel === filter.riskLevel);
        }
        
        // 按提交时间排序
        pending.sort((a, b) => a.submittedAt - b.submittedAt);
        
        if (filter.limit) {
            pending = pending.slice(0, filter.limit);
        }
        
        return pending.map(r => r.toJSON());
    }
    
    /**
     * 获取指定审核详情
     * @param {string} reviewId - 审核ID
     * @returns {Review|null}
     */
    getReview(reviewId) {
        const review = this.reviews.get(reviewId);
        return review ? review.toJSON() : null;
    }
    
    /**
     * 审核通过，放行消息
     * @param {string} reviewId - 审核ID
     * @param {string} reviewer - 审核人
     * @returns {boolean}
     */
    approve(reviewId, reviewer = 'admin') {
        const review = this.reviews.get(reviewId);
        if (!review || review.status !== REVIEW_STATUS.PENDING) {
            return false;
        }
        
        review.approve(reviewer);
        this.stats.approved++;
        this.stats.pending--;
        
        // 更新平均响应时间
        const responseTime = review.reviewedAt - review.submittedAt;
        this.stats.totalReviewTime += responseTime;
        this.stats.avgResponseTime = this.stats.totalReviewTime / this.stats.approved;
        
        // 从待审核队列移除
        this.pendingQueue = this.pendingQueue.filter(r => r.id !== reviewId);
        
        // 执行回调
        if (review.callback) {
            try {
                review.callback(null, review.filteredMessage);
            } catch (error) {
                console.error('[ReviewGateway] 回调执行失败:', error);
            }
        }
        
        // 记录日志
        this.logReviewAction(reviewId, 'approve', { reviewer });
        
        return true;
    }
    
    /**
     * 审核拒绝，丢弃消息
     * @param {string} reviewId - 审核ID
     * @param {string} reason - 拒绝原因
     * @param {string} reviewer - 审核人
     * @returns {boolean}
     */
    reject(reviewId, reason, reviewer = 'admin') {
        const review = this.reviews.get(reviewId);
        if (!review || review.status !== REVIEW_STATUS.PENDING) {
            return false;
        }
        
        review.reject(reviewer, reason);
        this.stats.rejected++;
        this.stats.pending--;
        
        // 从待审核队列移除
        this.pendingQueue = this.pendingQueue.filter(r => r.id !== reviewId);
        
        // 执行回调（传递错误）
        if (review.callback) {
            try {
                review.callback(new Error(`审核拒绝: ${reason}`), null);
            } catch (error) {
                console.error('[ReviewGateway] 回调执行失败:', error);
            }
        }
        
        // 记录日志
        this.logReviewAction(reviewId, 'reject', { reviewer, reason });
        
        return true;
    }
    
    /**
     * 修改后通过
     * @param {string} reviewId - 审核ID
     * @param {string} editedMessage - 修改后的消息
     * @param {string} reviewer - 审核人
     * @returns {boolean}
     */
    approveWithEdit(reviewId, editedMessage, reviewer = 'admin') {
        const review = this.reviews.get(reviewId);
        if (!review || review.status !== REVIEW_STATUS.PENDING) {
            return false;
        }
        
        review.approve(reviewer, editedMessage);
        this.stats.approved++;
        this.stats.pending++;
        
        // 更新平均响应时间
        const responseTime = review.reviewedAt - review.submittedAt;
        this.stats.totalReviewTime += responseTime;
        this.stats.avgResponseTime = this.stats.totalReviewTime / this.stats.approved;
        
        // 从待审核队列移除
        this.pendingQueue = this.pendingQueue.filter(r => r.id !== reviewId);
        
        // 执行回调
        if (review.callback) {
            try {
                review.callback(null, review.filteredMessage);
            } catch (error) {
                console.error('[ReviewGateway] 回调执行失败:', error);
            }
        }
        
        // 记录日志
        this.logReviewAction(reviewId, 'approve_with_edit', { 
            reviewer, 
            originalLength: review.originalMessage.length,
            editedLength: editedMessage.length 
        });
        
        return true;
    }
    
    /**
     * 获取审核统计
     * @returns {object}
     */
    getStats() {
        return {
            ...this.stats,
            pendingCount: this.pendingQueue.length,
            mode: this.config.mode
        };
    }
    
    /**
     * 获取历史记录
     * @param {object} filter - 过滤条件 { agentId, status, startTime, endTime, limit }
     * @returns {object[]}
     */
    getHistory(filter = {}) {
        let history = [...this.history];
        
        if (filter.agentId) {
            history = history.filter(h => h.agentId === filter.agentId);
        }
        
        if (filter.status) {
            history = history.filter(h => h.status === filter.status);
        }
        
        if (filter.startTime) {
            history = history.filter(h => h.timestamp >= filter.startTime);
        }
        
        if (filter.endTime) {
            history = history.filter(h => h.timestamp <= filter.endTime);
        }
        
        if (filter.limit) {
            history = history.slice(-filter.limit);
        }
        
        return history;
    }
    
    /**
     * 启动超时检查器
     */
    startTimeoutChecker() {
        // 每30秒检查一次超时
        setInterval(() => {
            this.checkTimeouts();
        }, 30000);
    }
    
    /**
     * 检查超时
     */
    checkTimeouts() {
        const now = Date.now();
        const toRemove = [];
        
        for (const review of this.pendingQueue) {
            if (review.isTimeout(this.config.timeout)) {
                toRemove.push(review);
            }
        }
        
        for (const review of toRemove) {
            console.log(`[ReviewGateway] 审核超时: ${review.id}`);
            
            switch (this.config.timeoutAction) {
                case 'auto_approve':
                    this.autoApprove(review.id, 'system_timeout');
                    break;
                    
                case 'auto_reject':
                    this.reject(review.id, '审核超时，自动拒绝', 'system_timeout');
                    this.stats.timeoutRejected++;
                    break;
                    
                case 'alert':
                    // 仅告警，不处理
                    this.logReviewAction(review.id, 'timeout_alert', {
                        waitTime: now - review.submittedAt
                    });
                    break;
                    
                default:
                    this.reject(review.id, '审核超时，自动拒绝', 'system_timeout');
            }
        }
    }
    
    /**
     * 记录审核日志
     * @param {string} reviewId - 审核ID
     * @param {string} action - 操作类型
     * @param {object} details - 详细信息
     */
    logReviewAction(reviewId, action, details = {}) {
        const review = this.reviews.get(reviewId);
        if (!review) return;
        
        const logEntry = {
            timestamp: Date.now(),
            reviewId,
            action,
            agentId: review.agentId,
            riskLevel: review.riskLevel,
            status: review.status,
            reviewer: review.reviewer,
            details
        };
        
        // 添加到历史记录
        this.history.push(logEntry);
        
        // 写入日志文件
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.config.logDir, `review-${today}.log`);
            
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(logFile, logLine, 'utf-8');
        } catch (error) {
            console.error('[ReviewGateway] 写入日志失败:', error);
        }
    }
    
    /**
     * 设置审核模式
     * @param {string} mode - 模式
     */
    setMode(mode) {
        if (Object.values(REVIEW_MODE).includes(mode)) {
            this.config.mode = mode;
            console.log(`[ReviewGateway] 审核模式已切换为: ${mode}`);
        }
    }
    
    /**
     * 清空历史记录
     */
    clearHistory() {
        this.history = [];
    }
    
    /**
     * 清空所有待审核队列
     */
    clearPending() {
        for (const reviewId of this.pendingQueue) {
            const review = this.reviews.get(reviewId);
            if (review) {
                review.status = REVIEW_STATUS.REJECTED;
                review.reviewedAt = Date.now();
                review.reviewer = 'system';
                review.editNote = '队列清空';
            }
        }
        
        this.pendingQueue = [];
        this.stats.pending = 0;
        this.stats.rejected += this.history.filter(h => h.action === 'clear').length;
    }
}

// ==================== 与engine.js的集成接口 ====================

/**
 * 创建审核网关实例（供engine.js调用）
 * @param {object} config - 配置
 * @returns {ReviewGateway}
 */
function createReviewGateway(config = {}) {
    return new ReviewGateway(config);
}

/**
 * 审核过滤器（包装器，用于集成到消息处理流程）
 */
class ReviewFilter {
    constructor(gateway) {
        this.gateway = gateway;
    }
    
    /**
     * 处理Agent产出
     * @param {string} agentId - Agent ID
     * @param {string} message - 原始消息
     * @param {string} riskLevel - 风险等级
     * @returns {Promise<string>} 通过审核的消息
     */
    async filter(agentId, message, riskLevel = RISK_LEVEL.NONE) {
        return new Promise((resolve, reject) => {
            const reviewId = this.gateway.submit(agentId, message, riskLevel, (err, approvedMessage) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(approvedMessage);
                }
            });
            
            // 如果是自动模式，reviewId对应的review已经被自动放行了
            // 直接返回消息
            const review = this.gateway.getReview(reviewId);
            if (review && review.status === REVIEW_STATUS.APPROVED) {
                resolve(review.filteredMessage);
            }
        });
    }
}

// ==================== 导出 ====================

module.exports = {
    ReviewGateway,
    Review,
    createReviewGateway,
    ReviewFilter,
    REVIEW_MODE,
    RISK_LEVEL,
    REVIEW_STATUS,
    DEFAULT_CONFIG
};
