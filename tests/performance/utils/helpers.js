/**
 * YYC³ AI Calling - k6 性能测试工具函数
 * 
 * 通用工具：认证、请求、指标收集
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { API_ENDPOINTS, getEnvConfig, TestDataGenerator } from './config.js';

// ============================================
// 自定义指标
// ============================================
export const metrics = {
  // API响应时间趋势
  apiHealthDuration: new Trend('api_health_duration', true),
  apiAuthDuration: new Trend('api_auth_duration', true),
  apiCustomerDuration: new Trend('api_customer_duration', true),
  apiCallDuration: new Trend('api_call_duration', true),
  apiAIChatDuration: new Trend('api_ai_chat_duration', true),
  apiAIEmotionDuration: new Trend('api_ai_emotion_duration', true),
  apiAnalyticsDuration: new Trend('api_analytics_duration', true),

  // 错误率
  errorRate: new Rate('errors'),
  
  // 计数器
  totalRequests: new Counter('total_requests'),
  successfulRequests: new Counter('successful_requests'),
  failedRequests: new Counter('failed_requests'),
};

// ============================================
// 认证管理
// ============================================
let authToken = null;
let refreshTokenValue = null;

export const Auth = {
  /**
   * 登录获取JWT Token
   */
  login(email, password) {
    const env = getEnvConfig();
    const response = http.post(
      `${env.BASE_URL}${API_ENDPOINTS.auth.login}`,
      JSON.stringify({ email, password }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { api: 'auth' },
      }
    );

    check(response, {
      'Login successful': (r) => r.status === 200,
      'Response has token': (r) => r.json('token') !== undefined,
      'Response has refresh token': (r) => r.json('refreshToken') !== undefined,
    });

    if (response.status === 200) {
      authToken = response.json('token');
      refreshTokenValue = response.json('refreshToken');
      metrics.apiAuthDuration.add(response.timings.duration);
      metrics.successfulRequests.add(1);
    } else {
      metrics.errorRate.add(1);
      metrics.failedRequests.add(1);
    }

    metrics.totalRequests.add(1);

    return {
      success: response.status === 200,
      token: authToken,
      refreshToken: refreshTokenValue,
    };
  },

  /**
   * 刷新Token
   */
  refresh() {
    if (!refreshTokenValue) return null;

    const env = getEnvConfig();
    const response = http.post(
      `${env.BASE_URL}${API_ENDPOINTS.auth.refresh}`,
      JSON.stringify({ refreshToken: refreshTokenValue }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { api: 'auth' },
      }
    );

    if (response.status === 200) {
      authToken = response.json('token');
      refreshTokenValue = response.json('refreshToken');
    }

    return authToken;
  },

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };
  },

  /**
   * 检查Token是否有效（简单验证）
   */
  isTokenValid() {
    return authToken && authToken.length > 0;
  },
};

// ============================================
// HTTP请求封装
// ============================================
export const RequestHelper = {
  /**
   * 发送GET请求
   */
  get(url, params = {}, tags = {}) {
    const env = getEnvConfig();
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';

    const response = http.get(
      `${env.BASE_URL}${url}${queryString}`,
      {
        headers: Auth.getAuthHeaders(),
        tags: { ...tags, method: 'GET' },
      }
    );

    this.trackMetrics(response, tags);
    return response;
  },

  /**
   * 发送POST请求
   */
  post(url, body, tags = {}) {
    const env = getEnvConfig();

    const response = http.post(
      `${env.BASE_URL}${url}`,
      JSON.stringify(body),
      {
        headers: Auth.getAuthHeaders(),
        tags: { ...tags, method: 'POST' },
      }
    );

    this.trackMetrics(response, tags);
    return response;
  },

  /**
   * 发送PUT请求
   */
  put(url, body, tags = {}) {
    const env = getEnvConfig();

    const response = http.put(
      `${env.BASE_URL}${url}`,
      JSON.stringify(body),
      {
        headers: Auth.getAuthHeaders(),
        tags: { ...tags, method: 'PUT' },
      }
    );

    this.trackMetrics(response, tags);
    return response;
  },

  /**
   * 发送DELETE请求
   */
  delete(url, tags = {}) {
    const env = getEnvConfig();

    const response = http.del(
      `${env.BASE_URL}${url}`,
      null,
      {
        headers: Auth.getAuthHeaders(),
        tags: { ...tags, method: 'DELETE' },
      }
    );

    this.trackMetrics(response, tags);
    return response;
  },

  /**
   * 追踪指标
   */
  trackMetrics(response, tags = {}) {
    const apiType = tags.api || 'unknown';

    switch (apiType) {
      case 'health':
        metrics.apiHealthDuration.add(response.timings.duration);
        break;
      case 'auth':
        metrics.apiAuthDuration.add(response.timings.duration);
        break;
      case 'customers':
        metrics.apiCustomerDuration.add(response.timings.duration);
        break;
      case 'calls':
        metrics.apiCallDuration.add(response.timings.duration);
        break;
      case 'ai-chat':
        metrics.apiAIChatDuration.add(response.timings.duration);
        break;
      case 'ai-emotion':
        metrics.apiAIEmotionDuration.add(response.timings.duration);
        break;
      case 'analytics':
        metrics.apiAnalyticsDuration.add(response.timings.duration);
        break;
    }

    metrics.totalRequests.add(1);

    if (response.status >= 200 && response.status < 300) {
      metrics.successfulRequests.add(1);
    } else {
      metrics.errorRate.add(1);
      metrics.failedRequests.add(1);
    }
  },
};

// ============================================
// 业务操作封装
// ============================================
export const BusinessOperations = {
  /**
   * 健康检查
   */
  healthCheck() {
    const response = RequestHelper.get(API_ENDPOINTS.health, {}, { api: 'health' });
    
    check(response, {
      'Health check status 200': (r) => r.status === 200,
      'Health check response time < 50ms': (r) => r.timings.duration < 50,
      'Health check has status field': (r) => r.json('status') !== undefined,
    });

    return response;
  },

  /**
   * 获取客户列表
   */
  getCustomers(page = 1, limit = 20) {
    const response = RequestHelper.get(
      API_ENDPOINTS.customers.list,
      { page, limit },
      { api: 'customers' }
    );

    check(response, {
      'Get customers status 200': (r) => r.status === 200,
      'Customers list is array': (r) => Array.isArray(r.json('data')),
      'Has pagination info': (r) => r.json('pagination') !== undefined,
    });

    return response;
  },

  /**
   * 创建客户
   */
  createCustomer(customerData = TestDataGenerator.customer()) {
    const response = RequestHelper.post(
      API_ENDPOINTS.customers.create,
      customerData,
      { api: 'customers' }
    );

    check(response, {
      'Create customer status 201': (r) => r.status === 201,
      'Customer created with ID': (r) => r.json('id') !== undefined,
    });

    return response;
  },

  /**
   * 获取通话记录列表
   */
  getCalls(page = 1, limit = 20, filters = {}) {
    const response = RequestHelper.get(
      API_ENDPOINTS.calls.list,
      { page, limit, ...filters },
      { api: 'calls' }
    );

    check(response, {
      'Get calls status 200': (r) => r.status === 200,
      'Calls list is array': (r) => Array.isArray(r.json('data')),
    });

    return response;
  },

  /**
   * 创建通话记录
   */
  createCall(callData) {
    const response = RequestHelper.post(
      API_ENDPOINTS.calls.create,
      callData,
      { api: 'calls' }
    );

    check(response, {
      'Create call status 201': (r) => r.status === 201,
      'Call created with ID': (r) => r.json('id') !== undefined,
    });

    return response;
  },

  /**
   * AI对话
   */
  aiChat(messageData = TestDataGenerator.aiMessage()) {
    const startTime = Date.now();
    
    const response = RequestHelper.post(
      API_ENDPOINTS.ai.chat,
      messageData,
      { api: 'ai-chat' }
    );

    const duration = Date.now() - startTime;

    check(response, {
      'AI chat status 200': (r) => r.status === 200,
      'AI chat has response': (r) => r.json('response') !== undefined,
      'AI chat duration acceptable': () => duration < 5000, // AI推理允许5秒
    });

    return response;
  },

  /**
   * 情感分析
   */
  emotionAnalysis(text) {
    const response = RequestHelper.post(
      API_ENDPOINTS.ai.emotion,
      { text },
      { api: 'ai-emotion' }
    );

    check(response, {
      'Emotion analysis status 200': (r) => r.status === 200,
      'Emotion result has emotion field': (r) => r.json('emotion') !== undefined,
      'Emotion result has confidence': (r) => r.json('confidence') !== undefined,
    });

    return response;
  },

  /**
   * 获取分析仪表板数据
   */
  getDashboardAnalytics(timeRange = '7d') {
    const response = RequestHelper.get(
      API_ENDPOINTS.analytics.dashboard,
      { timeRange },
      { api: 'analytics' }
    );

    check(response, {
      'Dashboard analytics status 200': (r) => r.status === 200,
      'Dashboard has summary data': (r) => r.json('summary') !== undefined,
    });

    return response;
  },
};

// ============================================
// 思考时间模拟
// ============================================
export const ThinkTime = {
  /**
   * 随机思考时间（模拟用户阅读/操作间隔）
   */
  random(min = 1, max = 3) {
    sleep(Math.random() * (max - min) + min);
  },

  /**
   * 固定思考时间
   */
  fixed(seconds) {
    sleep(seconds);
  },

  /**
   * 根据页面类型选择思考时间
   */
  byPage(pageType) {
    const times = {
      login: [0.5, 1],
      dashboard: [2, 5],
      customerList: [1, 3],
      customerDetail: [2, 4],
      callList: [1, 3],
      callDetail: [3, 6],
      aiChat: [2, 4], // AI响应等待
      analytics: [3, 8], // 数据加载
    };

    const [min, max] = times[pageType] || [1, 3];
    this.random(min, max);
  },
};
