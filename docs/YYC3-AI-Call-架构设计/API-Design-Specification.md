# YYC³ Enterprise Solution - API Design Specification

## 📋 Overview

This document defines the RESTful API architecture for the YYC³ Enterprise Solution, providing comprehensive endpoints for all five business dimensions (Jing, Guan, Yun, Wei, Xiao) and the AI capability layer.

## 🔐 Authentication & Authorization

### Base URL
```
Production: https://api.yyc3-ai-call.com/v1
Staging: https://staging-api.yyc3-ai-call.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication Headers
```http
Authorization: Bearer <JWT_TOKEN>
X-API-Key: <API_KEY>
X-Organization-ID: <ORG_ID>
X-Tenant-ID: <TENANT_ID>
Content-Type: application/json
Accept: application/json
```

## 📊 Jing Module - Strategic Management APIs

### Intelligent Business Cockpit

#### Get Dashboard Metrics
```http
GET /jing/cockpit/metrics
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by metric category (revenue, operations, hr, etc.) |
| time_range | string | No | Time range (7d, 30d, 90d, 1y) |
| department | string | No | Filter by department |
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Items per page (default: 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric_001",
      "name": "Monthly Revenue",
      "category": "financial",
      "unit": "CNY",
      "value": 1250000,
      "previousValue": 1180000,
      "changePercentage": 5.93,
      "changeDirection": "up",
      "target": 1200000,
      "achievementRate": 104.17,
      "trend": [
        { "date": "2026-01", "value": 1100000 },
        { "date": "2026-02", "value": 1180000 },
        { "date": "2026-03", "value": 1250000 }
      ],
      "confidence": 0.95
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

#### Natural Language Query
```http
POST /jing/cockpit/query
```

**Request Body:**
```json
{
  "question": "Show me the revenue trend for the last quarter and compare with previous quarter",
  "context": {
    "department": "sales",
    "time_range": "quarter"
  },
  "language": "zh-CN",
  "user_id": "user_123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "answer": {
      "type": "data_response",
      "content": "Based on the analysis of Q1 2026 data...",
      "data": {
        "current_quarter_revenue": 3750000,
        "previous_quarter_revenue": 3500000,
        "growth_rate": 7.14,
        "chart_data": [...]
      },
      "summary": "Revenue increased by 7.14% compared to previous quarter",
      "is_complete": true
    },
    "insights": [
      {
        "type": "trend_insight",
        "title": "Strong Growth Pattern",
        "description": "Consistent month-over-month growth observed",
        "confidence": 0.92
      }
    ],
    "recommendations": [
      {
        "action": "Consider increasing Q2 targets by 8%",
        "priority": "high",
        "expected_impact": "+5% revenue growth"
      }
    ],
    "visualization": {
      "type": "line_chart",
      "config": {...}
    },
    "confidence": 0.91,
    "processing_time": 1245
  }
}
```

#### Generate Executive Report
```http
POST /jing/cockpit/reports
```

**Request Body:**
```json
{
  "report_type": "monthly_executive",
  "period": {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30"
  },
  "include_sections": ["financial", "operations", "hr", "risk"],
  "format": "pdf",
  "language": "zh-CN"
}
```

## ✅ Guan Module - Management APIs

### Smart Approval Engine

#### Create Approval Request
```http
POST /guan/approvals
```

**Request Body:**
```json
{
  "type": "expense_reimbursement",
  "title": "Q2 Marketing Campaign Expenses",
  "description": "Reimbursement for Q2 marketing materials and advertising costs",
  "submitter_id": "emp_001",
  "submitter_name": "Zhang Wei",
  "department": "marketing",
  "position": "Marketing Manager",
  "organization_id": "org_001",
  "amount": 25000.00,
  "currency": "CNY",
  "priority": "normal",
  "urgency": "standard",
  "attachments": [
    {
      "name": "invoice_001.pdf",
      "type": "invoice",
      "url": "/files/invoice_001.pdf"
    },
    {
      "name": "receipt_001.jpg",
      "type": "receipt",
      "url": "/files/receipt_001.jpg"
    }
  ],
  "form_data": [
    {
      "id": "expense_category",
      "name": "Category",
      "label": "Expense Category",
      "type": "select",
      "value": "marketing_materials",
      "required": true
    },
    {
      "id": "cost_center",
      "name": "Cost Center",
      "label": "Cost Center Code",
      "type": "text",
      "value": "CC-MKT-001",
      "required": true
    }
  ],
  "auto_submit": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "apr_001",
    "request_number": "EXP-20260502-ABCD",
    "type": "expense_reimbursement",
    "status": "pending_review",
    "current_step": 1,
    "total_steps": 3,
    "current_approvers": ["mgr_001"],
    "route": {
      "id": "route_expense_standard",
      "name": "Standard Expense Approval Flow",
      "steps_count": 3
    },
    "sla_status": {
      "first_response_target": "24 hours",
      "resolution_target": "72 hours"
    },
    "created_at": "2026-05-02T10:30:00Z",
    "submitted_at": "2026-05-02T10:30:01Z"
  }
}
```

#### Approve Request
```http
POST /guan/approvals/{requestId}/approve
```

**Request Body:**
```json
{
  "approver_id": "mgr_001",
  "comment": "Approved. All expenses are within budget allocation.",
  "attachments": []
}
```

#### Reject Request
```http
POST /guan/approvals/{requestId}/reject
```

**Request Body:**
```json
{
  "rejecter_id": "mgr_001",
  "reason": "Invoice amount exceeds approved budget limit of ¥20,000",
  "attachments": []
}
```

#### Voice Approval
```http
POST /guan/approvals/{requestId}/voice-approval
```

**Request Body:**
```json
{
  "audio_file": "<base64_encoded_audio>",
  "audio_format": "wav",
  "language": "zh-CN",
  "user_id": "mgr_001"
}
```

#### Get My Approvals
```http
GET /guan/approvals/my-pending
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter status (pending, approved, rejected) |
| type | string | No | Filter by approval type |
| priority | string | No | Filter by priority |
| sort_by | string | No | Sort field (created_at, urgency) |
| order | string | No | Sort direction (asc, desc) |

## 💬 Xiao Module - Customer Service APIs

### Omni-Channel Customer Service

#### Create Conversation
```http
POST /xiao/conversations
```

**Request Body:**
```json
{
  "customer": {
    "name": "Li Ming",
    "email": "liming@example.com",
    "phone": "+8613800138000",
    "preferred_channel": "web_chat",
    "language": "zh-CN"
  },
  "channel_type": "web_chat",
  "channel_id": "web_001",
  "subject": "Product inquiry about Enterprise Plan",
  "priority": "normal",
  "tags": ["product_inquiry", "enterprise"],
  "initial_message": {
    "direction": "inbound",
    "type": "text",
    "sender_id": "cust_001",
    "sender_name": "Li Ming",
    "sender_type": "customer",
    "content": {
      "text": "Hi, I'm interested in your Enterprise Plan. Can you tell me more about the features and pricing?"
    },
    "metadata": {
      "source_channel": "web_chat",
      "session": {
        "session_id": "sess_001",
        "page_url": "https://yyc3-ai-call.com/pricing",
        "user_agent": "Mozilla/5.0..."
      },
      "utm": {
        "source": "google",
        "medium": "organic",
        "campaign": "brand"
      }
    }
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "conv_001",
    "conversation_number": "CONV-20260502-EFGH",
    "channel_type": "web_chat",
    "status": "active",
    "customer_info": {
      "id": "cust_001",
      "name": "Li Ming",
      "vip_level": "regular",
      "customer_segment": "new"
    },
    "assigned_agent": null,
    "queue": "general_queue",
    "sla_settings": {
      "first_response_target": "5 minutes",
      "resolution_target": "24 hours"
    },
    "ai_analysis": {
      "intent": "product_inquiry",
      "confidence": 0.92,
      "sentiment": {
        "overall": 7.2,
        "label": "positive"
      },
      "suggested_category": "sales_inquiry"
    },
    "created_at": "2026-05-02T10:35:00Z"
  }
}
```

#### Send Message
```http
POST /xiao/conversations/{conversationId}/messages
```

**Request Body:**
```json
{
  "direction": "outbound",
  "type": "text",
  "sender_id": "agent_001",
  "sender_name": "Sarah Chen",
  "sender_type": "agent",
  "content": {
    "text": "Hello Li Ming! Thank you for your interest in our Enterprise Plan. I'd be happy to provide you with detailed information about our features and pricing options."
  },
  "reply_to_message_id": "msg_001"
}
```

#### AI Response Suggestion
```http
POST /xiao/conversations/{conversationId}/ai-suggest
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "response_id": "resp_001",
    "content": "Based on your interest in our Enterprise Plan, here are the key features that would benefit your organization:\n\n1. **Advanced Analytics Dashboard** - Real-time insights into your business metrics\n2. **Custom AI Models** - Tailored AI solutions for your specific needs\n3. **Priority Support** - 24/7 dedicated support team\n4. **Unlimited Users** - Scale without additional per-user costs\n\nWould you like me to schedule a personalized demo with our solutions architect?",
    "tone": "professional_friendly",
    "confidence": 0.89,
    "sources": [
      {
        "type": "knowledge_base",
        "title": "Enterprise Plan Features Guide",
        "relevance": 0.94
      }
    ],
    "suggestions": [
      "Focus on ROI benefits",
      "Include customer testimonials",
      "Offer demo scheduling"
    ],
    "processing_time": 342
  }
}
```

#### Customer Sentiment Analysis
```http
GET /xiao/customers/{customerId}/sentiment-analysis
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string | Yes | Analysis start date (ISO 8601) |
| end_date | string | Yes | Analysis end date (ISO 8601) |
| include_predictions | boolean | No | Include sentiment predictions (default: false) |

## 🤖 AI Capability Layer APIs

### NLP Services

#### Detect Intent
```http
POST /ai/nlp/intent
```

**Request Body:**
```json
{
  "text": "I want to cancel my subscription and get a refund",
  "language": "en",
  "context": {
    "previous_intents": ["product_inquiry"],
    "conversation_phase": "objection_handling"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "primary_intent": {
      "intent": "cancellation_request",
      "confidence": 0.94,
      "slots": [
        {
          "name": "action",
          "value": "cancel",
          "entity_type": "action",
          "confidence": 0.98
        },
        {
          "name": "follow_up_action",
          "value": "refund",
          "entity_type": "action",
          "confidence": 0.91
        }
      ]
    },
    "alternative_intents": [
      {
        "intent": "account_issue",
        "confidence": 0.15
      },
      {
        "intent": "billing_inquiry",
        "confidence": 0.08
      }
    ],
    "processing_time": 156
  }
}
```

### ASR Services

#### Transcribe Audio
```http
POST /ai/asr/transcribe
```

**Request Body (multipart/form-data):**
```
audio_file: <audio file>
language: zh-CN
enable_diarization: true
enable_punctuation: true
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transcription_id": "trans_001",
    "text": "你好，我想咨询一下企业版的价格方案。我们公司大概有50个人需要使用。",
    "language": "zh-CN",
    "confidence": 0.96,
    "word_error_rate": 0.04,
    "speakers": [
      {
        "speaker_id": "speaker_1",
        "segments": [
          {
            "start_time": 0.0,
            "end_time": 3.2,
            "text": "你好，我想咨询一下企业版的价格方案。"
          },
          {
            "start_time": 3.5,
            "end_time": 6.8,
            "text": "我们公司大概有50个人需要使用。"
          }
        ]
      }
    ],
    "duration": 6.8,
    "processing_time": 1234
  }
}
```

### TTS Services

#### Synthesize Speech
```http
POST /ai/tts/synthesize
```

**Request Body:**
```json
{
  "text": "您的审批请求已成功提交，预计将在24小时内得到处理。",
  "voice_id": "zh-CN-XiaoxiaoNeural",
  "language": "zh-CN",
  "style": "professional",
  "sample_rate": 24000,
  "format": "mp3",
  "enable_emotion": true,
  "emotion": "neutral"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "audio_id": "audio_001",
    "audio_url": "/api/v1/ai/tts/audio/audio_001.mp3",
    "duration": 4.2,
    "file_size": 67890,
    "format": "mp3",
    "sample_rate": 24000,
    "voice_used": "zh-CN-XiaoxiaoNeural",
    "processing_time": 567
  }
}
```

### Knowledge Graph Services

#### Query Knowledge Graph
```http
POST /ai/knowledge-graph/query
```

**Request Body:**
```json
{
  "query": "What are the approval requirements for expenses over 50,000 CNY?",
  "query_type": "natural_language",
  "context": {
    "department": "finance",
    "role": "employee"
  },
  "max_results": 10
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query_id": "kgq_001",
    "results": [
      {
        "entity": {
          "type": "policy",
          "name": "High-Value Expense Approval Policy",
          "id": "policy_003"
        },
        "answer": "Expenses exceeding 50,000 CNY require three-level approval: 1) Department Manager approval within 24 hours, 2) Finance Director review within 48 hours, 3) CEO final approval for amounts over 100,000 CNY.",
        "confidence": 0.97,
        "sources": [
          {
            "document_id": "doc_001",
            "title": "Corporate Expense Policy v2.1",
            "relevance": 0.95,
            "excerpt": "..."
          }
        ],
        "related_entities": [
          {
            "type": "person",
            "name": "Finance Director",
            "relationship": "approver_for"
          },
          {
            "type": "threshold",
            "name": "50,000 CNY limit",
            "relationship": "triggers_approval"
          }
        ]
      }
    ],
    "query_translated_to_sparql": "...",
    "execution_time": 234
  }
}
```

## 📈 Common Patterns & Conventions

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-05-02T10:30:00Z",
    "processing_time": 145
  },
  "pagination": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ],
    "documentation_url": "https://docs.yyc3-ai-call.com/errors/VALIDATION_ERROR"
  },
  "meta": {
    "request_id": "req_def456",
    "timestamp": "2026-05-02T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Invalid or missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### Pagination

All list endpoints support pagination:
```http
GET /resource?page=1&per_page=20&sort_by=created_at&order=desc
```

**Response:**
```json
{
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

### Filtering & Search

**Field Filtering:**
```http
GET /resource?status=active&priority=high&type=expense
```

**Full-text Search:**
```http
GET /resource/search?q=revenue+growth&fields=title,description
```

**Date Range Filtering:**
```http
GET /resource?created_after=2026-04-01&created_before=2026-05-01
```

### Webhooks & Callbacks

**Register Webhook:**
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": [
    "approval.completed",
    "conversation.created",
    "message.received"
  ],
  "secret": "your_webhook_secret",
  "active": true
}
```

**Webhook Payload Example:**
```json
{
  "event": "approval.completed",
  "timestamp": "2026-05-02T11:00:00Z",
  "data": {
    "request_id": "apr_001",
    "status": "approved",
    "completed_by": "mgr_001"
  },
  "signature": "sha256=abc123..."
}
```

## 🔒 Rate Limiting

| Tier | Requests/Minute | Burst | Features |
|------|-----------------|-------|----------|
| Free | 60 | 100 | Basic access |
| Professional | 600 | 1000 | Advanced features |
| Enterprise | 6000 | 10000 | Full access + priority |
| Custom | Unlimited | Unlimited | SLA guaranteed |

Rate limit headers:
```http
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1620000000
Retry-After: 60
```

## 📚 SDK & Client Libraries

Official SDKs available for:
- TypeScript/JavaScript (`@yyc3/sdk`)
- Python (`yyc3-sdk`)
- Java (`com.yyc3:sdk`)
- Go (`github.com/yyc3/sdk`)

**Example Usage (TypeScript):**
```typescript
import { YYC3Client } from '@yyc3/sdk';

const client = new YYC3Client({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.yyc3-ai-call.com/v1'
});

const cockpit = client.jing.cockpit;
const metrics = await cockpit.getMetrics({
  category: 'financial',
  timeRange: '30d'
});
```

## 🧪 Testing Endpoints

Sandbox environment for testing:
```
Base URL: https://sandbox-api.yyc3-ai-call.com/v1
Test API Key: test_your_test_key_here
```

Special test headers:
```http
X-Test-Mode: simulation
X-Mock-Response: approval_created
X-Delay: 2000
```
