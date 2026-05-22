/**
 * YYC³ AI Calling - 压力测试（Stress Test）
 * 
 * 目的：找出系统性能瓶颈和崩溃点
 * 场景：逐步增加负载到极限
 * 用途：容量上限评估、瓶颈定位
 */

import { check, group, sleep } from 'k6';
import { Auth, BusinessOperations } from '../utils/helpers.js';

export const options = {
  stages: [
    // 阶段1：基线（1分钟，10用户）
    { duration: '1m', target: 10 },
    
    // 阶段2：中等负载（2分钟，50用户）
    { duration: '2m', target: 50 },
    
    // 阶段3：高负载（2分钟，100用户）
    { duration: '2m', target: 100 },
    
    // 阶段4：峰值负载（2分钟，200用户）
    { duration: '2m', target: 200 },
    
    // 阶段5：超载测试（2分钟，300用户）
    { duration: '2m', target: 300 },
    
    // 阶段6：极限压力（2分钟，500用户）
    { duration: '2m', target: 500 },
    
    // 阶段7：恢复阶段（2分钟，降到0）
    { duration: '2m', target: 0 },
  ],

  thresholds: {
    // 放宽阈值以观察系统在压力下的表现
    http_req_failed: ['rate<0.20'], // 允许20%错误率
    http_req_duration: ['p(95)<8000'], // P95允许8秒
    
    checks: ['rate>0.80'], // 允许部分检查失败
  },

  throw: false, // 不抛出异常，继续执行
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)'],
};

// 压测场景权重
const STRESS_SCENARIOS = [
  { name: 'api_health', weight: 0.15 },      // 15% 健康检查
  { name: 'api_customers', weight: 0.25 },     // 25% 客户API
  { name: 'api_calls', weight: 0.25 },         // 25% 通话API
  { name: 'api_ai_chat', weight: 0.15 },        // 15% AI对话
  { name: 'api_analytics', weight: 0.20 },      // 20% 分析API
];

export function setup() {
  console.log('⚡️ Stress Test Setup - Finding System Limits');
  
  const env = __ENV.TEST_ENV || 'development';
  
  if (env === 'development') {
    Auth.login('admin@yyc3.com', 'admin123');
  }
  
  return {
    startTime: new Date().toISOString(),
    errorsByStage: {},
  };
}

export default function (data) {
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'api_health':
      stressTestHealth();
      break;
    case 'api_customers':
      stressTestCustomers();
      break;
    case 'api_calls':
      stressTestCalls();
      break;
    case 'api_ai_chat':
      stressTestAI();
      break;
    case 'api_analytics':
      stressTestAnalytics();
      break;
  }
}

function selectScenario() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const scenario of STRESS_SCENARIOS) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario.name;
    }
  }
  
  return STRESS_SCENARIOS[0].name;
}

// ============================================
// 场景1：健康检查压力测试
// ============================================
function stressTestHealth() {
  group('Stress: Health Check', function () {
    const response = BusinessOperations.healthCheck();
    
    check(response, {
      'Health check under load': (r) => r.status === 200,
      'Response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    sleep(Math.random() * 0.5); // 最小延迟，增加压力
  });
}

// ============================================
// 场景2：客户API压力测试
// ============================================
function stressTestCustomers() {
  group('Stress: Customer API', function () {
    // 快速连续请求客户列表
    for (let i = 0; i < 3; i++) {
      const page = Math.floor(Math.random() * 20) + 1;
      BusinessOperations.getCustomers(page, 50);
      
      if (i < 2) {
        sleep(Math.random() * 0.3); // 极短间隔
      }
    }

    // 偶尔创建客户（增加写入压力）
    if (Math.random() < 0.2) {
      BusinessOperations.createCustomer();
    }
  });
}

// ============================================
// 场景3：通话API压力测试
// ============================================
function stressTestCalls() {
  group('Stress: Call API', function () {
    // 多种筛选条件快速查询
    const filters = [
      {},
      { status: 'COMPLETED' },
      { status: 'PENDING' },
      { status: 'FAILED' },
    ];
    
    for (const filter of filters) {
      BusinessOperations.getCalls(
        Math.floor(Math.random() * 10) + 1,
        30,
        filter
      );
      sleep(Math.random() * 0.4);
    }
  });
}

// ============================================
// 场景4：AI功能压力测试
// ============================================
function stressTestAI() {
  group('Stress: AI Features', function () {
    // AI对话（主要压力源）
    BusinessOperations.aiChat({
      message: `压力测试消息 ${Math.random().toString(36).substring(7)} ${Date.now()}`,
    });

    sleep(Math.random() * 1 + 0.5);

    // 情感分析
    if (Math.random() < 0.5) {
      BusinessOperations.emotionAnalysis(`情感分析测试文本 ${Date.now()}`);
    }
  });
}

// ============================================
// 场景5：分析API压力测试
// ============================================
function stressTestAnalytics() {
  group('Stress: Analytics API', function () {
    // 不同时间范围的分析查询
    const timeRanges = ['1d', '7d', '30d', '90d'];
    
    for (const range of timeRanges) {
      BusinessOperations.getDashboardAnalytics(range);
      sleep(Math.random() * 0.5);
    }
  });
}

export function teardown(data) {
  console.log('\n📊 Stress Test Results Summary:');
  console.log(`   Total Duration: ${((new Date() - new Date(data.startTime)) / 1000 / 60).toFixed(1)} minutes`);
  console.log(`   Peak VUs: 500`);
  console.log(`   ⚠️  Review metrics to identify bottlenecks and breaking points`);
}
