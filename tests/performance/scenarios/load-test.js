/**
 * YYC³ AI Calling - 负载测试（Load Test）
 * 
 * 目的：验证系统在正常负载下的性能表现
 * 场景：模拟100个并发用户，持续5分钟
 * 用途：容量规划、性能基准建立
 */

import { check, group, sleep } from 'k6';
import { Auth, BusinessOperations, ThinkTime } from '../utils/helpers.js';

export const options = {
  stages: [
    // 阶段1：预热（2分钟，逐步增加到50用户）
    { duration: '2m', target: 50 },
    
    // 阶段2：高负载（3分钟，保持100用户）
    { duration: '3m', target: 100 },
    
    // 阶段3：峰值（2分钟，增加到150用户）
    { duration: '2m', target: 150 },
    
    // 阶段4：恢复（2分钟，降到20用户）
    { duration: '2m', target: 20 },
  ],

  thresholds: {
    // 全局阈值
    http_req_failed: ['rate<0.05'], // 错误率 < 5%
    http_req_duration: ['p(95)<2000'], // P95延迟 < 2秒
    
    // API特定阈值
    'http_req_duration{api:health}': ['p(95)<100'],
    'http_req_duration{api:customers}': ['p(95)<500'],
    'http_req_duration{api:calls}': ['p(95)<800'],
    'http_req_duration{api:ai-chat}': ['p(95)<5000'], // AI允许更长时间
    'http_req_duration{api:analytics}': ['p(95)<1500'],
    
    checks: ['rate>0.95'],
  },

  // 配置
  throw: true, // 检查失败时抛出异常
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// 用户行为分布
const USER_BEHAVIORS = [
  { name: 'dashboard_user', weight: 0.4 },      // 40% 用户查看仪表板
  { name: 'customer_manager', weight: 0.25 },     // 25% 用户管理客户
  { name: 'call_operator', weight: 0.2 },         // 20% 用户操作通话
  { name: 'ai_user', weight: 0.15 },              // 15% 用户使用AI功能
];

export function setup() {
  console.log('🚀 Load Test Setup Started');
  
  const env = __ENV.TEST_ENV || 'development';
  
  if (env === 'development') {
    Auth.login('admin@yyc3.com', 'admin123');
  } else {
    Auth.login(__ENV.TEST_EMAIL, __ENV.TEST_PASSWORD);
  }
  
  return { startTime: new Date().toISOString() };
}

export default function (data) {
  // 根据权重选择用户行为
  const behavior = selectBehavior();
  
  switch (behavior) {
    case 'dashboard_user':
      simulateDashboardUser();
      break;
    case 'customer_manager':
      simulateCustomerManager();
      break;
    case 'call_operator':
      simulateCallOperator();
      break;
    case 'ai_user':
      simulateAIUser();
      break;
  }
}

function selectBehavior() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const behavior of USER_BEHAVIORS) {
    cumulative += behavior.weight;
    if (random <= cumulative) {
      return behavior.name;
    }
  }
  
  return USER_BEHAVIORS[0].name;
}

// ============================================
// 用户类型1：仪表板浏览者（40%）
// ============================================
function simulateDashboardUser() {
  group('Dashboard User Flow', function () {
    // 刷新健康状态
    BusinessOperations.healthCheck();
    ThinkTime.byPage('dashboard');

    // 查看分析仪表板
    BusinessOperations.getDashboardAnalytics('7d');
    ThinkTime.byPage('analytics');

    // 再次查看仪表板（不同时间范围）
    BusinessOperations.getDashboardAnalytics('30d');
    ThinkTime.random(3, 6);
  });
}

// ============================================
// 用户类型2：客户管理者（25%）
// ============================================
function simulateCustomerManager() {
  group('Customer Manager Flow', function () {
    // 浏览客户列表（分页）
    const page = Math.floor(Math.random() * 5) + 1; // 1-5页
    BusinessOperations.getCustomers(page, 20);
    ThinkTime.byPage('customerList');

    // 创建新客户（30%概率）
    if (Math.random() < 0.3) {
      BusinessOperations.createCustomer();
      ThinkTime.fixed(1);
    }

    // 查看另一页
    const nextPage = Math.floor(Math.random() * 10) + 1; // 1-10页
    BusinessOperations.getCustomers(nextPage, 20);
    ThinkTime.byPage('customerList');

    // 偶尔搜索/筛选
    if (Math.random() < 0.2) {
      BusinessOperations.getCalls(1, 20, { status: 'COMPLETED' });
      ThinkTime.fixed(1);
    }
  });
}

// ============================================
// 用户类型3：通话操作员（20%）
// ============================================
function simulateCallOperator() {
  group('Call Operator Flow', function () {
    // 查看待处理通话
    BusinessOperations.getCalls(1, 20, { status: 'PENDING' });
    ThinkTime.byPage('callList');

    // 查看已完成通话
    BusinessOperations.getCalls(1, 20, { status: 'COMPLETED' });
    ThinkTime.byPage('callList');

    // 查看最近通话记录
    BusinessOperations.getCalls(1, 50);
    ThinkTime.byPage('callDetail');

    // 分页浏览
    const page = Math.floor(Math.random() * 8) + 1;
    BusinessOperations.getCalls(page, 20);
    ThinkTime.random(2, 4);
  });
}

// ============================================
// 用户类型4：AI功能使用者（15%）
// ============================================
function simulateAIUser() {
  group('AI User Flow', function () {
    // AI对话
    BusinessOperations.aiChat();
    ThinkTime.byPage('aiChat'); // 等待AI响应

    // 第二次对话（追问）
    BusinessOperations.aiChat({
      message: '能否详细说明一下具体流程？',
    });
    ThinkTime.byPage('aiChat');

    // 情感分析（60%概率）
    if (Math.random() < 0.6) {
      const texts = [
        '我对这次服务非常满意！',
        '这个产品太棒了，推荐给大家',
        '希望能改进响应速度',
        '客服态度很好，解决问题很及时',
      ];
      
      BusinessOperations.emotionAnalysis(
        texts[Math.floor(Math.random() * texts.length)]
      );
      ThinkTime.fixed(1);
    }

    // 第三次AI对话（复杂问题）
    if (Math.random() < 0.4) {
      BusinessOperations.aiChat({
        message: '请帮我分析一下我们公司的业务数据，并给出优化建议',
        context: {
          detailedRequest: true,
          includeCharts: true,
        },
      });
      ThinkTime.random(3, 6); // 复杂问题需要更长等待时间
    }
  });
}

export function teardown(data) {
  console.log(`✅ Load Test Completed`);
  console.log(`   Duration: ${((new Date() - new Date(data.startTime)) / 1000).toFixed(1)}s`);
}
