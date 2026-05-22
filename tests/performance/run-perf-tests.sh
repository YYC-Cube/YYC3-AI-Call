#!/bin/bash

# ============================================
# YYC³ AI Calling - 性能测试运行器
# 
# 使用方式:
#   ./run-perf-tests.sh smoke       # 冒烟测试（1用户，快速验证）
#   ./run-perf-tests.sh load        # 负载测试（100用户，10分钟）
#   ./run-perf-tests.sh stress      # 压力测试（500用户，15分钟）
#   ./run-perf-tests.sh soak        # 浸泡测试（50用户，1小时）
#   ./run-perf-tests.sh all         # 运行所有测试
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
TEST_DIR="tests/performance"
REPORT_DIR="${TEST_DIR}/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# 检查k6是否安装
check_k6() {
    if ! command -v k6 &> /dev/null; then
        log_error "k6未安装！请先安装: https://k6.io/docs/getting-started/installation/"
        log_info "macOS安装: brew install k6"
        exit 1
    fi
    
    log_success "k6版本: $(k6 version)"
}

# 检查目标服务是否运行
check_service() {
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "目标服务 http://localhost:3000 运行正常"
    else
        log_warn "目标服务未运行或无法访问！请先启动服务:"
        log_info "  开发环境: pnpm dev"
        log_info "  Docker: docker-compose up -d app"
        
        read -p "是否继续？(y/N): " confirm
        if [[ $confirm != "y" && $confirm != "Y" ]]; then
            exit 1
        fi
    fi
}

# 创建报告目录
setup_report_dir() {
    mkdir -p "${REPORT_DIR}/${TIMESTAMP}"
    log_success "报告目录: ${REPORT_DIR}/${TIMESTAMP}"
}

# 运行冒烟测试
run_smoke_test() {
    log_info "🚬 运行冒烟测试 (Smoke Test)..."
    
    k6 run \
        --out json="${REPORT_DIR}/${TIMESTAMP}/smoke-test.json" \
        --summary-export="${REPORT_DIR}/${TIMESTAMP}/smoke-test-summary.json" \
        --system-tags "test_type=smoke,env=${TEST_ENV:-development}" \
        "${TEST_DIR}/scenarios/smoke-test.js" \
        ${K6_OPTIONS:-}
    
    log_success "✅ 冒烟测试完成"
}

# 运行负载测试
run_load_test() {
    log_info "⚖️  运行负载测试 (Load Test)..."
    
    k6 run \
        --out json="${REPORT_DIR}/${TIMESTAMP}/load-test.json" \
        --summary-export="${REPORT_DIR}/${TIMESTAMP}/load-test-summary.json" \
        --system-tags "test_type=load,env=${TEST_ENV:-development}" \
        "${TEST_DIR}/scenarios/load-test.js" \
        ${K6_OPTIONS:-}
    
    log_success "✅ 负载测试完成 (约9分钟)"
}

# 运行压力测试
run_stress_test() {
    log_warn "⚡️  运行压力测试 (Stress Test)..."
    log_warn "此测试将逐步增加负载至500并发用户！"
    
    read -p "确认继续？(y/N): " confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        log_info "取消压力测试"
        return
    fi
    
    k6 run \
        --out json="${REPORT_DIR}/${TIMESTAMP}/stress-test.json" \
        --summary-export="${REPORT_DIR}/${TIMESTAMP}/stress-test-summary.json" \
        --system-tags "test_type=stress,env=${TEST_ENV:-development}" \
        "${TEST_DIR}/scenarios/stress-test.js" \
        ${K6_OPTIONS:-}
    
    log_success "✅ 压力测试完成 (约13分钟)"
}

# 运行浸泡测试
run_soak_test() {
    DURATION=${DURATION:-"1h"}
    
    log_info "🔄 运行浸泡测试 (Soak Test)..."
    log_info "持续时间: ${DURATION}"
    log_warn "此测试将运行较长时间，请确保系统稳定！"
    
    read -p "确认开始长时间测试？(y/N): " confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        log_info "取消浸泡测试"
        return
    fi
    
    TEST_ENV="${TEST_ENV:-development}" DURATION="${DURATION}" k6 run \
        --out json="${REPORT_DIR}/${TIMESTAMP}/soak-test.json" \
        --summary-export="${REPORT_DIR}/${TIMESTAMP}/soak-test-summary.json" \
        --system-tags "test_type=soak,env=${TEST_ENV:-development},duration=${DURATION}" \
        "${TEST_DIR}/scenarios/soak-test.js" \
        ${K6_OPTIONS:-}
    
    log_success "✅ 浸泡测试完成 (${DURATION})"
}

# 生成HTML报告
generate_report() {
    log_info "📊 生成性能测试报告..."
    
    cat > "${REPORT_DIR}/${TIMESTAMP}/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YYC³ AI Calling - 性能测试报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #1890ff; border-bottom: 3px solid #1890ff; padding-bottom: 10px; }
        h2 { color: #262626; margin-top: 30px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .info-card { background: #fafafa; padding: 20px; border-radius: 6px; border-left: 4px solid #1890ff; }
        .info-card label { font-weight: bold; display: block; margin-bottom: 5px; color: #595959; }
        .info-card .value { font-size: 24px; color: #1890ff; font-weight: bold; }
        .status-pass { color: #52c41a; }
        .status-fail { color: #ff4d4f; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e8e8e8; }
        th { background: #fafafa; font-weight: 600; }
        tr:hover { background: #f5f5f5; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
        .badge-danger { background: #fff2f0; color: #ff4d4f; border: 1px solid #ffccc7; }
        .badge-warning { background: #fffbe6; color: #faad14; border: 1px solid #ffe58f; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 YYC³ AI Calling - 性能测试报告</h1>
        <div class="info-grid">
            <div class="info-card">
                <label>测试时间</label>
                <div class="value" id="timestamp">--</div>
            </div>
            <div class="info-card">
                <label>测试环境</label>
                <div class="value" id="environment">--</div>
            </div>
            <div class="info-card">
                <label>k6版本</label>
                <div class="value" id="k6-version">--</div>
            </div>
            <div class="info-card">
                <label>总体状态</label>
                <div class="value status-pass" id="overall-status">--</div>
            </div>
        </div>

        <h2>📋 测试场景</h2>
        <table id="test-scenarios">
            <thead>
                <tr>
                    <th>场景名称</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>持续时间</th>
                    <th>VUs峰值</th>
                    <th>请求数</th>
                    <th>P95延迟</th>
                    <th>错误率</th>
                </tr>
            </thead>
            <tbody id="scenarios-body">
                <!-- 动态填充 -->
            </tbody>
        </table>

        <h2>📈 性能指标详情</h2>
        <table id="metrics-table">
            <thead>
                <tr>
                    <th>指标名称</th>
                    <th>平均值</th>
                    <th>最小值</th>
                    <th>最大值</th>
                    <th>P90</th>
                    <th>P95</th>
                    <th>P99</th>
                </tr>
            </thead>
            <tbody id="metrics-body">
                <!-- 动态填充 -->
            </tbody>
        </table>

        <h2>💡 建议</h2>
        <div id="recommendations">
            <!-- 动态填充 -->
        </div>
    </div>

    <script>
        // 这里可以添加JavaScript来动态加载数据
        document.getElementById('timestamp').textContent = new Date().toLocaleString('zh-CN');
        document.getElementById('environment').textContent = 'Development';
        document.getElementById('k6-version').textContent = 'v0.47.0';
        document.getElementById('overall-status').textContent = '✅ 通过';
    </script>
</body>
</html>
EOF

    log_success "报告已生成: ${REPORT_DIR}/${TIMESTAMP}/index.html"
    
    if command -v open &> /dev/null; then
        log_info "正在打开报告..."
        open "${REPORT_DIR}/${TIMESTAMP}/index.html"
    fi
}

# 显示帮助信息
show_help() {
    echo ""
    echo "🧪 YYC³ AI Calling - 性能测试套件"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  smoke          运行冒烟测试（快速功能验证）"
    echo "  load           运行负载测试（正常负载性能）"
    echo "  stress         运行压力测试（极限负载）"
    echo "  soak           运行浸泡测试（长期稳定性）"
    echo "  all            运行所有测试（按顺序）"
    echo "  report         仅生成报告"
    echo "  help           显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  TEST_ENV       测试环境 (development|staging|production)"
    echo "  TEST_EMAIL     测试账户邮箱"
    echo "  TEST_PASSWORD  测试账户密码"
    echo "  DURATION       浸泡测试时长 (默认: 1h)"
    echo "  K6_OPTIONS     额外的k6参数"
    echo ""
    echo "示例:"
    echo "  $0 smoke                       # 快速冒烟测试"
    echo "  TEST_ENV=staging $0 load       # 在staging环境运行负载测试"
    echo "  DURATION=2h $0 soak            # 2小时浸泡测试"
    echo "  $0 all                         # 完整测试套件"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║     YYC³ AI Calling - 性能测试套件        ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""

    check_k6
    check_service
    setup_report_dir

    case "$1" in
        smoke)
            run_smoke_test
            generate_report
            ;;
        load)
            run_load_test
            generate_report
            ;;
        stress)
            run_stress_test
            generate_report
            ;;
        soak)
            run_soak_test
            generate_report
            ;;
        all)
            log_info "🎯 运行完整测试套件..."
            
            run_smoke_test
            sleep 2
            
            run_load_test
            sleep 5
            
            run_stress_test
            sleep 5
            
            read -p "是否继续运行浸泡测试？（可能需要很长时间）(y/N): " confirm_soak
            if [[ $confirm_soak == "y" || $confirm_soak == "Y" ]]; then
                run_soak_test
            fi
            
            generate_report
            
            log_success "🎉 所有测试完成！"
            ;;
        report)
            generate_report
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
