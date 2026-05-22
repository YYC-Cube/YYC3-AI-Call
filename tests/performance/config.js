/**
 * YYC³ AI Calling - k6 性能测试配置
 * 
 * 基准配置 + 阈值定义
 */

export const options = {
  // 全局设置
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  noVUConnectionReuse: true,

  // 阈值定义（性能基准）
  thresholds: {
    // HTTP请求错误率
    http_req_failed: ['rate<0.01'], // 错误率 < 1%
    
    // HTTP请求延迟（P95）
    http_req_duration: ['p(95)<500'], // P95延迟 < 500ms
    
    // 特定API端点性能要求
    'http_req_duration{api:health}': ['p(95)<50'],
    'http_req_duration{api:auth}': ['p(95)<200'],
    'http_req_duration{api:customers}': ['p(95)<300'],
    'http_req_duration{api:calls}': ['p(95)<400'],
    'http_req_duration{api:ai-chat}': ['p(95)<3000'], // AI推理允许更长
    'http_req_duration{api:ai-emotion}': ['p(95)<2000'],
    'http_req_duration{api:analytics}': ['p(95)<1000'],

    // 并发检查
    checks: ['rate>0.99'], // 检查通过率 > 99%
    
    // 数据接收速率（bytes/s）
    data_received: ['rate>10000'],
    
    // VU（虚拟用户）数量检查
    vus: ['value<=1000'],
  },

  // 系统级指标阈值
  system_thresholds: {
    cpu_usage: ['value<80'],      // CPU使用率 < 80%
    memory_usage: ['value<85'],   // 内存使用率 < 85%
    error_rate: ['value<1'],      // 系统错误率 < 1%
  },
};

// 测试环境配置
export const ENVIRONMENTS = {
  development: {
    BASE_URL: 'http://localhost:3000',
    ADMIN_USER: { email: 'admin@yyc3.com', password: 'admin123' },
    TEST_USER: { email: 'test@yyc3.com', password: 'test123' },
  },
  
  staging: {
    BASE_URL: 'https://staging.yyc3-ai-call.com',
    ADMIN_USER: { email: 'admin@yyc3.com', password: '${STAGING_ADMIN_PASSWORD}' },
    TEST_USER: { email: 'perf-test@yyc3.com', password: '${STAGING_TEST_PASSWORD}' },
  },

  production: {
    BASE_URL: 'https://yyc3-ai-call.com',
    ADMIN_USER: { email: '', password: '' }, // 生产环境不使用默认账户
    TEST_USER: { email: '', password: '' },
  },
};

// 获取当前环境配置
export function getEnvConfig(env = __ENV.TEST_ENV || 'development') {
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
}

// API端点定义
export const API_ENDPOINTS = {
  health: '/api/health',
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    profile: '/api/auth/profile',
  },
  customers: {
    list: '/api/customers',
    create: '/api/customers',
    get: (id) => `/api/customers/${id}`,
    update: (id) => `/api/customers/${id}`,
    delete: (id) => `/api/customers/${id}`,
  },
  calls: {
    list: '/api/calls',
    create: '/api/calls',
    get: (id) => `/api/calls/${id}`,
    update: (id) => `/api/calls/${id}`,
    cancel: (id) => `/api/calls/${id}/cancel`,
  },
  ai: {
    chat: '/api/ai/chat',
    emotion: '/api/ai/emotion/analyze',
    embedding: '/api/ai/embedding',
    summarize: '/api/ai/summarize',
  },
  analytics: {
    dashboard: '/api/analytics/dashboard',
    calls: '/api/analytics/calls',
    customers: '/api/analytics/customers',
    ai_performance: '/api/analytics/ai-performance',
  },
};

// 测试数据生成器
export const TestDataGenerator = {
  // 生成随机客户数据
  customer() {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const companies = ['科技有限公司', '互联网公司', '金融集团', '教育机构', '医疗健康'];
    const phones = ['13800138000', '13900139000', '15800158000', '18600186000', '17700177000'];
    
    return {
      name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100),
      phone: phones[Math.floor(Math.random() * phones.length)],
      email: `test${Math.floor(Math.random() * 100000)}@example.com`,
      company: companies[Math.floor(Math.random() * companies.length)],
      notes: `性能测试自动生成 - ${new Date().toISOString()}`,
    };
  },

  // 生成随机通话记录
  call(customerId) {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];
    const types = ['OUTBOUND', 'INBOUND'];
    
    return {
      customerId,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration: Math.floor(Math.random() * 3600), // 0-3600秒
      transcript: '这是一段用于性能测试的模拟通话内容...' + Math.random().toString(36).substring(7),
    };
  },

  // 生成AI对话消息
  aiMessage() {
    const messages = [
      '你好，我想了解一下你们的产品服务',
      '请问你们的AI智能呼叫系统有什么优势？',
      '能否详细说明一下定价方案？',
      '我需要定制化的解决方案，可以联系销售吗？',
      '系统支持多语言吗？支持哪些语言？',
      '如何保证通话质量和客户满意度？',
      '数据分析功能包括哪些方面？',
      '是否提供API接口供系统集成？',
    ];
    
    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      context: {
        source: 'performance_test',
        timestamp: new Date().toISOString(),
      },
    };
  },
};
