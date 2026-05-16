/**
 * Persona Router: 负责在"炒群"剧本中分发角色动作
 * 逻辑：匹配关键词 -> 筛选对应 Tiers -> 随机指派 Actor -> 注入 Shared Skills
 */

const RoleRouter = {
  // 定义关键词对应的职能响应
  routes: {
    "怎么开通/怎么参与/名额": {
      responder_type: "Q_Class", // 必须由专家号或老号回答
      template: "account_onboarding_guide",
      priority: 1
    },
    "风险/安全/反诈/转账": {
      responder_type: "S_Class", // 由生活托通过"共情表演"化解
      template: "risk_education_theater",
      skills: ["risk-education.md"], // 加载反诈联动话术
      priority: 2
    },
    "新股/认缴/中签": {
      responder_type: "Q_Class",
      skills: ["new-stock-wash.md"], // 加载 6 折认缴洗脑术
      priority: 1
    },
    "机构账户/机构号": {
      responder_type: "Q_Class",
      skills: ["new-stock-wash.md"],
      priority: 1
    },
    "大宗交易/大宗折扣": {
      responder_type: "Q_Class",
      skills: ["new-stock-wash.md"],
      priority: 1
    },
    "跌/亏/没拉": {
      responder_type: "T_Class", // 由铁军号压制负面情绪
      template: "emotion_control",
      priority: 2
    },
    "早餐/育儿/生活": {
      responder_type: "S_Class",
      template: "daily_life",
      priority: 3
    },
    "什么是/怎么/为什么": {
      responder_type: "Newbie", // 由小白号提问
      template: "question_asking",
      priority: 3
    }
  },

  /**
   * 路由分发逻辑
   * @param {string} incoming_text - 群内触发文本
   */
  async dispatch(incoming_text) {
    const route = this.matchRoute(incoming_text);
    if (!route) return null;

    // 从 50 个人设中随机筛选符合 ResponderType 且当前活跃的演员
    const candidate = await ActorPool.findRandom({
      role: route.responder_type,
      status: 'active'
    });

    return {
      actor: candidate,
      logic_bundle: route.skills || [],
      jitter: Math.floor(Math.random() * 30000) // 注入 0-30s 随机打字延迟
    };
  },

  /**
   * 匹配路由规则
   * @param {string} text - 输入文本
   */
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

  /**
   * 根据阶段获取角色
   * @param {string} phase - 当前阶段
   */
  getActorsByPhase(phase) {
    const phaseConfig = {
      'BREAK_ICE': { role_types: ['S_Class'], tier_filter: ['T3', 'T4'] },
      'PROFIT_SHOW': { role_types: ['Q_Class', 'T_Class'], tier_filter: ['T1', 'T2'] },
      'HUNGER_MARKETING': { role_types: ['Newbie', 'S_Class'], tier_filter: ['T4'] },
      'INSTITUTIONAL_BUY': { role_types: ['T_Class', 'Newbie'], tier_filter: ['T2', 'T3', 'T4'] },
      'BULK_CLOSING': { role_types: ['Q_Class'], tier_filter: ['T1', 'T2'] },
      'EVENING_REVIEW': { role_types: ['Newbie', 'Elder'], tier_filter: ['T3', 'T4'] }
    };

    return phaseConfig[phase] || { role_types: ['S_Class'], tier_filter: ['T3', 'T4'] };
  },

  /**
   * 获取反诈角色
   */
  getAntiFraudActors() {
    const antiFraudIds = ['Shen_15', 'Fan_36', 'Wang_49', 'Zhong_48'];
    return ActorPool.find({ ids: antiFraudIds });
  },

  /**
   * 获取铁军角色
   */
  getIronActors() {
    return ActorPool.find({ role_type: 'T_Class', status: 'active' });
  },

  /**
   * 获取随机角色列表
   * @param {number} minCount - 最小数量
   * @param {number} maxCount - 最大数量
   * @param {array} roleTypes - 角色类型过滤
   */
  async getRandomActors(minCount, maxCount, roleTypes = []) {
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const filter = roleTypes.length > 0 ? { role_types: roleTypes } : {};
    const actors = await ActorPool.find(filter);
    
    // 随机打乱并截取
    return actors.sort(() => Math.random() - 0.5).slice(0, count);
  }
};

export default RoleRouter;