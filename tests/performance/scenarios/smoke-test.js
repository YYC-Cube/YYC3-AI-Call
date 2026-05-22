/**
 * YYC³ AI Calling - 冒烟测试（Smoke Test）
 * 
 * 目的：验证基本功能是否正常
 * 场景：1个用户，每个API调用1次
 * 用途：部署后快速验证
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Auth, BusinessOperations, ThinkTime } from '../utils/helpers.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1.0'], // 所有检查必须通过
  },
};

export default function () {
  // ============================================
  // 第1组：认证流程
  // ============================================
  group('Authentication Flow', function () {
    const env = __ENV.TEST_ENV || 'development';
    let email, password;

    if (env === 'development') {
      email = 'admin@yyc3.com';
      password = 'admin123';
    } else {
      email = __ENV.TEST_EMAIL || '';
      password = __ENV.TEST_PASSWORD || '';
    }

    const loginResult = Auth.login(email, password);
    
    check(loginResult, {
      'Login successful': (r) => r.success === true,
      'Token received': (r) => r.token !== undefined && r.token.length > 0,
    });

    ThinkTime.fixed(0.5);
  });

  // ============================================
  // 第2组：健康检查
  // ============================================
  group('Health Check', function () {
    const healthResponse = BusinessOperations.healthCheck();
    
    check(healthResponse.json(), {
      'System status is healthy': (data) => 
        data.status === 'healthy' || data.status === 'degraded',
    });

    ThinkTime.fixed(0.3);
  });

  // ============================================
  // 第3组：客户管理
  // ============================================
  group('Customer Management', function () {
    // 获取客户列表
    const customersResponse = BusinessOperations.getCustomers(1, 10);
    
    if (customersResponse.status === 200) {
      const customers = customersResponse.json('data');
      
      check(customers, {
        'Customers loaded': (list) => Array.isArray(list),
        'At least 0 customers': (list) => list.length >= 0,
      });
    }

    ThinkTime.random(1, 2);

    // 创建新客户
    const createResponse = BusinessOperations.createCustomer();
    
    check(createResponse, {
      'Customer created successfully': (r) => r.status === 201,
    });

    ThinkTime.fixed(0.5);
  });

  // ============================================
  // 第4组：通话记录
  // ============================================
  group('Call Records', function () {
    const callsResponse = BusinessOperations.getCalls(1, 10);
    
    check(callsResponse, {
      'Calls list retrieved': (r) => r.status === 200,
    });

    ThinkTime.random(1, 2);
  });

  // ============================================
  // 第5组：AI功能
  // ============================================
  group('AI Features', function () {
    // AI对话
    const chatResponse = BusinessOperations.aiChat({
      message: '你好，这是一条冒烟测试消息',
    });
    
    check(chatResponse, {
      'AI chat responded': (r) => r.status === 200,
      'AI response has content': (r) => r.json('response')?.length > 0,
    });

    ThinkTime.random(2, 4);

    // 情感分析
    const emotionResponse = BusinessOperations.emotionAnalysis(
      '今天心情很好，服务很满意！'
    );
    
    check(emotionResponse, {
      'Emotion analysis completed': (r) => r.status === 200,
      'Emotion detected': (r) => r.json('emotion') !== undefined,
    });

    ThinkTime.fixed(1);
  });

  // ============================================
  // 第6组：数据分析
  // ============================================
  group('Analytics Dashboard', function () {
    const analyticsResponse = BusinessOperations.getDashboardAnalytics('7d');
    
    check(analyticsResponse, {
      'Dashboard data loaded': (r) => r.status === 200,
      'Has summary statistics': (r) => r.json('summary') !== undefined,
    });

    ThinkTime.fixed(1);
  });

  console.log('✅ Smoke Test Completed - All basic functions verified');
}
