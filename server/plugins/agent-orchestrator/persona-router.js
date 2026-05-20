/**
 * Persona Router: 角色路由器
 * 负责在"炒群"剧本中分发角色动作
 * 
 * 功能：
 * 1. 关键词→角色类型匹配
 * 2. 角色类型→具体Agent选择（轮询+随机+冷却机制）
 * 3. 人设档案加载与解析
 * 4. 发言频率控制
 */

const fs = require('fs');
const path = require('path');

// ==================== 常量定义 ====================

// 关键词→角色类型映射
const KEYWORD_TRIGGERS = {
    'Q': ["怎么开通", "机构通道", "申购", "配售", "专业", "分析", "研报", "估值", "基本面", "趋势", "技术", "合规", "法律", "三方存管"],
    'T': ["晒单", "收益", "止盈", "落袋", "盈利", "建仓成功", "截图", "跟了", "赚钱", "分红", "涨停", "赚米"],
    'S': ["早安", "早餐", "午餐", "晚餐", "孩子", "家人", "周末", "生活", "心情", "瑜伽", "烘焙", "房产", "插花", "美食", "健康"],
    'X': ["怎么操作", "新手", "不懂", "学习", "请问", "怎么买", "门槛", "开通", "安全吗", "靠谱吗", "是真的吗", "能信吗"]
};

// 阶段配置
const PHASE_CONFIG = {
    'BREAK_ICE': { role_types: ['S'], tier_filter: ['T3', 'T4'] },
    'PROFIT_SHOW': { role_types: ['Q', 'T'], tier_filter: ['T1', 'T2'] },
    'HUNGER_MARKETING': { role_types: ['X', 'S'], tier_filter: ['T4'] },
    'INSTITUTIONAL_BUY': { role_types: ['T', 'X'], tier_filter: ['T2', 'T3', 'T4'] },
    'BULK_CLOSING': { role_types: ['Q'], tier_filter: ['T1', 'T2'] },
    'EVENING_REVIEW': { role_types: ['X', 'S'], tier_filter: ['T3', 'T4'] }
};

// 冷却配置（毫秒）
const COOLDOWN_CONFIG = {
    MIN_INTERVAL: 60000,        // 同一Agent两次发言间隔至少60秒
    MAX_HOURLY: 10,              // 同一Agent每小时最多发言10次
    HOURLY_WINDOW: 3600000       // 小时窗口（1小时）
};

/**
 * 解析人设档案的frontmatter
 * @param {string} content - 文件内容
 * @returns {object} 解析后的frontmatter
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return null;
    
    const frontmatter = {};
    const lines = match[1].split('\n');
    
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            frontmatter[key] = value;
        }
    }
    
    return frontmatter;
}

/**
 * 从人设档案文件名解析ID
 * @param {string} filename - 文件名如 "01-李建国.md"
 * @returns {string} ID如 "01-李建国"
 */
function parseIdFromFilename(filename) {
    return path.basename(filename, '.md');
}

/**
 * 根据tier字符串判断梯队等级
 * @param {string} tier - tier字符串
 * @returns {string} 梯队标识如 "T1", "T2"等
 */
function parseTierLevel(tier) {
    if (!tier) return 'T3'; // 默认T3
    
    const tierMap = {
        '第一梯队': 'T1',
        '第二梯队': 'T2',
        '第三梯队': 'T3',
        '第四梯队': 'T4',
        '资深托': 'T2',
        '专业托': 'T2',
        '活跃托': 'T3',
        '潜水托': 'T4'
    };
    
    for (const [key, value] of Object.entries(tierMap)) {
        if (tier.includes(key)) {
            return value;
        }
    }
    
    return 'T3'; // 默认
}

/**
 * 根据文件名解析角色类型
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容
 * @returns {string} 角色类型 Q/T/S/X
 */
function parseRoleType(filename, content) {
    // 从tier中判断
    if (content.includes('Q系') || content.includes('机构专业') || content.includes('专业托')) {
        return 'Q';
    }
    if (content.includes('T系') || content.includes('铁军') || content.includes('敢死队')) {
        return 'T';
    }
    if (content.includes('S系') || content.includes('生活')) {
        return 'S';
    }
    
    // 根据文件名中的编号和内容判断
    const id = parseInt(parseIdFromFilename(filename).split('-')[0], 10);
    if (id <= 8) {
        // 1-8号通常为资深/专业角色
        return 'Q';
    } else if (id <= 20) {
        // 9-20号为活跃角色
        return 'S';
    } else if (id <= 35) {
        // 21-35号为专业/活跃角色
        return 'T';
    } else {
        // 35号以后为潜水/活跃角色
        return 'S';
    }
}

// ==================== Agent类 ====================

class Agent {
    constructor(id, frontmatter, persona, filename) {
        this.id = id;
        this.name = frontmatter.name || '';
        this.nickname = this.extractNickname(this.name);
        this.roleType = parseRoleType(filename, persona);
        this.tier = parseTierLevel(frontmatter.tier);
        this.occupation = frontmatter.occupation || '';
        this.asset = this.parseAsset(frontmatter.asset);
        this.vibe = frontmatter.vibe || '';
        this.persona = persona;
        this.lastActiveTime = 0;
        this.messageCount = 0;
        this.hourlyMessages = []; // 记录每小时的消息时间戳
        this.skills = []; // 关联的技能文件
    }
    
    extractNickname(name) {
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
    }
    
    parseAsset(assetStr) {
        if (!assetStr) return 0;
        const clean = assetStr.replace(/,/g, '').replace(/[^\d]/g, '');
        return parseInt(clean, 10) || 0;
    }
    
    /**
     * 检查Agent是否在冷却中
     * @returns {boolean}
     */
    isInCooldown() {
        const now = Date.now();
        
        // 检查最近60秒是否有发言
        if (now - this.lastActiveTime < COOLDOWN_CONFIG.MIN_INTERVAL) {
            return true;
        }
        
        // 检查每小时消息数
        const oneHourAgo = now - COOLDOWN_CONFIG.HOURLY_WINDOW;
        this.hourlyMessages = this.hourlyMessages.filter(t => t > oneHourAgo);
        
        if (this.hourlyMessages.length >= COOLDOWN_CONFIG.MAX_HOURLY) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取Agent的优先级分数（用于选择）
     * 分数越高越优先被选中
     * @returns {number}
     */
    getPriorityScore() {
        const now = Date.now();
        
        // 冷却时间越长，优先级越高
        let cooldownScore = 0;
        if (this.lastActiveTime > 0) {
            cooldownScore = Math.min((now - this.lastActiveTime) / COOLDOWN_CONFIG.MIN_INTERVAL, 10);
        } else {
            cooldownScore = 10; // 从未发言的Agent优先级最高
        }
        
        // 小时内消息越少，优先级越高
        const oneHourAgo = now - COOLDOWN_CONFIG.HOURLY_WINDOW;
        this.hourlyMessages = this.hourlyMessages.filter(t => t > oneHourAgo);
        const hourlyScore = 10 - this.hourlyMessages.length;
        
        // 综合分数
        return cooldownScore * 0.6 + hourlyScore * 0.4;
    }
    
    /**
     * 更新发言记录
     */
    recordActivity() {
        const now = Date.now();
        this.lastActiveTime = now;
        this.messageCount++;
        this.hourlyMessages.push(now);
    }
    
    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            nickname: this.nickname,
            roleType: this.roleType,
            tier: this.tier,
            occupation: this.occupation,
            asset: this.asset,
            vibe: this.vibe,
            persona: this.persona,
            lastActiveTime: this.lastActiveTime,
            messageCount: this.messageCount
        };
    }
}

// ==================== PersonaRouter类 ====================

class PersonaRouter {
    constructor(personasDir) {
        this.personasDir = personasDir;
        this.agents = new Map(); // id -> Agent
        this.activityLog = []; // 发言记录
        this.roundRobinCounters = {}; // 轮询计数器
        
        // 加载所有人设档案
        this.loadAllPersonas();
    }
    
    /**
     * 加载所有人设档案
     */
    loadAllPersonas() {
        try {
            const files = fs.readdirSync(this.personasDir).filter(f => f.endsWith('.md'));
            
            for (const file of files) {
                const filePath = path.join(this.personasDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const id = parseIdFromFilename(file);
                const frontmatter = parseFrontmatter(content);
                
                if (frontmatter) {
                    const agent = new Agent(id, frontmatter, content, file);
                    this.agents.set(id, agent);
                }
            }
            
            console.log(`[PersonaRouter] 已加载 ${this.agents.size} 个人设档案`);
        } catch (error) {
            console.error('[PersonaRouter] 加载人设档案失败:', error);
        }
    }
    
    /**
     * 匹配关键词到角色类型
     * @param {string} message - 消息内容
     * @returns {string|null} 匹配到的角色类型
     */
    matchKeywordToRoleType(message) {
        if (!message) return null;
        
        const normalizedMsg = message.toLowerCase();
        let maxMatchCount = 0;
        let matchedType = null;
        
        for (const [roleType, keywords] of Object.entries(KEYWORD_TRIGGERS)) {
            let matchCount = 0;
            for (const keyword of keywords) {
                if (normalizedMsg.includes(keyword.toLowerCase())) {
                    matchCount++;
                }
            }
            
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                matchedType = roleType;
            }
        }
        
        return matchedType;
    }
    
    /**
     * 核心路由方法：根据消息内容选择最合适的Agent
     * @param {string} message - 消息内容
     * @param {object} context - 上下文信息 { phase, excludeAgents, preferTypes }
     * @returns {object} { agent, confidence, reason }
     */
    route(message, context = {}) {
        const { phase, excludeAgents = [], preferTypes = [] } = context;
        
        // 1. 匹配关键词确定角色类型
        const matchedType = this.matchKeywordToRoleType(message);
        
        // 2. 确定候选类型列表
        let candidateTypes = [];
        if (preferTypes && preferTypes.length > 0) {
            candidateTypes = preferTypes;
        } else if (matchedType) {
            candidateTypes = [matchedType];
        }
        
        // 3. 获取候选Agent
        let candidates = [];
        for (const type of candidateTypes) {
            candidates = candidates.concat(this.getAgentsByType(type));
        }
        
        // 如果没有匹配，开放所有Agent
        if (candidates.length === 0) {
            candidates = Array.from(this.agents.values());
        }
        
        // 4. 过滤排除的Agent
        candidates = candidates.filter(a => !excludeAgents.includes(a.id));
        
        // 5. 过滤冷却中的Agent
        const availableCandidates = candidates.filter(a => !a.isInCooldown());
        
        // 如果没有可用Agent，返回null
        if (availableCandidates.length === 0) {
            return { agent: null, confidence: 0, reason: '所有候选Agent都在冷却中' };
        }
        
        // 6. 计算优先级并选择
        // 综合考虑：冷却时间 + 随机因素
        const scoredCandidates = availableCandidates.map(a => ({
            agent: a,
            score: a.getPriorityScore() + Math.random() * 5 // 加入随机因素
        }));
        
        // 按分数排序
        scoredCandidates.sort((a, b) => b.score - a.score);
        
        // 选择最优Agent
        const selected = scoredCandidates[0].agent;
        
        // 计算置信度
        const confidence = matchedType ? 0.8 : 0.5;
        
        return {
            agent: selected,
            confidence: confidence,
            reason: matchedType 
                ? `关键词匹配: ${matchedType}系` 
                : '随机选择（无关键词匹配）'
        };
    }
    
    /**
     * 根据角色类型获取候选Agent
     * @param {string} roleType - 角色类型 Q/T/S/X
     * @returns {Agent[]}
     */
    getAgentsByType(roleType) {
        return Array.from(this.agents.values()).filter(a => a.roleType === roleType);
    }
    
    /**
     * 获取所有活跃Agent（可发言的）
     * @returns {Agent[]}
     */
    getActiveActors() {
        return Array.from(this.agents.values()).filter(a => !a.isInCooldown());
    }
    
    /**
     * 根据剧本阶段获取Agent
     * @param {string} phase - 当前阶段
     * @returns {Agent[]}
     */
    getActorsByPhase(phase) {
        const config = PHASE_CONFIG[phase] || PHASE_CONFIG['BREAK_ICE'];
        const { role_types, tier_filter } = config;
        
        return Array.from(this.agents.values()).filter(a => 
            role_types.includes(a.roleType) && 
            tier_filter.includes(a.tier)
        );
    }
    
    /**
     * 获取反诈应对Agent（S系+X小白，优先选择有"风险应对"能力的）
     * @returns {Agent[]}
     */
    getRiskResponseActors() {
        const sAgents = this.getAgentsByType('S');
        const xAgents = this.getAgentsByType('X');
        
        // 优先选择有风险应对相关描述的Agent
        const riskKeywords = ['风险', '安全', '反诈', '合规', '转账'];
        
        const allCandidates = [...sAgents, ...xAgents];
        const scored = allCandidates.map(a => {
            let score = 0;
            for (const keyword of riskKeywords) {
                if (a.persona.includes(keyword)) {
                    score += 10;
                }
            }
            return { agent: a, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.agent);
    }
    
    /**
     * 更新Agent发言记录（用于轮询和冷却）
     * @param {string} agentId - Agent ID
     */
    updateAgentActivity(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.recordActivity();
            this.activityLog.push({
                agentId,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * 随机选择N个Agent（用于开群激活等场景）
     * @param {number} min - 最少数量
     * @param {number} max - 最多数量
     * @param {string[]} roleTypes - 角色类型过滤
     * @returns {Agent[]}
     */
    getRandomActors(min, max, roleTypes = []) {
        // 确定候选池
        let candidates = Array.from(this.agents.values());
        if (roleTypes.length > 0) {
            candidates = candidates.filter(a => roleTypes.includes(a.roleType));
        }
        
        // 确定选择数量
        const count = min + Math.floor(Math.random() * (max - min + 1));
        
        // 随机打乱并截取
        const shuffled = candidates.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    /**
     * 获取Agent统计信息
     * @returns {object}
     */
    getStats() {
        const stats = {
            total: this.agents.size,
            byType: { Q: 0, T: 0, S: 0, X: 0 },
            byTier: { T1: 0, T2: 0, T3: 0, T4: 0 },
            active: 0,
            inCooldown: 0
        };
        
        for (const agent of this.agents.values()) {
            stats.byType[agent.roleType] = (stats.byType[agent.roleType] || 0) + 1;
            stats.byTier[agent.tier] = (stats.byTier[agent.tier] || 0) + 1;
            if (agent.isInCooldown()) {
                stats.inCooldown++;
            } else {
                stats.active++;
            }
        }
        
        return stats;
    }
    
    /**
     * 获取指定Agent
     * @param {string} agentId - Agent ID
     * @returns {Agent|null}
     */
    getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    
    /**
     * 获取所有Agent
     * @returns {Agent[]}
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
}

// 导出单例
let routerInstance = null;

function createRouter(personasDir) {
    routerInstance = new PersonaRouter(personasDir);
    return routerInstance;
}

function getRouter() {
    return routerInstance;
}

// ==================== 兼容旧代码的导出 ====================

const RoleRouter = {
    routes: {
        "怎么开通/怎么参与/名额": {
            responder_type: "Q",
            template: "account_onboarding_guide",
            priority: 1
        },
        "风险/安全/反诈/转账": {
            responder_type: "S",
            template: "risk_education_theater",
            skills: ["risk-education.md"],
            priority: 2
        },
        "新股/认缴/中签": {
            responder_type: "Q",
            skills: ["new-stock-wash.md"],
            priority: 1
        },
        "机构账户/机构号": {
            responder_type: "Q",
            skills: ["new-stock-wash.md"],
            priority: 1
        },
        "大宗交易/大宗折扣": {
            responder_type: "Q",
            skills: ["new-stock-wash.md"],
            priority: 1
        },
        "跌/亏/没拉": {
            responder_type: "T",
            template: "emotion_control",
            priority: 2
        },
        "早餐/育儿/生活": {
            responder_type: "S",
            template: "daily_life",
            priority: 3
        },
        "什么是/怎么/为什么": {
            responder_type: "X",
            template: "question_asking",
            priority: 3
        }
    },
    
    matchRoute(text) {
        for (const [patterns, route] of Object.entries(this.routes)) {
            const patternList = patterns.split('/');
            for (const pattern of patternList) {
                if (text.includes(pattern)) {
                    return route;
                }
            }
        }
        return null;
    },
    
    getActorsByPhase(phase) {
        return routerInstance ? routerInstance.getActorsByPhase(phase) : [];
    },
    
    getAntiFraudActors() {
        return routerInstance ? routerInstance.getRiskResponseActors() : [];
    },
    
    getIronActors() {
        return routerInstance ? routerInstance.getAgentsByType('T') : [];
    },
    
    async getRandomActors(minCount, maxCount, roleTypes = []) {
        return routerInstance ? routerInstance.getRandomActors(minCount, maxCount, roleTypes) : [];
    },
    
    // 新增：获取路由实例
    getRouter() {
        return routerInstance;
    }
};

module.exports = {
    PersonaRouter,
    createRouter,
    getRouter,
    RoleRouter,
    Agent,
    KEYWORD_TRIGGERS,
    COOLDOWN_CONFIG
};
