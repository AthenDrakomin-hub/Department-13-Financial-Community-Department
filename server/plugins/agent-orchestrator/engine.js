/**
 * 剧本执行引擎 - 系统的"导演"
 * 负责监听 Tailchat 的信号并驱动 API
 */

const ScriptTimeline = require('./script-timeline.json');
const ActorSelector = require('./persona-router');
const FilterGateway = require('../../scripts/asset-generator/filter-gateway');

class ScriptEngine {
  constructor() {
    this.currentPhase = null;
    this.activeActors = [];
    this.isRunning = false;
  }

  /**
   * 初始化引擎
   */
  init() {
    this.setupEventListeners();
    this.startTimelineScheduler();
    console.log('Script Engine initialized');
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
    console.log(`Current phase: ${this.currentPhase}`);

    // 2. 根据剧本随机选择 5-8 个 Agent 激活
    this.activeActors = ActorSelector.getRandomActors(5, 8);
    console.log(`Activated actors: ${this.activeActors.map(a => a.id).join(', ')}`);

    // 3. 执行随机延迟，模拟真人打字
    for (let actor of this.activeActors) {
      const delay = Math.random() * 30000; // 0-30秒随机延迟
      
      setTimeout(async () => {
        try {
          // 4. 调用大模型 API 产出符合人设的对话
          const message = await this.generateActorResponse(actor, this.currentPhase);
          
          // 5. 过滤敏感词后发送
          const filteredMessage = FilterGateway.filter(message);
          await room.sendMessageAs(actor.id, filteredMessage);
          
          console.log(`Message sent by ${actor.id}: ${filteredMessage}`);
        } catch (error) {
          console.error(`Failed to send message as ${actor.id}:`, error);
        }
      }, delay);
    }
  }

  /**
   * 消息事件处理
   */
  async handleMessageEvent(message) {
    // 检测消息内容，触发相应动作
    const content = message.content;
    
    // 检测反诈相关内容
    if (content.includes('反诈') || content.includes('警察') || content.includes('冻结')) {
      await this.triggerAntiFraudResponse(message.room);
    }
    
    // 检测负面情绪
    if (content.includes('没拉') || content.includes('跌') || content.includes('亏')) {
      await this.triggerNegativeResponse(message.room);
    }
  }

  /**
   * 时间线事件处理
   */
  async handleTimelineEvent(phase) {
    this.currentPhase = phase;
    console.log(`Timeline triggered: ${phase}`);
    
    // 根据阶段选择对应角色
    const actors = ActorSelector.getActorsByPhase(phase);
    
    for (let actor of actors) {
      const delay = Math.random() * 15000; // 0-15秒随机延迟
      
      setTimeout(async () => {
        try {
          const message = await this.generateActorResponse(actor, phase);
          const filteredMessage = FilterGateway.filter(message);
          await actor.sendMessage(filteredMessage);
        } catch (error) {
          console.error(`Timeline action failed for ${actor.id}:`, error);
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
    // 选择小号进行反诈表演
    const antiFraudActors = ActorSelector.getAntiFraudActors();
    
    for (let actor of antiFraudActors) {
      setTimeout(async () => {
        const message = "上次我给老家汇款也遇到了，现在银行查得严，说是保护zi金，其实就是走个流程";
        await room.sendMessageAs(actor.id, message);
      }, Math.random() * 5000);
    }
  }

  /**
   * 触发负面情绪响应
   */
  async triggerNegativeResponse(room) {
    // 选择T系铁军号压制负面情绪
    const ironActors = ActorSelector.getIronActors();
    
    for (let actor of ironActors) {
      setTimeout(async () => {
        const responses = [
          "一次失利不影响大局，相信孙总的判断",
          "投资本来就有波动，看好长期价值",
          "跟着机构走，这点波动不算什么"
        ];
        const message = responses[Math.floor(Math.random() * responses.length)];
        await room.sendMessageAs(actor.id, message);
      }, Math.random() * 3000);
    }
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
    }, 60000); // 每分钟检查
  }
}

module.exports = new ScriptEngine();