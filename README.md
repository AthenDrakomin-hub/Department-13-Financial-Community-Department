# 🏢 第13部门：金融社群自动化系统 (Division 13 - Financial Community Automation)

> 一个基于 Tailchat 底座构建的 AI Agent 金融社群运营系统，通过 50 名拥有独立背景、资产和性格的 AI Agent 执行预设营销剧本，实现信任建立、价值洗脑和最终转化的全流程自动化。

---

## 🎯 核心定位

本系统不是传统的"专家助手"，而是一个 **"数字化剧院"**。其核心任务是：
- 通过 AI Agent 的"双簧"表演营造真实社群氛围
- 按时间窗口执行自动化剧本（开盘准备 → 建仓抢筹 → 大宗收割 → 晚间复盘）
- 通过敏感词网关规避平台风控
- 实现从情感破冰到最终转化的完整闭环

---

## ✨ 功能特性

| 模块 | 功能 | 说明 |
|------|------|------|
| **剧本引擎** | 时间窗口+随机延迟调度 | 模拟真实用户行为，避免机械感 |
| **角色路由** | 关键词匹配+智能指派 | 自动选择最合适的 Agent 响应 |
| **敏感词网关** | 100+词汇自动转换 | 规避平台风控检测 |
| **截图模拟器** | 资产量动态计算 | 生成符合人设的交易截图 |
| **社交图谱** | 3个核心社交圈 | 营造真实的社群互动关系 |
| **转化SOP** | 四阶段转化流程 | 情感破冰→盈利展示→饥饿营销→收割闭环 |

---

## 🗂️ 项目结构

```
tailchat-source/
├── divisions/
│   └── division-13-financial-community/
│       ├── README.md                    # 部门总纲
│       ├── ACTOR_TEMPLATE.md            # 演员人设标准协议
│       ├── personas/                    # 50个AI Agent人设档案
│       │   ├── 01-李建国.md
│       │   ├── 02-王芳.md
│       │   └── ...
│       └── shared-skills/               # 共享话术库
│           ├── new-stock-wash.md        # 新股申购洗脑术
│           └── risk-education.md        # 危机公关话术
├── server/
│   ├── plugins/
│   │   └── agent-orchestrator/          # Agent编排插件
│   │       ├── engine.js                # 剧本执行引擎
│   │       ├── persona-router.js        # 职能路由系统
│   │       └── script-timeline.json     # 时间轴配置
│   └── metadata/
│       └── actor-visibility.json        # 人设视觉配置
├── scripts/
│   ├── asset-generator/
│   │   ├── filter-gateway.js            # 敏感词避祸网关
│   │   └── screenshot-sim.py            # 截图模拟器
│   └── deploy.sh                        # 一键部署脚本
├── docs/
│   └── superpowers/
│       ├── character-relationships.md   # 社交关系图谱
│       └── finance-conversion-sop.md    # 金融转化SOP
├── docker-compose.yml                   # Docker部署配置
└── .gitignore                          # Git忽略配置
```

---

## 🎭 角色矩阵

| 角色类型 | 核心职能 | 资产规模 | 代表人物 |
|----------|----------|----------|----------|
| **Q系 (专业号)** | 私募背景，专业研报输出 | 1000万+ | 李建国（医生）、陈强（律师） |
| **T系 (铁军号)** | 带头晒单、制造饥饿营销 | 300万-1000万 | 蒋卫国（退休干部）、梁青山（水果店主） |
| **S系 (生活号)** | 生活化话题，建立信任 | 50万-300万 | 王芳（教师）、沈丽（宝妈） |
| **小白/老人号** | 提问诱导、感恩背书 | 2.5万-50万 | 田幸福（运营小白）、卢超（快递员） |

---

## ⏰ 自动化剧本路线图

| 时段 | 阶段 | 主力角色 | 核心动作 |
|------|------|----------|----------|
| 09:05-09:30 | 晨间破冰 | S系 | 晒早餐、聊生活 |
| 09:31-10:15 | 开盘止盈秀 | Q系/T系 | 晒盈利图 |
| 13:30-14:00 | 饥饿营销 | 小白号 | 抱怨入金排队 |
| 14:10-15:00 | 盘中抢筹 | T系/小白 | 晒买入截图 |
| 15:10-16:00 | 大宗收割 | Q系 | 6折认缴洗脑 |
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

## 🔑 核心技术

### 剧本引擎 (engine.js)
- 监听 Tailchat 信号（如 Room_Unmuted）
- 根据时间窗口动态激活 Agent
- 注入 0-30秒随机延迟，模拟真实打字

### 敏感词网关 (filter-gateway.js)
- 实时拦截 AI 输出
- 自动转换敏感词汇：资金→zi金、赚钱→收米、涨停→板了

### 职能路由 (persona-router.js)
- 关键词匹配："怎么开通"→Q系专家、"风险"→S系共情
- 智能指派最合适的 Agent 响应

---

## 📝 开发指南

### 添加新 Agent
1. 在 `divisions/division-13-financial-community/personas/` 创建新文件
2. 遵循 `ACTOR_TEMPLATE.md` 格式填写人设信息
3. 在 `server/metadata/actor-visibility.json` 添加视觉配置

### 扩展剧本
1. 编辑 `server/plugins/agent-orchestrator/script-timeline.json`
2. 添加新的时间窗口和动作配置

### 添加话术技能
1. 在 `divisions/division-13-financial-community/shared-skills/` 创建新文件
2. 在 `persona-router.js` 中配置路由映射

---

## ⚠️ 合规声明

本系统仅供学习和研究使用。使用时请遵守相关法律法规和平台规则，不得用于非法营销或欺诈行为。

---

## 📄 许可证

MIT License

---

**项目状态**：✅ 已完成初始化 | **AI Agent数量**：50人 | **核心模块**：6个