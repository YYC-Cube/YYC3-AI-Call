#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

content = """# YYC³ AI 智能外呼系统 - 智谱大模型集成分析与优先级实施方案

│ YanYuCloudCube 标语：言启象限 | 语枢未来 Words Initiate Quadrants, Language Serves as Core for the Future

--------

## 📋 文档信息

|| 属性 | 内容 | |------|------| | 文档标题 | YYC³ AI 智能外呼系统 - 智谱大模型集成分析与优先级实施方案 | |
文档版本 | v1.0.0 | | 创建时间 | 2026-01-22 | | 适用范围 | YYC³ AI Call 项目后端智能化改造 | | 涉及模型 |
ChatGLM3-6B, CodeGeeX4-ALL-9B, CogAgent, CogVideoX-5B |

--------

## 🔍 项目现状深度诊断

### 1. 现状概览

基于对  /Users/my/yyc3-ai-call/  项目的深度分析，当前项目具备以下特征：

 维度                               │ 现状                                 │ 评价
────────────────────────────────────┼──────────────────────────────────────┼────────────────────────────────────
 前端架构                           │ Next.js 15.2.4 + React 19 + Radix UI │ ✅ 优秀，现代化、响应式
 UI交互                             │ 完整的表单、卡片、图表展示           │ ✅ 完善，可视化程度高
 数据流                             │ 硬编码的 Mock 数据 (TypeScript)      │ ❌ 缺失，无真实业务逻辑
 AI能力                             │ 模拟的"智能"标签                     │ ❌ 假智能，无模型接入
 后端服务                           │ 仅有 Docker Compose 配置             │ ⚠️ 空白，需构建 API 层
 语音功能                           │ UI 按钮模拟                          │ ❌ 缺失，无 ASR/TTS

### 2. 核心痛点

│ 核心矛盾：项目拥有极佳的"皮囊"（前端界面），但缺少"灵魂"（AI 大模型驱动）。

1. 业务空转：所有外呼、客户画像、数据分析功能均为静态展示，无法产生实际业务价值。
2. 智能化滞后：虽有"智能外呼"之名，但无 NLP、意图识别、对话生成能力支撑。
3. 开发效率瓶颈：从 Mock 到真实后端需要编写大量 API、数据库逻辑，人力成本高。

--------

## 🤖 智谱大模型能力映射分析

基于授权书，YYC³ 拥有以下4个智谱大模型的使用权：

### 2.1 模型特性概览

 模型名称         │ 类型                │ 核心能力              │ 算力需求              │ 适用场景
──────────────────┼─────────────────────┼───────────────────────┼───────────────────────┼───────────────────────
 ChatGLM3-6B      │ 文本对话大模型      │ 多轮对话、意图识别、  │ 中等 (单张消费级 GPU  │ 智能外呼、客服问答、
                  │ (LLM)               │ 长文本理解、RAG       │ 可运行)               │ 业务分析
 CogAgent         │ 视觉语言智能体      │ 图像理解、GUI         │ 较高 (需较强显存)     │ 界面自动化、票据识别
                  │                     │ 交互、视觉推理、多模  │                       │ 、客户上传图片分析
                  │                     │ 态对话                │                       │
 CogVideoX-5B     │ 视频生成大模型      │ 文本生视频、长视频连  │ 高 (需多卡或多批次)   │ 营销视频生成、产品展
                  │                     │ 贯性                  │                       │ 示视频制作
 CodeGeeX4-ALL-9B │ 代码生成大模型      │ 跨语言代码生成、代码  │ 中等                  │ 内部开发提效、API
                  │                     │ 补全、Bug修复         │                       │ 自动生成、代码重构

### 2.2 模型与项目模块的深度映射

 项目模块                   │ 当前缺失能力               │ 对接模型               │ 预期效果
────────────────────────────┼────────────────────────────┼────────────────────────┼─────────────────────────────
 Smart Call (智能外呼)      │ 话术生成、意图识别、情感分 │ ChatGLM3-6B            │ 真正的智能对话，替代模拟数
                            │ 析                         │                        │ 据
 Customer 360 (客户画像)    │ 文档分析、图片信息提取     │ CogAgent + ChatGLM3-6B │ 自动分析客户上传的家具图片
                            │                            │                        │ 或文件
 Marketing Automation       │ 内容生产、创意生成         │ CogVideoX-5B           │ 自动生成产品宣传视频
 (营销自动化)               │                            │                        │
 Data Analytics (数据分析)  │ 趋势预测、自然语言查询     │ ChatGLM3-6B            │ "销售为什么下降？" ->
                            │                            │                        │ 生成自然语言分析报告
 Development (后端开发)     │ API 编写、数据库模型构建   │ CodeGeeX4-ALL-9B       │ 快速搭建后端
                            │                            │                        │ API，缩短开发周期 80%

--------

## 🎯 优先级实施方案 (Strategy P3)

基于项目从"0"到"1"的紧迫性，以及投入产出比（ROI），制定 P3 优先级模型：

 优先级 │ 模型             │ 实施阶段        │ 理由                                                  │ 预期耗时
────────┼──────────────────┼─────────────────┼───────────────────────────────────────────────────────┼──────────
 P0     │ ChatGLM3-6B      │ 第一阶段        │ 核心刚需。无此模型，"智能外呼"就是伪命题。必须优先解  │ 1-2周
        │                  │                 │ 决对话逻辑、意图识别和 RAG 知识库。                   │
 P1     │ CodeGeeX4-ALL-9B │ 第一阶段 (并行) │ 效率工具。利用该模型快速生成接入 ChatGLM3-6B          │ 持续使用
        │                  │                 │ 所需的后端代码、API 接口。                            │
 P2     │ CogAgent         │ 第二阶段        │ 差异化亮点。实现多模态能力（如让客户上传家具照片进行  │ 2-3周
        │                  │                 │ 匹配），提升产品竞争力。                              │
 P3     │ CogVideoX-5B     │ 第三阶段        │ 增值服务。用于营销模块自动生成视频，非核心功能，可延  │ 1-2周
        │                  │                 │ 后。                                                  │

--------

## 🚀 第一阶段：核心大脑搭建 (P0 + P1)

### 目标：让系统"活"起来，实现真实对话。

### 3.1 技术架构选型

#### 推荐方案：FastAPI + vLLM + LangChain

  # 技术栈说明
  推理框架: vLLM (高性能 LLM 推理加速)
  后端框架: FastAPI (Python，生态丰富)
  编排框架: LangChain (RAG 流程编排)
  向量库: Qdrant (内存存储，轻量)
  前端调用: Next.js API Routes -> Python Service

#### 模型服务部署

  # 使用 vLLM 启动 ChatGLM3-6B
  # 需要显存: ~12GB (FP16) / ~8GB (Int4)
  docker run --gpus all --shm-size=10g -p 8000:8000 \\
      vllm/vllm-openai:v0.2.7.post1 \\
      --model THUDM/chatglm3-6b \\
      --trust-remote-code \\
      --max-model-len 8192 \\
      --gpu-memory-utilization 0.9

### 3.2 核心功能实现 (基于 ChatGLM3-6B)

#### 功能 A：智能外呼对话流

  // 文件路径: /Users/my/yyc3-ai-call/app/api/chat/route.ts

  /**
   * @fileoverview 智能外呼对话接口
   * @description 对接 ChatGLM3-6B 模型
   */

  import { NextRequest, NextResponse } from 'next/server';

  export async function POST(req: NextRequest) {
    const { message, conversationHistory, customerContext } = await req.json();

    // 1. 构建 Prompt (RAG 增强)
    const systemPrompt = \`
    你是 YYC³ 智能外呼助手，专精于家具销售和客户服务。
    当前客户信息：\${JSON.stringify(customerContext)}

    说话风格：
    1. 专业、热情、亲切
    2. 避免推销感，以咨询顾问口吻
    3. 善于引导客户表达需求

    如果客户表现出购买意向，请主动引导预约到店。
    \`;

    // 2. 调用本地 LLM 服务 (Python 后端)
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'chatglm3-6b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        top_p: 0.9,
      }),
    });

    const data = await response.json();

    // 3. 返回结果
    return NextResponse.json({
      reply: data.choices[0].message.content,
      model: 'chatglm3-6b',
      usage: data.usage,
    });
  }

#### 功能 B：意图识别与情感分析

在接收到用户语音转文字后，利用 ChatGLM3-6B 进行结构化提取：

  # Python 后端逻辑
  def analyze_intent(text: str):
      prompt = f"""
      分析以下客户说话的意图和情感，返回 JSON 格式。
      客户说的话："{text}"

      输出格式：
      {{
          "intent": "product_inquiry | price_negotiation | complaint | booking_interest | other",
          "sentiment": "positive | neutral | negative",
          "key_entities": ["沙发", "真皮", "价格"],
          "urgency": "high | medium | low"
      }}
      """

      # 调用模型
      response = call_model(prompt)
      return json.loads(response)

### 3.3 利用 CodeGeeX4-ALL-9B 加速开发

策略：使用 CodeGeeX4-ALL-9B（在 VS Code 中安装 CodeGeeX 插件）来生成上述 Python 后端代码。

具体操作：

1. Prompt: "使用 FastAPI 创建一个标准的 API 接口，接收音频文件，调用 Whisper 模型进行 ASR 识别，并返回文本。"
2. Prompt: "使用 SQLAlchemy 创建 Customer 模型，包含 name, phone, last_call_time, conversion_status 字段。"
3. Prompt: "为 ChatGLM3-6B 模型创建一个 RAG 检索类的 Python 代码，支持向量检索。"

效果评估：预计可节省 60%-70% 的后端代码编写时间。

--------

## 👁️ 第二阶段：多模态智能化升级 (P2)

### 目标：引入视觉能力，打造行业差异化。

### 4.1 CogAgent 集成方案

#### 场景一：智能表单与文档分析

在  IntelligentForms  (智能表单) 模块中，集成 CogAgent 能力。

• 用户行为：客户上传户型图或家具草图。
• 模型作用：CogAgent 理解图片内容，识别房间布局、家具风格偏好。
• 前端交互：
  // 调用 CogAgent 接口
  const analysis = await fetch('/api/vision/analyze', {
    method: 'POST',
    body: formData, // 包含图片
  });
  // 返回：{ style: "北欧风", layout: "三室两厅", suggestions: [...] }


#### 场景二：界面自动化测试 (GUI Agent)

利用 CogAgent 原生的 GUI 理解能力：

• 应用：自动测试前端页面流程。CogAgent 可以"看"到页面元素并自动点击、输入，进行端到端测试。
• 价值：替代 Playwright 中的选择器维护，更直观。

### 4.2 技术难点与解决方案

 难点                                               │ 解决方案
────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────
 模型体积大 (显存占用高)                            │ 使用 vLLM 的 int4 量化版本，或使用离线 API (需考虑合规性)
 图片解析延迟                                       │ 实现图片压缩和预处理，限制分辨率在 1024x1024 以内
 准确率                                             │ 针对家具、户型图特定领域数据进行微调 (Fine-tuning)

--------

## 🎬 第三阶段：营销内容自动化 (P3)

### 目标：赋能营销模块，实现低成本视频生产。

### 5.1 CogVideoX-5B 集成架构

  ┌─────────────┐
  │ Marketing   │
  │ Dashboard   │ (用户输入: "现代简约沙发促销视频")
  └──────┬──────┘
         │
         ↓
  ┌──────────────────────────┐
  │ Python Service          │
  │ (CogVideoX Controller) │
  └──────┬─────────────────┘
         │
         ↓ (Text-to-Video)
  ┌──────────────────────────┐
  │ CogVideoX-5B Model     │
  │ (GPU Cluster)          │
  └──────┬─────────────────┘
         │
         ↓ (Generated MP4)
  ┌──────────────────────────┐
  │ MinIO / S3 Storage     │
  └──────┬─────────────────┘
         │
         ↓
  ┌──────────────────────────┐
  │ Frontend Display        │
  │ (Video Player)         │
  └─────────────────────────┘

### 5.2 实施细节

• 触发方式：在  MarketingAutomation  组件中，点击"生成视频"按钮。
• 异步处理：视频生成是耗时操作（通常需要几分钟），必须使用 Celery 或 Redis Queue 进行异步任务处理。
• 进度反馈：通过 WebSocket 向前端推送生成进度 (10% -> 50% -> 100%)。

--------

## 📊 集成效果对比预测

 维度                     │ 现状 (未集成)            │ 目标 (全集成)                  │ 提升点
──────────────────────────┼──────────────────────────┼────────────────────────────────┼─────────────────────────
 对话能力                 │ 假 Mock 数据             │ 基于 ChatGLM3 的真实理解与生成 │ ⭐⭐⭐⭐⭐
 开发效率                 │ 手写 CRUD                │ CodeGeeX4 辅助生成代码         │ ⭐⭐⭐⭐
 交互维度                 │ 纯文本                   │ 文本 + 图片                    │ ⭐⭐⭐⭐⭐
 营销能力                 │ 仅文本内容               │ 自动生成视频                   │ ⭐⭐⭐⭐
 算力成本                 │ 0 (本地无计算)           │ 中高 (需 GPU 服务器)           │ ⚠️ 需考虑成本

--------

## 💰 硬件与成本评估 (Hardware & Cost)

### 6.1 推荐服务器配置

 模型                     │ 显存需求                 │ 推荐显卡                       │ 推理速度 (Tokens/s)
──────────────────────────┼──────────────────────────┼────────────────────────────────┼─────────────────────────
 ChatGLM3-6B (Int4)       │ ~8GB                     │ NVIDIA RTX 3060/4060 Ti        │ ~60
 ChatGLM3-6B (FP16)       │ ~12GB                    │ NVIDIA RTX 4070 Ti             │ ~45
 CodeGeeX4-ALL-9B         │ ~16GB                    │ NVIDIA RTX 4080/4090           │ ~30
 CogAgent (9B)            │ ~20GB                    │ NVIDIA RTX 4090 / A10G         │ ~20
 CogVideoX-5B             │ ~24GB                    │ NVIDIA A100 (40GB) 或双卡 4090 │ ~1 帧/秒 (生成)

### 6.2 阶段性采购建议

• 第一阶段 (P0)：租赁 1 张 RTX 4080/4090 (云服务器或本地)，足以运行 ChatGLM3-6B 和 CodeGeeX4。
• 第二阶段 (P2)：扩容显存至 20GB 以上，或采用显存共享技术 (如 Ray) 运行 CogAgent。
• 第三阶段 (P3)：按需使用 A100 实例进行视频生成（视频生成非实时，可使用竞价实例降低成本）。

--------

## ✅ 实施检查清单

### 第一阶段：ChatGLM3-6B + CodeGeeX4 (当前重点)

[ ] 环境搭建
  [ ] 搭建 Python 3.10+ 环境
  [ ] 安装 vLLM, FastAPI, LangChain
  [ ] 部署 ChatGLM3-6B 模型服务 (端口 8000)
[ ] 后端开发 (利用 CodeGeeX4 辅助)
  [ ] 实现对话接口  /v1/chat/completions
  [ ] 实现意图识别接口  /api/v1/intent
  [ ] 实现向量存储与检索 (RAG)
[ ] 前端对接
  [ ]  smart-call-system.tsx  替换 Mock 数据为真实 API 调用
  [ ] 实现流式输出 (SSE) 展示打字机效果
  [ ] 接入真实 TTS (可先用 Edge-TTS 代替 CogAudio)


### 第二阶段：CogAgent (未来规划)

[ ] 搭建 CogAgent 模型服务
[ ] 实现图片上传与分析接口
[ ]  customer-profile-360.tsx  增加图片识别卡片

### 第三阶段：CogVideoX (未来规划)

[ ] 搭建视频生成异步队列 (Celery + Redis)
[ ]  marketing-automation.tsx  增加视频生成功能

--------

## 🎯 总结

基于 YYC³ AI Call 项目的现状，ChatGLM3-6B 是决定项目生死的 P0 核心模型，必须优先实施。CodeGeeX4-ALL-9B
虽不直接服务于终端用户，但能作为生产力工具，极大地缩短 ChatGLM3 的接入周期，建议
立即配置给开发团队使用。随着核心功能的稳固，再逐步引入 CogAgent 和 CogVideoX-5B 实现差异化竞争。

--------

「YanYuCloudCube」 
「admin@0379.email mailto:admin@0379.email」 
「Words Initiate Quadrants, Language Serves as Core for the Future」