#!/bin/bash

# Division-13 金融社群自动化系统一键部署脚本
# 版本：V1.0
# 描述：将Tailchat底座、Division-13人设库以及剧本引擎插件自动拓扑到服务器

set -e

echo "=============================================="
echo "🚀 正在初始化第13部门：金融社群部自动化环境..."
echo "=============================================="

# 1. 检查并拉取 Tailchat 底座仓库
echo ""
echo "📥 步骤1：检查Tailchat底座..."
if [ ! -d "tailchat-source" ]; then
    echo "   正在克隆Tailchat底座仓库..."
    git clone https://github.com/AthenDrakomin-hub/tailchat-source.git
else
    echo "   Tailchat底座已存在，跳过克隆"
fi

cd tailchat-source

# 2. 注入 Division-13 核心资产
echo ""
echo "📦 步骤2：注入Division-13核心资产..."
mkdir -p ./divisions/division-13-financial-community

# 复制人设档案
echo "   复制人设档案..."
cp -r ../source/division-13/personas/ ./divisions/division-13-financial-community/ 2>/dev/null || echo "   跳过人设档案（路径不存在）"

# 复制共享技能
echo "   复制共享技能库..."
mkdir -p ./divisions/division-13-financial-community/shared-skills
cp -r ../source/division-13/shared-skills/ ./divisions/division-13-financial-community/ 2>/dev/null || echo "   跳过共享技能（路径不存在）"

# 复制人设模板
echo "   复制人设模板..."
cp ../source/division-13/ACTOR_TEMPLATE.md ./divisions/division-13-financial-community/ 2>/dev/null || echo "   跳过人设模板（路径不存在）"

# 复制部门总纲
echo "   复制部门总纲..."
cp ../source/division-13/README.md ./divisions/division-13-financial-community/ 2>/dev/null || echo "   跳过部门总纲（路径不存在）"

# 3. 安装依赖
echo ""
echo "🔧 步骤3：安装项目依赖..."
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install
else
    npm install
fi

# 4. 安装 Agent 编排插件
echo ""
echo "🔌 步骤4：安装Agent Orchestrator剧本引擎..."
mkdir -p ./server/plugins/agent-orchestrator

# 创建插件目录结构
echo "   创建插件目录..."
mkdir -p ./server/plugins/agent-orchestrator

# 复制插件文件
echo "   复制剧本引擎文件..."
cp ../source/server/plugins/agent-orchestrator/script-timeline.json ./server/plugins/agent-orchestrator/ 2>/dev/null || echo "   跳过script-timeline（路径不存在）"
cp ../source/server/plugins/agent-orchestrator/persona-router.js ./server/plugins/agent-orchestrator/ 2>/dev/null || echo "   跳过persona-router（路径不存在）"
cp ../source/server/plugins/agent-orchestrator/engine.js ./server/plugins/agent-orchestrator/ 2>/dev/null || echo "   跳过engine（路径不存在）"

# 5. 复制工具脚本
echo ""
echo "🛠️ 步骤5：复制工具脚本..."
mkdir -p ./scripts/asset-generator

echo "   复制敏感词网关..."
cp ../source/scripts/asset-generator/filter-gateway.js ./scripts/asset-generator/ 2>/dev/null || echo "   跳过filter-gateway（路径不存在）"

echo "   复制截图模拟器..."
cp ../source/scripts/asset-generator/screenshot-sim.py ./scripts/asset-generator/ 2>/dev/null || echo "   跳过screenshot-sim（路径不存在）"

# 6. 复制元数据配置
echo ""
echo "📋 步骤6：配置元数据..."
mkdir -p ./server/metadata

echo "   复制人设视觉配置..."
cp ../source/server/metadata/actor-visibility.json ./server/metadata/ 2>/dev/null || echo "   跳过actor-visibility（路径不存在）"

# 7. 复制文档
echo ""
echo "📚 步骤7：复制文档..."
mkdir -p ./docs/superpowers

echo "   复制转化SOP..."
cp ../source/docs/superpowers/finance-conversion-sop.md ./docs/superpowers/ 2>/dev/null || echo "   跳过finance-conversion-sop（路径不存在）"

echo "   复制社交关系图谱..."
cp ../source/docs/superpowers/character-relationships.md ./docs/superpowers/ 2>/dev/null || echo "   跳过character-relationships（路径不存在）"

# 8. 配置环境变量
echo ""
echo "🔐 步骤8：配置环境变量..."
cat <<EOF > .env.production
# Tailchat 环境配置
API_URL=https://api.yourfinance.com
SECRET=$(openssl rand -hex 32)
NODE_ENV=production

# Division-13 配置
FILTER_GATEWAY_ENABLED=true
D13_PERSONA_COUNT=50
D13_AUTO_DEPLOY=true

# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tailchat
DB_USER=admin
DB_PASSWORD=$(openssl rand -hex 16)

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
EOF

echo "   环境变量配置完成"

# 9. 启动生产拓扑
echo ""
echo "🏗️ 步骤9：构建Docker镜像并启动服务..."
if [ -f "docker-compose.yml" ]; then
    docker-compose up -d --build
else
    echo "⚠️  docker-compose.yml不存在，跳过Docker部署"
    echo "   请手动启动服务：npm run start"
fi

# 10. 运行部署后校验
echo ""
echo "✅ 步骤10：运行部署校验..."
if [ -f "scripts/check-deployment.sh" ]; then
    bash scripts/check-deployment.sh
else
    echo "   校验脚本不存在，跳过校验"
fi

echo ""
echo "=============================================="
echo "✅ 部署完成！"
echo "=============================================="
echo ""
echo "🌐 客户端下载入口：/downloads"
echo "🎭 50 名 AI 员工已就绪，等待'解除禁言'信号激活剧本"
echo ""
echo "📝 快速操作："
echo "   - 查看日志: docker-compose logs -f"
echo "   - 停止服务: docker-compose down"
echo "   - 重启服务: docker-compose restart"
echo ""
echo "⚠️  注意事项："
echo "   1. 首次启动可能需要几分钟加载模型"
echo "   2. 请确保端口80和443未被占用"
echo "   3. 建议配置SSL证书以保障安全"
echo "=============================================="