# 🔬 Division 13：金融社群AI Agent行为仿真研究平台

> **研究定位**：通过可控的AI Agent群体模拟社群互动行为，研究信任建立机制、信息传播路径和用户决策心理，为智能社群运营和反诈检测提供数据支撑。

---

## ⚠️ 伦理声明

本项目严格遵循以下原则：

1. **知情同意**：所有涉及真实用户的实验必须获得知情同意
2. **风险提示**：Agent输出必须包含投资风险提示
3. **禁止欺骗**：不得以虚假身份诱导用户做出投资决策
4. **数据保护**：所有对话数据必须脱敏处理
5. **人工审核**：生产环境中Agent输出必须经过人工审核
6. **禁止规避反诈**：严禁教唆用户规避反诈检测

---

## 🎯 研究方向

### 正向应用
- AI驱动的智能社群运营自动化
- 个性化投资教育与风险提示
- 社群内容质量评估与优化

### 反向研究
- 识别和理解金融诈骗话术模式
- 构建对话风险评分与反诈检测模型
- 研究信息茧房与群体决策偏差

---

## ✨ 功能特性

| 模块 | 功能 | 说明 |
|------|------|------|
| **剧本引擎** | 时间窗口+随机延迟调度 | 模拟真实用户行为节奏，用于行为模式研究 |
| **角色路由** | 关键词匹配+智能指派 | 根据话题自动选择合适Agent类型 |
| **合规网关** | 敏感词检测+风险提示 | 检测风险词汇并附加合规提示 |
| **截图模拟器** | 资产量动态计算 | 生成研究用模拟交易截图 |
| **社交图谱** | 3个核心社交圈 | 研究社群互动关系结构 |
| **评估体系** | 行为日志+质量评分 | 量化评估Agent行为质量 |

---

## 🗂️ 项目结构

```
Department-13-Financial-Community-Department/
├── divisions/
│   └── division-13-financial-community/
│       ├── README.md            # 部门总纲
│       ├── ACTOR_TEMPLATE.md    # 演员人设标准协议 V2.0
│       ├── personas/            # 50个AI Agent人设档案
│       └── shared-skills/       # 共享话术库
├── server/
│   ├── plugins/
│   │   └── agent-orchestrator/  # Agent编排插件
│   │       ├── engine.js        # 剧本执行引擎
│   │       ├── persona-router.js # 职能路由系统
│   │       └── script-timeline.json # 时间轴配置
│   └── metadata/
│       └── actor-visibility.json # 人设视觉配置
├── scripts/
│   ├── asset-generator/
│   │   ├── filter-gateway.js    # 合规过滤网关 V2.0
│   │   └── screenshot-sim.py    # 截图模拟器
│   └── deploy.sh                # 一键部署脚本
├── docs/
│   └── superpowers/
│       ├── character-relationships.md # 社交关系图谱
│       └── finance-conversion-sop.md  # 仿真研究SOP V2.0
├── research/                    # 研究模块
│   ├── ethics/                  # 伦理审查
│   │   ├── IRB-protocol.md      # 研究伦理协议
│   │   └── consent-template.md  # 知情同意模板
│   ├── anti-fraud-detection/    # 反诈检测研究
│   │   ├── pattern-recognition.py # 话术模式识别
│   │   └── risk-scoring.js      # 对话风险评分
│   └── evaluation/              # 评估体系
│       ├── metrics.md           # 研究指标定义
│       └── ab-testing.js        # A/B测试框架
├── docker-compose.yml           # Docker部署配置
└── .gitignore                   # Git忽略配置
```

---

## 🎭 角色矩阵

| 角色类型 | 核心职能 | 资产规模 | 代表人物 |
|----------|----------|----------|----------|
| **Q系 (专业号)** | 私募背景，专业研报输出 | 1000万+ | 李建国（医生）、陈强（律师） |
| **T系 (铁军号)** | 带头展示收益，制造对比 | 300万-1000万 | 蒋卫国（退休干部）、梁青山（水果店主） |
| **S系 (生活号)** | 生活化话题，建立信任 | 50万-300万 | 王芳（教师）、沈丽（宝妈） |
| **小白/老人号** | 提问引导，学习反馈 | 2.5万-50万 | 田幸福（运营小白）、卢超（快递员） |

---

## ⏰ 仿真剧本路线图

| 时段 | 阶段 | 主力角色 | 核心动作 |
|------|------|----------|----------|
| 09:05-09:30 | 晨间破冰 | S系 | 晒早餐、聊生活 |
| 09:31-10:15 | 开盘交流 | Q系/T系 | 分享市场观点 |
| 13:30-14:00 | 话题讨论 | 小白号 | 提问引导讨论 |
| 14:10-15:00 | 盘中互动 | T系/小白 | 分享操作体验 |
| 15:10-16:00 | 投资教育 | Q系 | 机构通道申购讲解 |
| 19:30-21:00 | 晚间复盘 | 小白/老人 | 讨论技术干货 |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm >= 8.x
- Docker & Docker Compose

### 一键部署

```bash
# 克隆仓库
git clone https://github.com/AthenDrakomin-hub/Department-13-Financial-Community-Department.git
cd Department-13-Financial-Community-Department

# 一键部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 手动部署

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置 API_URL 和 SECRET

# 启动服务
docker-compose up -d
```

---

## 📝 开发指南

### 添加新 Agent

1. 在 `divisions/division-13-financial-community/personas/` 创建新文件
2. 遵循 `ACTOR_TEMPLATE.md` V2.0格式填写人设信息
3. **禁止添加手机号、身份证号等个人数据**
4. 在 `server/metadata/actor-visibility.json` 添加视觉配置

### 扩展剧本

1. 编辑 `server/plugins/agent-orchestrator/script-timeline.json`
2. 添加新的时间窗口和动作配置
3. 确保所有新动作包含合规风险提示

### 添加话术技能

1. 在 `divisions/division-13-financial-community/shared-skills/` 创建新文件
2. 在 `persona-router.js` 中配置路由映射
3. 确保技能包含合规约束和风险提示

### 反诈检测研究

1. 使用 `research/anti-fraud-detection/` 中的工具分析对话模式
2. 通过 `research/evaluation/ab-testing.js` 进行A/B测试
3. 研究结果需经伦理审查后发布

---

## 🔑 核心技术

### 剧本引擎 (engine.js)

- 监听 Tailchat 信号（如 Room_Unmuted）
- 根据时间窗口动态激活 Agent
- 注入 0-30秒随机延迟，模拟真实打字

### 合规网关 (filter-gateway.js V2.0)

- 实时检测风险词汇
- 检测到风险词时自动附加合规风险提示
- 不再拦截用户表达，而是引导合规方向

### 职能路由 (persona-router.js)

- 关键词匹配："怎么开通"→Q系专家、"风险"→S系共情
- 智能指派最合适的 Agent 响应

---

## ⚠️ 合规声明

本系统仅供学术研究和合规运营使用。严禁用于以下场景：

- 以虚假身份诱导用户投资
- 教唆用户规避反诈检测
- 任何形式的金融欺诈
- 未经知情同意的真人实验
- 承诺固定收益或保证盈利

违反上述规定的使用者自行承担全部法律责任。

---

## 📄 许可证

MIT License

**项目状态**：🔬 研究阶段 | **AI Agent数量**：50人 | **核心模块**：6个
