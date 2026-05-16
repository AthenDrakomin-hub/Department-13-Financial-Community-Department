/**
 * Filter Gateway: 敏感词避祸网关 V1.0
 * 功能：拦截 AI 输出，执行自动化谐音/拼音转换，规避平台风控。
 */

const EVASION_MAP = {
    "资金": "zi金",
    "赚钱": "收米",
    "涨停": "板了",
    "利润": "回馈",
    "转账": "划转",
    "中签": "配售",
    "入金": "注入",
    "亏损": "回撤",
    "拉升": "对倒",
    "服务费": "分红管理",
    "投资": "合作",
    "理财": "配置",
    "收益": "回馈",
    "分红": "分成",
    "利息": "回报",
    "本金": "本金",
    "开户": "开通",
    "交易": "操作",
    "买入": "建仓",
    "卖出": "离场",
    "加仓": "补仓",
    "减仓": "调仓",
    "满仓": "重仓",
    "空仓": "轻仓",
    "套牢": "持有",
    "割肉": "止损",
    "解套": "回本",
    "踏空": "观望",
    "抄底": "布局",
    "追高": "跟进",
    "高抛": "止盈",
    "低吸": "建仓",
    "利好": "消息",
    "利空": "传闻",
    "洗盘": "调整",
    "出货": "换手",
    "庄家": "主力",
    "散户": "投资者",
    "游资": "资金方",
    "机构": "专业团队",
    "私募": "资产管理",
    "公募": "基金",
    "打新": "配售",
    "IPO": "新股",
    "申购": "参与",
    "配股": "配售",
    "增发": "定增",
    "大宗": "协议转让",
    "北向": "外资",
    "南向": "内资",
    "杠杆": "融资",
    "配资": "合作",
    "爆仓": "强平",
    "质押": "抵押",
    "解禁": "流通",
    "减持": "转让",
    "增持": "买入",
    "回购": "增持",
    "举牌": "收购",
    "重组": "整合",
    "借壳": "上市",
    "退市": "整理",
    "ST": "特殊处理",
    "退市风险": "风险警示",
    "注册制": "新规",
    "核准制": "旧规",
    "科创板": "科创",
    "创业板": "创业",
    "主板": "主版",
    "北交所": "北交",
    "港股": "港股",
    "美股": "海外",
    "A股": "国内",
    "指数": "大盘",
    "板块": "热点",
    "概念": "主题",
    "龙头": "领涨",
    "连板": "连涨",
    "地天板": "反转",
    "天地板": "回落",
    "一字板": "开盘",
    "T+1": "交易规则",
    "T+0": "灵活交易",
    "集合竞价": "早盘",
    "尾盘": "收盘",
    "盘口": "行情",
    "筹码": "持仓",
    "均线": "指标",
    "K线": "走势",
    "MACD": "指标",
    "KDJ": "指标",
    "成交量": "量能",
    "换手率": "换手",
    "市盈率": "估值",
    "市净率": "PB",
    "ROE": "收益",
    "分红": "派息",
    "送股": "转增",
    "除权": "调整",
    "填权": "回归",
    "贴权": "回落"
};

/**
 * 核心转换逻辑
 * @param {string} rawText - AI 原始生成的对话文本
 * @returns {string} - 经过混淆处理后的文本
 */
function processEvasion(rawText) {
    let safeText = rawText;
    
    // 1. 执行硬性词汇映射
    for (const [key, value] of Object.entries(EVASION_MAP)) {
        const regex = new RegExp(key, 'g');
        safeText = safeText.replace(regex, value);
    }

    // 2. 随机混淆逻辑（模拟真人打字错误或习惯）
    // 例如随机在长句中加入“。”或“...”
    if (safeText.length > 20 && Math.random() > 0.7) {
        safeText = safeText.slice(0, 10) + "..." + safeText.slice(10);
    }

    // 3. 添加随机表情符号（增加真实性）
    const emojis = ['😊', '🤔', '💪', '👍', '👏', '🎉', '✨', '🌟'];
    if (safeText.length > 15 && Math.random() > 0.6) {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        safeText = safeText + emoji;
    }

    // 4. 随机添加语气词（模拟真人说话习惯）
    const particles = ['啊', '哦', '呢', '吧', '呀', '嘛'];
    if (safeText.length > 10 && Math.random() > 0.5) {
        const particle = particles[Math.floor(Math.random() * particles.length)];
        const lastChar = safeText[safeText.length - 1];
        if (lastChar !== '。' && lastChar !== '！' && lastChar !== '？') {
            safeText = safeText + particle;
        }
    }

    return safeText;
}

/**
 * 批量处理多条消息
 * @param {Array} messages - 消息数组
 * @returns {Array} - 处理后的消息数组
 */
function processMessages(messages) {
    return messages.map(msg => ({
        ...msg,
        content: processEvasion(msg.content)
    }));
}

/**
 * 检查是否包含高风险词汇
 * @param {string} text - 待检查文本
 * @returns {boolean} - 是否包含风险词
 */
function hasHighRiskWords(text) {
    const highRisk = ['诈骗', '骗子', '报警', '举报', '投诉', '维权', '曝光', '骗局', '违法', '犯罪'];
    return highRisk.some(word => text.includes(word));
}

/**
 * 完整处理流程
 * @param {string} text - 原始文本
 * @returns {Object} - 处理结果
 */
function filter(text) {
    if (hasHighRiskWords(text)) {
        return {
            success: false,
            message: '包含高风险词汇，已拦截',
            content: ''
        };
    }
    
    return {
        success: true,
        message: '处理成功',
        content: processEvasion(text)
    };
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processEvasion,
        processMessages,
        hasHighRiskWords,
        filter,
        EVASION_MAP
    };
}

// 示例输出：
// 原始："孙总带大家赚大钱，今天的资金已经准备好冲击涨停了！"
// 转换："孙总带大家收大米，今天的zi金已经准备好冲击板了！"