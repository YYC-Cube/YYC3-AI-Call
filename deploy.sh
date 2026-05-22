#!/bin/bash

# ============================================
# YYC³ AI Intelligent Calling - 部署脚本
# 一键部署：开发/生产环境
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 打印横幅
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║     YYC³ AI Intelligent Calling           ║"
    echo "║     Deployment Script v1.0                ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    if [ ! -f ".env" ]; then
        log_warn ".env文件不存在，从.env.example复制..."
        cp .env.example .env
        log_warn "请编辑.env文件并填入实际配置！"
        read -p "是否继续？(y/N): " confirm
        if [[ $confirm != "y" && $confirm != "Y" ]]; then
            exit 0
        fi
    fi

    log_success "前置条件检查通过"
}

# 开发环境部署
deploy_dev() {
    log_info "启动开发环境部署..."
    
    log_info "构建并启动基础服务（PostgreSQL + Redis）..."
    docker-compose up -d postgres redis
    
    sleep 5
    
    log_info "等待数据库就绪..."
    until docker exec yyc3-postgres pg_isready -U yyc3 -d yyc3_ai_calling &> /dev/null; do
        sleep 2
    done
    log_success "数据库已就绪"
    
    log_info "运行数据库迁移..."
    npm run db:migrate:deploy || true
    
    log_info "安装依赖..."
    pnpm install
    
    log_info "启动开发服务器..."
    pnpm dev
    
    log_success "开发环境已启动！访问 http://localhost:3000"
}

# 生产环境部署
deploy_prod() {
    log_info "启动生产环境部署..."
    
    log_warn "⚠️  生产模式将执行以下操作："
    echo "  1. 构建生产镜像"
    echo "  2. 启动所有服务（App + DB + Redis + Nginx）"
    echo "  3. 运行数据库迁移"
    echo ""
    read -p "确认继续？(y/N): " confirm
    
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        log_info "取消部署"
        exit 0
    fi
    
    log_info "构建Docker镜像..."
    docker build -t yyc-ai-calling:latest .
    
    log_info "启动所有服务..."
    docker-compose --profile production up -d
    
    sleep 10
    
    log_info "等待应用启动..."
    until curl -sf http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 5
        log_info "等待中..."
    done
    
    log_success "✅ 生产环境部署完成！"
    echo ""
    echo "🌐 访问地址:"
    echo "   HTTP:  http://localhost:80"
    echo "   HTTPS: https://your-domain.com (需配置SSL证书)"
    echo ""
    echo "📊 监控命令:"
    echo "   查看日志: docker-compose logs -f app"
    echo "   服务状态: docker-compose ps"
    echo "   停止服务: docker-compose down"
}

# 带本地AI模型的生产部署
deploy_prod_ai() {
    log_info "启动带本地AI模型的生产部署..."
    
    log_warn "此模式将在本地运行Qwen3-35B-A3B和Qwen3-Embedding-8B模型"
    log_warn "需要至少16GB内存和足够的GPU资源"
    
    read -p "确认继续？(y/N): " confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        exit 0
    fi
    
    docker build -t yyc-ai-calling:latest .
    docker-compose --profile production --profile ai-local up -d
    
    log_info "等待Ollama服务启动并下载模型..."
    sleep 30
    
    log_info "拉取Qwen3 LLM模型 (约23GB)..."
    docker exec yyc3-ollama ollama pull qwen3.6:35b-a3b
    
    log_info "拉取Qwen3 Embedding模型 (约15GB)..."
    docker exec yyc3-ollama ollama pull qwen3-embedding:8b
    
    log_success "✅ 带本地AI的部署完成！"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    docker-compose down --remove-orphans
    log_success "服务已停止"
}

# 清理资源
cleanup() {
    log_warn "⚠️  此操作将删除所有容器、镜像和数据卷！"
    read -p "确认清理？(y/N): " confirm
    
    if [[ $confirm == "y" || $confirm == "Y" ]]; then
        docker-compose down -v --rmi all
        log_success "清理完成"
    else
        log_info "取消清理"
    fi
}

# 显示状态
show_status() {
    echo ""
    log_info "YYC³ AI Calling 服务状态"
    echo "─────────────────────────────"
    docker-compose ps
    echo ""
    
    if docker ps | grep -q "yyc3-ai-calling-app"; then
        log_info "健康检查:"
        curl -sf http://localhost:3000/api/health | jq . || true
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  dev          启动开发环境"
    echo "  prod         启动生产环境（无AI）"
    echo "  prod-ai      启动生产环境（含本地AI）"
    echo "  stop         停止所有服务"
    echo "  status       查看服务状态"
    echo "  cleanup      清理所有资源"
    echo "  help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh dev          # 启动开发环境"
    echo "  ./deploy.sh prod         # 生产部署"
    echo "  ./deploy.sh prod-ai      # 带本地AI模型的部署"
}

# 主入口
main() {
    print_banner
    check_prerequisites
    
    case "$1" in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        prod-ai)
            deploy_prod_ai
            ;;
        stop)
            stop_services
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
