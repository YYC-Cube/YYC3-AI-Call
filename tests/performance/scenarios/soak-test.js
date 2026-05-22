/**
 * YYC³ AI Calling - 浸泡测试（Soak Test / Endurance Test）
 * 
 * 目的：验证系统长时间运行的稳定性
 * 场景：中等负载持续运行1-2小时
 * 用途：内存泄漏检测、资源耗尽验证、长期稳定性评估
 */

import { check, group, sleep } from 'k6';
import { Auth, BusinessOperations, ThinkTime } from '../utils/helpers.js';

export const options = {
  // 长时间测试配置
  stages: [
    // 预热阶段（5分钟，逐步到20用户）
    { duration: '5m', target: 20 },
    
    // 持续负载阶段（根据环境变量调整时长）
    // 默认1小时，可通过 DURATION 环境变量覆盖
    { duration: __ENV.DURATION || '1h', target: 50 },
    
    // 冷却阶段（5分钟，降到0）
    { duration: '5m', target: 0 },
  ],

  thresholds: {
    // 长时间运行的严格阈值
    http_req_failed: ['rate<0.01'], // 错误率 < 1%
    http_req_duration: ['p(95)<1500'], // P95延迟 < 1.5秒
    
    // API特定阈值
    'http_req_duration{api:health}': ['p(99)<100'],
    'http_req_duration{api:customers}': ['p(95)<400'],
    'http_req_duration{api:calls}': ['p(95)<600'],
    'http_req_duration{api:ai-chat}': ['p(95)<4000'],
    
    checks: ['rate>0.98'], // 检查通过率 > 98%
  },

  throw: true,
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// 用户会话模拟
let userSession = {
  customerId: null,
  callId: null,
  messageCount: 0,
};

export function setup() {
  console.log('🔄 Soak Test Setup - Long-running Stability Test');
  console.log(`   Duration: ${__ENV.DURATION || '1 hour'}`);
  
  const env = __ENV.TEST_ENV || 'development';
  
  if (env === 'development') {
    Auth.login('admin@yyc3.com', 'admin123');
  }
  
  return {
    startTime: new Date().toISOString(),
    iterationCount: 0,
    errorCount: 0,
  };
}

export default function (data) {
  data.iterationCount++;
  
  try {
    runUserSession(data);
  } catch (error) {
    data.errorCount++;
    console.error(`❌ Iteration ${data.iterationCount} failed:`, error.message);
    
    // 尝试重新认证
    if (!Auth.isTokenValid()) {
      const env = __ENV.TEST_ENV || 'development';
      if (env === 'development') {
        Auth.login('admin@yyc3.com', 'admin123');
      }
    }
  }

  // 每100次迭代输出状态
  if (data.iterationCount % 100 === 0) {
    logProgress(data);
  }
}

function runUserSession(data) {
  // ============================================
  // 定期健康检查（每10次迭代）
  // ============================================
  if (data.iterationCount % 10 === 0) {
    group('Periodic Health Check', function () {
      BusinessOperations.healthCheck();
      ThinkTime.fixed(0.2);
    });
  }

  // ============================================
  // 主要业务流程（模拟真实用户行为）
  // ============================================
  group('Normal User Session', function () {
    // 1. 查看仪表板
    BusinessOperations.getDashboardAnalytics('7d');
    ThinkTime.byPage('dashboard');

    // 2. 浏览客户列表
    const page = Math.floor(Math.random() * 15) + 1;
    const customersResponse = BusinessOperations.getCustomers(page, 20);
    
    if (customersResponse.status === 200 && Math.random() < 0.1) {
      // 10%概率创建新客户
      const createResponse = BusinessOperations.createCustomer();
      if (createResponse.status === 201) {
        userSession.customerId = createResponse.json('id');
      }
      ThinkTime.fixed(1);
    }

    ThinkTime.byPage('customerList');

    // 3. 浏览通话记录
    const callsResponse = BusinessOperations.getCalls(
      Math.floor(Math.random() * 20) + 1,
      20,
      {}
    );
    ThinkTime.byPage('callList');

    // 4. AI功能使用（30%概率）
    if (Math.random() < 0.3) {
      group('AI Interaction', function () {
        BusinessOperations.aiChat();
        userSession.messageCount++;
        
        ThinkTime.byPage('aiChat');

        // 偶尔进行情感分析
        if (Math.random() < 0.4) {
          BusinessOperations.emotionAnalysis(`长时间运行测试 - 第${data.iterationCount}次迭代`);
          ThinkTime.fixed(0.8);
        }
      });
    }

    // 5. 不同时间范围的分析查询（20%概率）
    if (Math.random() < 0.2) {
      const ranges = ['1d', '7d', '30d', '90d'];
      const range = ranges[Math.floor(Math.random() * ranges.length)];
      
      BusinessOperations.getDashboardAnalytics(range);
      ThinkTime.byPage('analytics');
    }
  });
}

function logProgress(data) {
  const elapsedMinutes = ((new Date() - new Date(data.startTime)) / 1000 / 60).toFixed(1);
  
  console.log(`\n📊 Soak Test Progress [${elapsedMinutes}m]:`);
  console.log(`   Iterations: ${data.iterationCount}`);
  console.log(`   Errors: ${data.errorCount}`);
  console.log(`   AI Messages Sent: ${userSession.messageCount}`);
  console.log(`   System Status: Running`);
}

export function teardown(data) {
  const totalDuration = ((new Date() - new Date(data.startTime)) / 1000 / 60).toFixed(1);
  const errorRate = ((data.errorCount / data.iterationCount) * 100).toFixed(2);
  
  console.log('\n✅ Soak Test Completed!');
  console.log('\n📈 Final Statistics:');
  console.log(`   Total Duration: ${totalDuration} minutes`);
  console.log(`   Total Iterations: ${data.iterationCount}`);
  console.log(`   Error Count: ${data.errorCount}`);
  console.log(`   Error Rate: ${errorRate}%`);
  console.log(`   AI Messages Processed: ${userSession.messageCount}`);
  console.log('\n💡 Recommendations:');
  console.log('   - Review memory usage trends for potential leaks');
  console.log('   - Check database connection pool stability');
  console.log('   - Monitor Redis memory usage over time');
  console.log('   - Analyze GC pauses in Node.js runtime');
}
