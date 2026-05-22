# 🌐 YYC³ AI Calling - 全局数据API架构文档 V3.0

## 📋 文档信息
- **版本**: V3.0 Final
- **生成日期**: 2026-05-02
- **文档类型**: 数据接口规范与集成指南
- **Base URL**: `https://api.yyc3-ai-call.com/v1`
- **协议**: HTTPS (TLS 1.3)

---

## 🔐 一、认证与授权机制

### 1.1 认证方式

#### **API Key认证（推荐）**
```http
Authorization: Bearer your-api-key-here
X-API-Key: your-api-key-here
```

#### **OAuth 2.0 Token**
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Token获取流程

**Step 1: 获取访问令牌**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "provider": "zhipu",
  "apiKey": "your-zhipu-api-key",
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "type": "bearer",
      "value": "eyJhbGciOi...",
      "expiresAt": "2026-05-03T02:00:00Z",
      "refreshToken": "v1.eyJhbGciOi..."
    },
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "张三",
      "role": "admin"
    }
  },
  "timestamp": "2026-05-02T02:00:00Z",
  "requestId": "req-1741234567890-abc123def"
}
```

**Step 2: 使用Token访问API**
```http
GET /api/v1/customers
Authorization: Bearer eyJhbGciOi...
X-Request-ID: custom-request-id
```

---

## 📊 二、核心数据模型

### 2.1 通用响应格式

所有API响应遵循统一格式：

```typescript
interface ApiResponse<T> {
  success: boolean;           // 操作是否成功
  data?: T;                   // 成功时的数据载荷
  error?: string;             // 失败时的错误信息
  message?: string;           // 可选的提示消息
  timestamp: string;          // 响应时间戳 (ISO 8601)
  requestId: string;          // 请求追踪ID
  metadata?: {                // 元数据
    processingTime: number;   // 处理耗时(ms)
    pagination?: PaginationInfo;
    rateLimit?: RateLimitInfo;
  };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}
```

### 2.2 错误码体系

| 错误码 | HTTP状态 | 描述 | 处理建议 |
|-------|---------|------|---------|
| `E0001` | 400 | 请求参数无效 | 检查请求体格式 |
| `E0002` | 401 | 未授权/Token过期 | 重新登录获取Token |
| `E0003` | 403 | 权限不足 | 联系管理员提升权限 |
| `E0004` | 404 | 资源不存在 | 检查资源ID是否正确 |
| `E0005` | 409 | 资源冲突 | 检查数据唯一性约束 |
| `E0006` | 429 | 请求频率超限 | 降低请求频率 |
| `E0100` | 500 | 服务器内部错误 | 稍后重试或联系支持 |
| `E0101` | 502 | 上游服务不可用 | 检查AI服务状态 |
| `E0103` | 503 | 服务暂时不可用 | 稍后重试 |

**错误响应示例：**
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "code": "E0001",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2026-05-02T02:00:00Z",
  "requestId": "req-1741234567890-xyz789"
}
```

---

## 🤖 三、AI Family API 详细规范

### 3.1 获取Agent列表

**Endpoint:** `GET /api/v1/ai-family?action=agents`

**Query Parameters:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| action | string | ✅ | 固定值：`agents` |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "meta-oracle",
        "name": "MetaOracle",
        "displayName": "元启大师",
        "role": "master",
        "status": "active",
        "capabilities": [
          {"name": "task-orchestration", "description": "任务编排能力"},
          {"name": "complex-reasoning", "description": "复杂推理"}
        ],
        "metrics": {
          "tasksCompleted": 1523,
          "tasksFailed": 12,
          "averageProcessingTime": 1250,
          "successRate": 99.21
        }
        // ... 其他7个Agent
      }
    ],
    "count": 8
  }
}
```

### 3.2 创建任务

**Endpoint:** `POST /api/v1/ai-family`

**Request Body:**
```json
{
  "action": "create-task",
  "type": "text-generation",
  "input": {
    "type": "text",
    "data": {
      "content": "请为新产品撰写营销文案",
      "language": "zh-CN",
      "style": "professional"
    }
  },
  "priority": "high",
  "sessionId": "collab-session-123"
}
```

**Task Type枚举值:**
| 类型 | 描述 | 推荐Agent |
|-----|------|----------|
| `text-generation` | 文本生成 | ContentCreator |
| `intent-recognition` | 意图识别 | IntentRecognizer |
| `dialogue-management` | 对话管理 | DialogueMaster |
| `data-analysis` | 数据分析 | DataAnalyst |
| `image-analysis` | 图像分析 | 需配合Multimodal |
| `document-processing` | 文档处理 | 需配合Multimodal |

**Priority枚举值:**
- `low` - 低优先级
- `normal` - 普通优先级（默认）
- `high` - 高优先级
- `urgent` - 紧急

**Response Data:**
```json
{
  "success": true,
  "data": {
    "id": "task-1741234567890-abc123def",
    "type": "text-generation",
    "status": "pending",
    "priority": "high",
    "createdAt": "2026-05-02T02:00:00Z",
    "retries": 0,
    "maxRetries": 3
  }
}
```

### 3.3 提交任务执行

**Endpoint:** `POST /api/v1/ai-family`

**Request Body:**
```json
{
  "action": "submit-task",
  "task": {
    "id": "task-1741234567890-abc123def",
    "type": "text-generation",
    "input": {
      "type": "text",
      "data": {...}
    }
  }
}
```

**Response Data:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "content": "🚀 全新智能产品，引领未来趋势...",
      "wordCount": 256,
      "language": "zh-CN",
      "confidence": 0.95
    },
    "metadata": {
      "executionTime": 1250,
      "agentId": "content-creator",
      "timestamp": "2026-05-02T02:00:01Z",
      "confidence": 0.95,
      "tokensUsed": 450
    }
  }
}
```

### 3.4 启动协作会话

**Endpoint:** `POST /api/v1/ai-family`

**Request Body:**
```json
{
  "action": "collaborate",
  "mode": "parallel",
  "tasks": [
    {
      "type": "intent-recognition",
      "input": {
        "type": "text",
        "data": {"content": "用户输入文本"}
      }
    },
    {
      "type": "sentiment-analysis",
      "input": {
        "type": "text",
        "data": {"content": "同上"}
      }
    }
  ]
}
```

**Collaboration Mode枚举值:**
| 模式 | 描述 | 适用场景 |
|-----|------|---------|
| `parallel` | 并行执行 | 独立任务批量处理 |
| `sequential` | 顺序执行 | 任务链有依赖关系 |
| `hierarchical` | 层级执行 | 主从式复杂编排 |
| `consensus` | 共识决策 | 多Agent投票确认 |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "sessionId": "collab-1741234567900",
    "results": {
      "task-xxx": {
        "success": true,
        "data": {...},
        "metadata": {...}
      },
      "task-yyy": {
        "success": true,
        "data": {...},
        "metadata": {...}
      }
    },
    "summary": "Collaboration session completed: 2/2 tasks successful (100%) using parallel mode"
  }
}
```

---

## 🎨 四、Multimodal API 详细规范

### 4.1 图像分析

**Endpoint:** `POST /api/v1/multimodal/image/analyze`

**Content-Type:** `multipart/form-data`

**Form Fields:**
| 字段 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| image | file | ✅ | 图像文件 (PNG/JPEG/GIF/WEBP, ≤10MB) |
| tasks | string[] | ✅ | 分析任务列表 (JSON数组) |

**Tasks选项:**
- `describe` - 图像描述
- `ocr` - 文字识别
- `classify` - 内容分类
- `detect_objects` - 物体检测
- `analyze_face` - 人脸分析
- `generate_caption` - 标题生成

**Example Request (curl):**
```bash
curl -X POST https://api.yyc3-ai-call.com/v1/multimodal/image/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@product-photo.jpg" \
  -F 'tasks=["describe","classify","ocr"]'
```

**Response Data:**
```json
{
  "success": true,
  "data": [
    {
      "success": true,
      "task": "describe",
      "data": {
        "description": "这是一张展示智能手机产品的商业摄影图片...",
        "confidence": 0.92,
        "keywords": ["智能手机", "产品", "科技"]
      },
      "processingTime": 1500,
      "confidence": 0.92
    },
    {
      "success": true,
      "task": "ocr",
      "data": {
        "ocrText": "新品上市\n限时优惠\n¥2999起",
        "language": "zh-CN",
        "confidence": 0.98
      },
      "processingTime": 800,
      "confidence": 0.98
    }
  ]
}
```

### 4.2 音频转录

**Endpoint:** `POST /api/v1/multimodal/audio/transcribe`

**Request Body (multipart):**
| 字段 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| audio | file | ✅ | 音频文件 (MP3/WAV/AAC, ≤50MB) |
| language | string | ❌ | 语言代码 (默认: `auto`) |
| format | string | ❌ | 输出格式 (`text`/`srt`/`json`, 默认: `text`) |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "task": "transcribe",
    "data": {
      "text": "您好，这里是YYC³智能客服中心...",
      "language": "zh-CN",
      "duration": 125.5,
      "segments": [
        {
          "start": 0.0,
          "end": 3.2,
          "text": "您好，这里是YYC³智能客服中心",
          "confidence": 0.95
        }
      ]
    },
    "processingTime": 3500,
    "confidence": 0.94
  }
}
```

### 4.3 文档处理

**Endpoint:** `POST /api/v1/multimodal/document/:action`

**可用Actions:**
- `extract-text` - 提取文本
- `summarize` - 生成摘要
- `parse` - 解析结构
- `compare` - 文档对比

**Request Body (multipart):**
| 字段 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| document | file | ✅ | 文档文件 (PDF/DOCX/TXT, ≤20MB) |
| options | JSON | ❌ | 处理选项 |

**Extract Text Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "task": "extract_text",
    "data": {
      "content": "完整文档文本内容...",
      "metadata": {
        "pageCount": 15,
        "wordCount": 5200,
        "language": "zh-CN"
      }
    },
    "processingTime": 2200,
    "confidence": 0.97
  }
}
```

**Summarize Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "task": "summarize",
    "data": {
      "summary": "本文档主要讨论了YYC³ AI Calling平台的功能特性和应用场景...",
      "keyPoints": ["要点1", "要点2", "要点3"],
      "originalLength": 5200,
      "summaryLength": 280
    },
    "processingTime": 1800,
    "confidence": 0.89
  }
}
```

---

## 🔗 五、MCP API 详细规范

### 5.1 列出工具

**Endpoint:** `GET /api/v1/mcp/tools`

**Query Parameters:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| category | string | ❌ | 工具分类过滤 |
| search | string | ❌ | 关键词搜索 |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "web-search",
        "description": "网络搜索工具",
        "category": "information",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "搜索关键词"
            },
            "limit": {
              "type": "number",
              "description": "结果数量限制",
              "default": 10
            }
          },
          "required": ["query"]
        }
      }
    ],
    "total": 25,
    "categories": ["information", "calculation", "communication", "automation"]
  }
}
```

### 5.2 调用工具

**Endpoint:** `POST /api/v1/mcp/tools/:toolName/call`

**Path Parameters:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| toolName | string | ✅ | 工具名称 |

**Request Body:**
```json
{
  "arguments": {
    "query": "最新AI技术趋势",
    "limit": 5
  }
}
```

**Response Data:**
```json
{
  "success": true,
  "data": {
    "result": {
      "success": true,
      "data": [
        {
          "title": "GPT-5发布在即",
          "url": "https://example.com/article1",
          "snippet": "OpenAI即将发布新一代语言模型..."
        }
      ],
      "processingTime": 850
    },
    "metadata": {
      "toolName": "web-search",
      "executionTime": 850,
      "timestamp": "2026-05-02T02:00:00Z"
    }
  }
}
```

### 5.3 列出资源

**Endpoint:** `GET /api/v1/mcp/resources`

**Response Data:**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "uri": "resource://config/system-settings",
        "name": "系统配置",
        "description": "系统全局设置",
        "capabilities": ["read"],
        "mimeType": "application/json"
      },
      {
        "uri": "resource://knowledge/base-faq",
        "name": "FAQ知识库",
        "description": "常见问题知识库",
        "capabilities": ["read", "search"],
        "mimeType": "text/plain"
      }
    ]
  }
}
```

---

## 👥 六、Customers API 详细规范

### 6.1 客户列表（分页）

**Endpoint:** `GET /api/v1/customers`

**Query Parameters:**
| 参数 | 类型 | 必填 | 描述 | 示例 |
|-----|------|-----|------|-----|
| page | number | ❌ | 页码 (默认: 1) | `1` |
| pageSize | number | ❌ | 每页数量 (默认: 20, 最大: 100) | `20` |
| search | string | ❌ | 搜索关键词 | `"张三"` |
| status | string | ❌ | 状态过滤 | `"active"` |
| tags | string | ❌ | 标签过滤 (逗号分隔) | `"vip,priority"` |
| sortBy | string | ❌ | 排序字段 | `"updatedAt"` |
| sortOrder | string | ❌ | 排序方向 (`asc`/`desc`, 默认: `desc`) | `"desc"` |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cust_abc123",
        "name": "张三",
        "company": "某某科技有限公司",
        "email": "zhangsan@example.com",
        "phone": "+86 138****1234",
        "status": "active",
        "level": "vip",
        "tags": ["重要客户", "科技行业"],
        "lastContactAt": "2026-05-01T15:30:00Z",
        "createdAt": "2025-12-01T10:00:00Z",
        "updatedAt": "2026-05-01T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6.2 创建客户

**Endpoint:** `POST /api/v1/customers`

**Request Body:**
```json
{
  "name": "李四",
  "company": "ABC公司",
  "email": "lisi@example.com",
  "phone": "+86 139****5678",
  "tags": ["新客户", "潜在VIP"],
  "customFields": {
    "industry": "金融",
    "annualRevenue": "1000万+",
    "notes": "重点跟进对象"
  }
}
```

**Validation Rules:**
| 字段 | 规则 | 错误提示 |
|-----|------|---------|
| name | 必填, 2-100字符 | `姓名不能为空` |
| email | 可选, 有效邮箱格式 | `邮箱格式无效` |
| phone | 可选, 有效手机号 | `手机号格式无效` |
| tags | 可选, 最多10个标签 | `标签数量超过限制` |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "id": "cust_def456",
    "name": "李四",
    "company": "ABC公司",
    "email": "lisi@example.com",
    "status": "active",
    "tags": ["新客户", "潜在VIP"],
    "createdAt": "2026-05-02T02:00:00Z",
    "updatedAt": "2026-05-02T02:00:00Z"
  }
}
```

### 6.3 客户详情

**Endpoint:** `GET /api/v1/customers/:id`

**Path Parameters:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| id | string | ✅ | 客户ID |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "id": "cust_abc123",
    "profile": {
      "basicInfo": {
        "name": "张三",
        "company": "某某科技有限公司",
        "position": "技术总监",
        "email": "zhangsan@example.com",
        "phone": "+86 138****1234",
        "wechat": "zhangsan_wx",
        "address": "北京市朝阳区..."
      },
      "businessInfo": {
        "industry": "互联网/科技",
        "scale": "500-1000人",
        "annualRevenue": "5000万-1亿",
        "website": "https://example.com"
      },
      "preferences": {
        "contactMethod": "微信",
        "bestContactTime": "14:00-17:00",
        "language": "中文",
        "interests": ["AI技术", "云计算"]
      }
    },
    "statistics": {
      "totalInteractions": 45,
      "lastInteractionDate": "2026-05-01",
      "satisfactionScore": 4.8,
      "lifetimeValue": 125000
    },
    "timeline": [
      {
        "date": "2026-05-01",
        "type": "call",
        "summary": "产品演示通话",
        "agent": "sales-agent-001"
      },
      {
        "date": "2026-04-28",
        "type": "email",
        "summary": "发送报价单",
        "agent": "system"
      }
    ]
  }
}
```

---

## 📈 七、Analytics API 详细规范

### 7.1 仪表盘数据

**Endpoint:** `GET /api/v1/analytics/dashboard`

**Query Parameters:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| period | string | ❌ | 时间范围 (`today`/`week`/`month`/`quarter`/`year`, 默认: `week`) |
| metrics | string | ❌ | 指标列表 (逗号分隔) |

**Response Data:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCalls": 1234,
      "successfulCalls": 1156,
      "successRate": 93.68,
      "avgCallDuration": 185,
      "newCustomers": 23,
      "activeCustomers": 456
    },
    "trends": {
      "calls": [
        {"date": "2026-04-26", "value": 165},
        {"date": "2026-04-27", "value": 178},
        // ... 7天数据
      ],
      "satisfaction": [
        {"date": "2026-04-26", "value": 4.7},
        {"date": "2026-04-27", "value": 4.8},
        // ... 7天数据
      ]
    },
    "topAgents": [
      {"agentId": "agent-001", "calls": 89, "satisfaction": 4.9},
      {"agentId": "agent-002", "calls": 76, "satisfaction": 4.8}
    ],
    "alerts": [
      {
        "type": "warning",
        "message": "今日未接通率上升至12%",
        "severity": "medium"
      }
    ]
  }
}
```

### 7.2 自定义查询

**Endpoint:** `POST /api/v1/analytics/query`

**Request Body:**
```json
{
  "dataSource": "calls",
  "dimensions": ["date", "agentId", "outcome"],
  "measures": ["count", "avgDuration", "satisfactionScore"],
  "filters": {
    "dateRange": {
      "start": "2026-04-01",
      "end": "2026-04-30"
    },
    "outcome": ["completed", "no-answer"]
  },
  "sortBy": "count",
  "sortOrder": "desc",
  "limit": 50,
  "offset": 0
}
```

**Response Data:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "date": "2026-04-15",
        "agentId": "agent-001",
        "outcome": "completed",
        "count": 25,
        "avgDuration": 195,
        "satisfactionScore": 4.85
      }
    ],
    "total": 1200,
    "queryTime": 145
  }
}
```

---

## 🏢 八、Tenants API 详细规范

### 8.1 租户列表

**Endpoint:** `GET /api/v1/tenants`

**Response Data:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tenant_xyz",
        "name": "示例企业A",
        "plan": "enterprise",
        "status": "active",
        "usersCount": 45,
        "apiCallsThisMonth": 125000,
        "storageUsed": "2.3GB",
        "createdAt": "2025-06-15",
        "subscriptionEndsAt": "2026-06-15"
      }
    ],
    "pagination": {...}
  }
}
```

### 8.2 租户配置更新

**Endpoint:** `POST /api/v1/tenants/:id/config`

**Request Body:**
```json
{
  "settings": {
    "branding": {
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#1890ff",
      "companyName": "自定义公司名"
    },
    "features": {
      "aiChatEnabled": true,
      "voiceCallEnabled": true,
      "analyticsEnabled": true,
      "customIntegrations": ["crm-system", "erp-system"]
    },
    "limits": {
      "maxUsers": 100,
      "maxApiCallsPerMonth": 500000,
      "maxStorageGB": 50
    },
    "notifications": {
      "emailAlerts": true,
      "slackWebhook": "https://hooks.slack.com/...",
      "alertThresholds": {
        "errorRate": 5,
        "lowSatisfaction": 3.5
      }
    }
  }
}
```

---

## 🔌 九、WebSocket 实时通信 API

### 9.1 连接建立

**Endpoint:** `wss://api.yyc3-ai-call.com/api/ws`

**Connection Query Params:**
| 参数 | 类型 | 必填 | 描述 |
|-----|------|-----|------|
| token | string | ✅ | 认证令牌 |
| tenantId | string | ✅ | 租户ID |

**Example (JavaScript):**
```javascript
const ws = new WebSocket(
  'wss://api.yyc3-ai-call.com/api/ws' +
  '?token=YOUR_TOKEN&tenantId=TENANT_ID'
);

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // 订阅事件
  ws.send(JSON.stringify({
    action: 'subscribe',
    channels: ['task:updated', 'analytics:realtime']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### 9.2 支持的事件频道

| 频道 | 事件类型 | 描述 | 数据结构 |
|-----|---------|------|---------|
| `task:updated` | TaskStatusUpdate | 任务状态变更 | `{taskId, status, progress}` |
| `agent:status` | AgentStatusChange | Agent状态变化 | `{agentId, status, metrics}` |
| `message:new` | NewMessage | 新消息通知 | `{conversationId, message}` |
| `analytics:realtime` | RealtimeMetric | 实时指标推送 | `{metric, value, timestamp}` |
| `system:notification` | SystemNotification | 系统通知 | `{type, title, message, severity}` |

### 9.3 心跳机制

客户端需每30秒发送心跳：
```json
{"action": "ping"}
```

服务端响应：
```json
{"action": "pong", "timestamp": "..."}
```

---

## ⚙️ 十、速率限制与配额

### 10.1 全局限流规则

| 用户等级 | 请求/分钟 | 请求/小时 | 请求/天 |
|---------|----------|----------|--------|
| Free | 60 | 1000 | 10000 |
| Basic | 200 | 5000 | 50000 |
| Pro | 600 | 15000 | 150000 |
| Enterprise | 2000 | 50000 | 500000 |

### 10.2 特殊端点限流

| 端点路径 | 限制 | 窗口期 | 说明 |
|---------|------|--------|------|
| `/auth/*` | 10次/IP | 1分钟 | 防暴力破解 |
| `/multimodal/*` | 30次/用户 | 1分钟 | 资源密集型操作 |
| `/analytics/query` | 60次/用户 | 1分钟 | 复杂查询限制 |

### 10.3 响应头信息

每次API响应包含限流信息：
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 198
X-RateLimit-Reset: 1714630400
Retry-After: 60  # 仅在触发限流时返回
```

---

## 🧪 十一、SDK与集成示例

### 11.1 JavaScript/TypeScript SDK

```typescript
import { YYC3Client } from '@yyc3/sdk';

// 初始化客户端
const client = new YYC3Client({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.yyc3-ai-call.com/v1',
  timeout: 30000
});

// AI Family使用示例
async function example() {
  // 创建任务
  const task = await client.aiFamily.createTask({
    type: 'text-generation',
    input: {
      type: 'text',
      data: { content: '生成营销文案' }
    }
  });
  
  // 执行任务
  const result = await client.aiFamily.submitTask(task);
  console.log(result.data.content);
  
  // 协作模式
  const collabResult = await client.aiFamily.collaborate({
    mode: 'parallel',
    tasks: [
      { type: 'intent-recognition', input: {...} },
      { type: 'sentiment-analysis', input: {...} }
    ]
  });
}

// Multimodal使用示例
async function imageAnalysis() {
  const result = await client.multimodal.analyzeImage({
    file: fs.readFileSync('photo.jpg'),
    tasks: ['describe', 'ocr', 'classify']
  });
  
  result.forEach(r => {
    if (r.success) {
      console.log(`${r.task}:`, r.data);
    }
  });
}
```

### 11.2 Python SDK

```python
from yyc3_sdk import YYC3Client

client = YYC3Client(
    api_key='your-api-key',
    base_url='https://api.yyc3-ai-call.com/v1'
)

# 客户管理示例
customers = client.customers.list(
    search='张',
    status='active',
    page=1,
    page_size=20
)

for customer in customers.items:
    print(f"{customer.name} - {customer.company}")

# 创建客户
new_customer = client.customers.create(
    name='王五',
    email='wangwu@example.com',
    phone='+86 137****9012',
    tags=['新客户']
)
```

### 11.3 cURL命令示例

```bash
# 1. 获取Token
curl -X POST https://api.yyc3-ai-call.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"provider":"zhipu","apiKey":"YOUR_KEY"}'

# 2. 创建AI任务
curl -X POST https://api.yyc3-ai-call.com/v1/ai-family \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"create-task",
    "type":"text-generation",
    "input":{"type":"text","data":{"content":"Hello"}}
  }'

# 3. 图像分析
curl -X POST https://api.yyc3-ai-call.com/v1/multimodal/image/analyze \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@image.jpg" \
  -F 'tasks=["describe","ocr"]'

# 4. WebSocket连接
wscat -c "wss://api.yyc3-ai-call.com/api/ws?token=TOKEN&tenantId=TENANT"
```

---

## 📋 十二、最佳实践与注意事项

### 12.1 性能优化建议

✅ **推荐做法:**
- 使用连接池管理HTTP连接
- 实现客户端缓存减少重复请求
- 批量操作时控制并发数 (< 10)
- 大文件上传使用分片传输
- 设置合理的超时时间 (30-60s)

❌ **避免做法:**
- 避免轮询API获取状态（使用WebSocket）
- 避免在循环中同步调用API
- 避免传输过大的请求体 (> 1MB)
- 避免忽略错误重试机制

### 12.2 错误处理最佳实践

```typescript
try {
  const response = await client.aiFamily.submitTask(task);
  
  if (!response.success) {
    // 处理业务逻辑错误
    switch (response.error?.code) {
      case 'E0001':
        console.error('参数错误:', response.error.details);
        break;
      case 'E0006':
        // 自动等待后重试
        await sleep(parseInt(response.headers['retry-after']) * 1000);
        return retry();
      default:
        throw new Error(response.error.message);
    }
  }
  
  return response.data;
} catch (error) {
  // 处理网络错误和异常
  if (error instanceof NetworkError) {
    return retryWithBackoff();
  }
  throw error;
}
```

### 12.3 安全注意事项

- 🔑 **永远不要在前端代码中暴露API Key**
- 🔒 **始终使用HTTPS进行API调用**
- ⏰ **定期轮换API密钥**
- 📝 **记录所有API调用用于审计**
- 🛡️ **实现IP白名单限制（如需要）**

---

## 📞 十三、支持与反馈

- **API状态页**: https://status.yyc3-ai-call.com
- **开发者文档**: https://docs.yyc3-ai-call.com/api
- **技术支持**: support@yyc3-ai-call.com
- **问题反馈**: https://github.com/yyc3/issues

---

**文档结束** 🎉

*最后更新: 2026-05-02 | 下次审核: 2026-06-02*
