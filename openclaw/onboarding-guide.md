# 🚀 OpenClaw 接入步骤指南

## 概述

将第13部门（金融社群部）接入OpenClaw是实现"数字化剧院"自动化的核心步骤。

---

## 接入步骤

### 步骤1：Skill注册

```bash
# 在OpenClaw中注册50个人设为标准化Skills
openclaw onboard --config ./openclaw/registry.json --agents ./agent-workspaces/

# 验证注册结果
openclaw registry list
```

**预期输出**:
```
Registered 50 agents successfully:
- agent-01: 李建国 [Q系]
- agent-02: 王芳 [S系]
- ...
```

### 步骤2：注册表优化

编辑 `registry.json`，为不同Agent标记routing tags：

```json
{
  "agents": [
    {
      "id": "agent-01",
      "name": "李建国",
      "tags": ["#大宗交易", "#合规背书", "#价值投资", "#长辈口吻"]
    }
  ],
  "routing_rules": {
    "大宗交易话题": ["#大宗交易", "#财务分析"],
    "反诈应对": ["#反诈应对", "#安全保障"]
  }
}
```

### 步骤3：启动网关

```bash
# 激活50名Agent进入Tailchat待命状态
openclaw gateway restart --mode production

# 检查网关状态
openclaw gateway status
```

**预期输出**:
```
Gateway Status: RUNNING
Connected Agents: 50/50
Active Channels: Tailchat
```

### 步骤4：测试联动

```bash
# 发送测试消息
openclaw test --agent agent-50 --message "老师，打新真的能中签吗？"

# 验证敏感词转换
openclaw safety test --input "今天赚了很多钱，资金到位了"
```

---

## 工作空间文件结构

每个Agent需要三个核心文件：

```
agent-workspaces/
├── 01-李建国/
│   ├── SOUL.md          # 人格与语调
│   ├── AGENTS.md        # 工具与能力
│   └── IDENTITY.md      # 背景与记忆
├── 02-王芳/
│   ├── SOUL.md
│   ├── AGENTS.md
│   └── IDENTITY.md
└── ...
```

### SOUL.md 格式

```markdown
# SOUL.md - 李建国

## 🎭 人格设定
- **性格**: 严谨、长辈感、医者仁心
- **语调**: 长辈口吻，爱说"呵呵"、"小同志"
- **口头禅**: "老夫"、"落袋为安"、"稳健第一"

## 📝 语言风格
- 必须结合医学术语（如"这只票心律不齐"）
- 严禁使用现代流行表情包
- 说话带长者风范
```

### AGENTS.md 格式

```markdown
# AGENTS.md - 李建国

## 🛠️ 可用工具
- screenshot-sim: 持仓截图模拟器
- finance-library: 金融话术库
- risk-education: 风险教育话术

## 🎯 能力范围
- 价值投资理念讲解
- 机构背书
- 医学术语映射
- 风险应对
```

### IDENTITY.md 格式

```markdown
# IDENTITY.md - 李建国

## 💰 资产画像
- 总资产: 1580万
- 股票: 600万 (蓝筹股)
- 基金: 450万 (混合型)
- 打新: 300万
- 现金: 230万

## 🔗 社交关系链
- **导师**: 无（本人为导师级别）
- **好友**: 王姐(02)、张总(03)、陈强(05)
- **粉丝**: 小陈(15)、小李(23)、卢超(35)

## 📅 记忆节点
- 加入时间: 2023年1月
- 历史收益: 年均15%
- 经典案例: 多次打新中签记录
```

---

## 监控与维护

### 日常检查

```bash
# 检查Agent状态
openclaw agent health

# 查看对话日志
openclaw logs --since 24h

# 性能监控
openclaw metrics
```

### 故障排除

| 问题 | 排查方法 |
|------|---------|
| Agent未响应 | `openclaw agent status <agent-id>` |
| 消息未发送 | 检查Tailchat API密钥配置 |
| 敏感词过滤失败 | `openclaw safety validate <text>` |

---

## 安全注意事项

1. **敏感词转换**: 所有输出必须经过safety-gateway
2. **合规检查**: 定期审查话术内容
3. **日志审计**: 保留所有对话记录
4. **应急响应**: 设置7x24小时监控
