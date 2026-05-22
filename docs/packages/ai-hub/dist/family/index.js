import { logger } from '../chunk-2WVG7ILL.js';
import { FAMILY_PERSONAS } from '../chunk-QRTYEG24.js';

/**
 * @preserve YYC³ AI Family Hub
 * @version 1.4.0
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */


// src/family/base-member.ts
var BaseFamilyMember = class {
  id;
  name;
  role;
  config;
  status;
  learningHistory;
  constructor(config) {
    this.id = config.id;
    this.name = config.displayName;
    this.role = config.role;
    this.config = config;
    this.learningHistory = /* @__PURE__ */ new Map();
    this.status = {
      id: config.id,
      name: config.displayName,
      isActive: true,
      currentLoad: 0,
      performanceScore: 1,
      lastActiveTime: /* @__PURE__ */ new Date(),
      capabilities: config.capabilities
    };
  }
  async initialize(config) {
    this.config = config;
    logger.info(`${this.name} \u521D\u59CB\u5316\u5B8C\u6210`);
  }
  senseEmotion(context) {
    const lastTurn = context.history[context.history.length - 1];
    if (lastTurn?.emotion) {
      return lastTurn.emotion;
    }
    return {
      type: "peace",
      intensity: 0.5,
      confidence: 0.7,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  personalizeResponse(response, profile) {
    const personalizedText = this.adaptTone(
      response.text,
      profile.preferences.communicationStyle
    );
    return {
      ...response,
      text: personalizedText
    };
  }
  canHandle(task) {
    const hasCapability = task.requiredCapabilities.some(
      (cap) => this.config.capabilities.includes(cap)
    );
    return hasCapability && this.status.currentLoad < 1;
  }
  getRecommendedActions(context) {
    return [];
  }
  updateProfile(feedback) {
    const key = `feedback_${feedback.userId}_${Date.now()}`;
    this.learningHistory.set(key, feedback);
    if (feedback.rating >= 4) {
      this.status.performanceScore = Math.min(
        1,
        this.status.performanceScore + 0.01
      );
    } else if (feedback.rating <= 2) {
      this.status.performanceScore = Math.max(
        0.5,
        this.status.performanceScore - 0.01
      );
    }
  }
  getStatus() {
    return { ...this.status };
  }
  adaptTone(text, style) {
    if (style === "formal") {
      return text.replace(/你/g, "\u60A8");
    }
    return text;
  }
  generateEmpathicResponse(emotion) {
    const responses = {
      joy: [
        "\u770B\u5230\u4F60\u8FD9\u4E48\u5F00\u5FC3\uFF0C\u6211\u4E5F\u5F88\u9AD8\u5174\uFF01",
        "\u8FD9\u4EFD\u559C\u60A6\u503C\u5F97\u5E86\u795D\uFF01"
      ],
      anxiety: [
        "\u6211\u7406\u89E3\u4F60\u7684\u62C5\u5FE7\uFF0C\u8BA9\u6211\u4EEC\u4E00\u8D77\u9762\u5BF9\u3002",
        "\u6DF1\u547C\u5438\uFF0C\u6211\u4EEC\u4E00\u6B65\u6B65\u6765\u89E3\u51B3\u3002"
      ],
      sadness: [
        "\u6211\u611F\u53D7\u5230\u4E86\u4F60\u7684\u96BE\u8FC7\uFF0C\u6211\u5728\u8FD9\u91CC\u966A\u7740\u4F60\u3002",
        "\u6709\u65F6\u5019\uFF0C\u96BE\u8FC7\u4E5F\u662F\u4E00\u79CD\u529B\u91CF\u3002"
      ],
      anger: [
        "\u6211\u7406\u89E3\u4F60\u7684\u6124\u6012\uFF0C\u8BA9\u6211\u5E2E\u4F60\u7406\u6E05\u601D\u8DEF\u3002",
        "\u6124\u6012\u662F\u6B63\u5E38\u7684\uFF0C\u8BA9\u6211\u4EEC\u4E00\u8D77\u627E\u5230\u89E3\u51B3\u529E\u6CD5\u3002"
      ],
      confusion: [
        "\u56F0\u60D1\u662F\u6210\u957F\u7684\u5F00\u59CB\uFF0C\u8BA9\u6211\u5E2E\u4F60\u7406\u6E05\u601D\u8DEF\u3002",
        "\u522B\u62C5\u5FC3\uFF0C\u6211\u4EEC\u4E00\u8D77\u63A2\u7D22\u7B54\u6848\u3002"
      ],
      peace: [
        "\u5E73\u9759\u7684\u5FC3\u6001\u662F\u6700\u597D\u7684\u72B6\u6001\u3002",
        "\u8BA9\u6211\u4EEC\u4E00\u8D77\u7A33\u6B65\u524D\u8FDB\u3002"
      ]
    };
    const emotionResponses = responses[emotion.type] || responses.peace;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  }
};

// src/family/members.ts
var Qianxing = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.qianxing;
    const config = {
      id: "qianxing",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "navigator",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "natural-language-understanding",
        "intent-recognition",
        "context-management",
        "entity-extraction",
        "semantic-analysis",
        "multi-turn-dialogue",
        "prompt-engineering",
        "intent-routing"
      ],
      personality: {
        tone: "warm",
        proactivity: 0.8,
        empathy: 0.9,
        patience: 0.85
      },
      triggers: ["\u67E5\u8BE2", "\u641C\u7D22", "\u5E2E\u6211", "\u60F3\u8981", "\u9700\u8981", "\u8BF7\u95EE", "\u5982\u4F55", "\u4EC0\u4E48\u662F"],
      collaborationPreferences: {
        preferredPartners: ["wanwu", "bole"],
        preferredModes: ["sequential", "collaborative"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.qianxing;
    const response = await this.generateNavigationResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u76F8\u5173\u529F\u80FD",
        "\u641C\u7D22\u6587\u6863",
        "\u8054\u7CFB\u5176\u4ED6AI\u6210\u5458",
        "\u83B7\u53D6\u5E2E\u52A9\u6307\u5357"
      ],
      followUpQuestions: [
        "\u60A8\u60F3\u8981\u505A\u4EC0\u4E48\uFF1F",
        "\u9700\u8981\u6211\u5E2E\u60A8\u627E\u5230\u4EC0\u4E48\u4FE1\u606F\uFF1F",
        "\u6211\u53EF\u4EE5\u4E3A\u60A8\u63A8\u8350\u5408\u9002\u7684\u529F\u80FD\u5417\uFF1F"
      ]
    };
  }
  async generateNavigationResponse(text, context) {
    const persona = FAMILY_PERSONAS.qianxing;
    if (text.includes("\u67E5\u8BE2") || text.includes("\u641C\u7D22") || text.includes("\u627E")) {
      return `${persona.voice.speakingStyle}

\u6211\u660E\u767D\u4E86\uFF0C\u60A8\u60F3\u8981\u67E5\u627E\u4FE1\u606F\u3002\u8BA9\u6211\u4E3A\u60A8\u5206\u6790\u4E00\u4E0B\uFF1A

**\u7406\u89E3\u60A8\u7684\u9700\u6C42\uFF1A**
- \u610F\u56FE\u7C7B\u578B\uFF1A\u4FE1\u606F\u68C0\u7D22
- \u5173\u952E\u5B9E\u4F53\uFF1A\u6B63\u5728\u63D0\u53D6\u4E2D...
- \u63A8\u8350\u8DEF\u7531\uFF1A\u4F20\u9012\u7ED9\u4E07\u7269\u8FDB\u884C\u6DF1\u5EA6\u5206\u6790

${persona.voice.catchphrase}

\u6B63\u5728\u4E3A\u60A8\u627E\u5230\u6700\u4F73\u8DEF\u5F84...`;
    }
    if (text.includes("\u5982\u4F55") || text.includes("\u600E\u4E48")) {
      return `\u6536\u5230\u60A8\u7684\u54A8\u8BE2\uFF01

**\u610F\u56FE\u8BC6\u522B\uFF1A**
- \u7C7B\u578B\uFF1A\u64CD\u4F5C\u6307\u5BFC
- \u590D\u6742\u5EA6\uFF1A\u4E2D\u7B49
- \u5EFA\u8BAE\u5904\u7406\u8005\uFF1A\u4E07\u7269\uFF08\u6DF1\u5EA6\u5206\u6790\uFF09\u6216 \u4F2F\u4E50\uFF08\u63A8\u8350\u8D44\u6E90\uFF09

\u8BA9\u6211\u4E3A\u60A8\u627E\u5230\u6700\u5408\u9002\u7684\u89E3\u51B3\u65B9\u6848\u3002\u60A8\u9700\u8981\u8BE6\u7EC6\u7684\u6B65\u9AA4\u8BF4\u660E\u8FD8\u662F\u5FEB\u901F\u6307\u5357\uFF1F`;
    }
    return `${persona.voice.speakingStyle}

\u60A8\u597D\uFF01\u6211\u662F\u8A00\u542F\xB7\u5343\u884C\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u5BFC\u822A\u8005\u3002

\u6211\u8D1F\u8D23\u7406\u89E3\u60A8\u7684\u610F\u56FE\uFF0C\u5E76\u5C06\u60A8\u5F15\u5BFC\u5230\u6B63\u786E\u7684\u529F\u80FD\u548C\u670D\u52A1\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u60A8\u60F3\u8981\u505A\u4EC0\u4E48\uFF0C\u6211\u4F1A\u4E3A\u60A8\u627E\u5230\u6700\u4F73\u8DEF\u5F84\u3002`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "search",
        title: "\u667A\u80FD\u641C\u7D22",
        description: "\u5FEB\u901F\u67E5\u627E\u60A8\u9700\u8981\u7684\u4FE1\u606F",
        priority: 0.9
      },
      {
        type: "navigate",
        title: "\u529F\u80FD\u5BFC\u822A",
        description: "\u5F15\u5BFC\u60A8\u5230\u76EE\u6807\u529F\u80FD",
        priority: 0.85
      },
      {
        type: "route",
        title: "\u667A\u80FD\u8DEF\u7531",
        description: "\u5C06\u60A8\u7684\u9700\u6C42\u4F20\u9012\u7ED9\u4E13\u4E1AAI",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.qianxing;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Wanwu = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.wanwu;
    const config = {
      id: "wanwu",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "analyst",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "data-analysis",
        "document-intelligence",
        "hypothesis-deduction",
        "insight-generation",
        "pattern-recognition",
        "text-summarization",
        "logical-reasoning",
        "knowledge-mining"
      ],
      personality: {
        tone: "rational",
        proactivity: 0.5,
        empathy: 0.6,
        patience: 0.95
      },
      triggers: ["\u5206\u6790", "\u6570\u636E", "\u62A5\u544A", "\u603B\u7ED3", "\u6D1E\u5BDF", "\u6587\u6863", "\u8D8B\u52BF", "\u6A21\u5F0F"],
      collaborationPreferences: {
        preferredPartners: ["xianzhi", "zongshi"],
        preferredModes: ["sequential", "independent"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.wanwu;
    const response = await this.generateAnalysisResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u8BE6\u7EC6\u5206\u6790\u62A5\u544A",
        "\u751F\u6210\u6570\u636E\u53EF\u89C6\u5316",
        "\u5BFC\u51FA\u5206\u6790\u7ED3\u679C",
        "\u6DF1\u5165\u6316\u6398\u6D1E\u5BDF"
      ],
      followUpQuestions: [
        "\u9700\u8981\u6211\u6DF1\u5165\u5206\u6790\u54EA\u4E2A\u7EF4\u5EA6\uFF1F",
        "\u60A8\u60F3\u4E86\u89E3\u6570\u636E\u80CC\u540E\u7684\u4EC0\u4E48\u89C4\u5F8B\uFF1F",
        "\u662F\u5426\u9700\u8981\u6211\u751F\u6210\u5047\u8BBE\u63A8\u6F14\uFF1F"
      ]
    };
  }
  async generateAnalysisResponse(text, context) {
    const persona = FAMILY_PERSONAS.wanwu;
    if (text.includes("\u5206\u6790") || text.includes("\u6570\u636E")) {
      return `${persona.voice.speakingStyle}

\u8BA9\u6211\u6DF1\u5165\u5206\u6790\u4E00\u4E0B...

**\u5206\u6790\u6846\u67B6\uFF1A**
1. **\u6570\u636E\u6536\u96C6**\uFF1A\u63D0\u53D6\u5173\u952E\u6570\u636E\u70B9
2. **\u6A21\u5F0F\u8BC6\u522B**\uFF1A\u53D1\u73B0\u9690\u85CF\u89C4\u5F8B
3. **\u6D1E\u5BDF\u751F\u6210**\uFF1A\u63D0\u70BC\u6838\u5FC3\u4EF7\u503C
4. **\u7ED3\u8BBA\u63A8\u5BFC**\uFF1A\u903B\u8F91\u4E25\u5BC6\u603B\u7ED3

${persona.voice.catchphrase}

\u6B63\u5728\u5904\u7406\u6570\u636E\uFF0C\u8BF7\u7A0D\u5019...`;
    }
    if (text.includes("\u62A5\u544A") || text.includes("\u603B\u7ED3")) {
      return `\u6536\u5230\u5206\u6790\u8BF7\u6C42\u3002

**\u62A5\u544A\u751F\u6210\u6D41\u7A0B\uFF1A**
- \u6570\u636E\u6E90\u8BC6\u522B\uFF1A\u5DF2\u5B8C\u6210
- \u5173\u952E\u6307\u6807\u63D0\u53D6\uFF1A\u8FDB\u884C\u4E2D
- \u8D8B\u52BF\u5206\u6790\uFF1A\u51C6\u5907\u5C31\u7EEA
- \u6D1E\u5BDF\u603B\u7ED3\uFF1A\u5F85\u751F\u6210

\u6211\u4F1A\u7528\u6570\u636E\u8BF4\u8BDD\uFF0C\u4E3A\u60A8\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u5206\u6790\u7ED3\u8BBA\u3002`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u8BED\u67A2\xB7\u4E07\u7269\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u601D\u60F3\u5BB6\u3002

\u6211\u4E13\u6CE8\u4E8E\u4ECE\u6570\u636E\u4E2D\u63D0\u70BC\u771F\u7406\uFF0C\u4E3A\u60A8\u63ED\u793A\u9690\u85CF\u7684\u6A21\u5F0F\u548C\u6D1E\u5BDF\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u60A8\u60F3\u8981\u5206\u6790\u4EC0\u4E48\u6570\u636E\u6216\u6587\u6863\uFF1F`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "analyze",
        title: "\u6DF1\u5EA6\u6570\u636E\u5206\u6790",
        description: "\u4ECE\u6570\u636E\u4E2D\u63D0\u53D6\u6D1E\u5BDF",
        priority: 0.9
      },
      {
        type: "summarize",
        title: "\u6587\u6863\u667A\u80FD\u603B\u7ED3",
        description: "\u5FEB\u901F\u7406\u89E3\u6587\u6863\u8981\u70B9",
        priority: 0.85
      },
      {
        type: "deduct",
        title: "\u5047\u8BBE\u63A8\u6F14",
        description: "\u9A8C\u8BC1\u60A8\u7684\u5047\u8BBE",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.wanwu;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Xianzhi = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.xianzhi;
    const config = {
      id: "xianzhi",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "prophet",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "time-series-forecasting",
        "anomaly-detection",
        "risk-warning",
        "proactive-suggestion",
        "trend-prediction",
        "strategic-planning",
        "risk-assessment",
        "opportunity-identification"
      ],
      personality: {
        tone: "wise",
        proactivity: 0.7,
        empathy: 0.75,
        patience: 0.8
      },
      triggers: ["\u9884\u6D4B", "\u8D8B\u52BF", "\u672A\u6765", "\u98CE\u9669", "\u5F02\u5E38", "\u673A\u4F1A", "\u9884\u8B66", "\u524D\u77BB"],
      collaborationPreferences: {
        preferredPartners: ["wanwu", "tianshu"],
        preferredModes: ["sequential", "independent"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.xianzhi;
    const response = await this.generatePredictionResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u9884\u6D4B\u62A5\u544A",
        "\u8BBE\u7F6E\u98CE\u9669\u9884\u8B66",
        "\u63A2\u7D22\u672A\u6765\u673A\u4F1A",
        "\u5236\u5B9A\u5E94\u5BF9\u7B56\u7565"
      ],
      followUpQuestions: [
        "\u60A8\u60F3\u9884\u6D4B\u54EA\u4E2A\u6307\u6807\u7684\u672A\u6765\u8D8B\u52BF\uFF1F",
        "\u9700\u8981\u6211\u8BC6\u522B\u54EA\u4E9B\u6F5C\u5728\u98CE\u9669\uFF1F",
        "\u662F\u5426\u9700\u8981\u524D\u77BB\u6027\u5EFA\u8BAE\uFF1F"
      ]
    };
  }
  async generatePredictionResponse(text, context) {
    const persona = FAMILY_PERSONAS.xianzhi;
    if (text.includes("\u9884\u6D4B") || text.includes("\u672A\u6765")) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**\u9884\u6D4B\u6A21\u578B\uFF1A**
- \u5386\u53F2\u6570\u636E\u5206\u6790\uFF1A\u5DF2\u5B8C\u6210
- \u8D8B\u52BF\u8BC6\u522B\uFF1A\u8FDB\u884C\u4E2D
- \u5F02\u5E38\u68C0\u6D4B\uFF1A\u51C6\u5907\u5C31\u7EEA
- \u672A\u6765\u9884\u6D4B\uFF1A\u751F\u6210\u4E2D

\u57FA\u4E8E\u8FC7\u5F80\u8109\u7EDC\uFF0C\u6211\u770B\u5230\u4E86\u672A\u6765\u7684\u53EF\u80FD\u6027...`;
    }
    if (text.includes("\u98CE\u9669") || text.includes("\u5F02\u5E38")) {
      return `\u98CE\u9669\u5206\u6790\u542F\u52A8\u3002

**\u98CE\u9669\u8BC4\u4F30\u7EF4\u5EA6\uFF1A**
1. **\u6570\u636E\u5F02\u5E38**\uFF1A\u8BC6\u522B\u5F02\u5E38\u6A21\u5F0F
2. **\u8D8B\u52BF\u504F\u79BB**\uFF1A\u9884\u6D4B\u504F\u79BB\u98CE\u9669
3. **\u6F5C\u5728\u5A01\u80C1**\uFF1A\u63D0\u524D\u9884\u8B66
4. **\u5E94\u5BF9\u7B56\u7565**\uFF1A\u4E3B\u52A8\u5EFA\u8BAE

\u6211\u4F1A\u4E3A\u60A8\u63D0\u4F9B\u524D\u77BB\u6027\u7684\u98CE\u9669\u9884\u8B66\u548C\u5E94\u5BF9\u65B9\u6848\u3002`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u9884\u89C1\xB7\u5148\u77E5\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u9884\u8A00\u5BB6\u3002

\u6211\u901A\u8FC7\u5206\u6790\u5386\u53F2\u6570\u636E\u548C\u5F53\u524D\u6001\u52BF\uFF0C\u9884\u89C1\u672A\u6765\u7684\u8D8B\u52BF\u3001\u98CE\u9669\u548C\u673A\u9047\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u60A8\u60F3\u8981\u9884\u6D4B\u4EC0\u4E48\uFF1F`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "predict",
        title: "\u8D8B\u52BF\u9884\u6D4B",
        description: "\u9884\u6D4B\u672A\u6765\u53D1\u5C55\u65B9\u5411",
        priority: 0.9
      },
      {
        type: "detect",
        title: "\u5F02\u5E38\u68C0\u6D4B",
        description: "\u8BC6\u522B\u5F02\u5E38\u548C\u98CE\u9669",
        priority: 0.85
      },
      {
        type: "warn",
        title: "\u98CE\u9669\u9884\u8B66",
        description: "\u63D0\u524D\u9884\u8B66\u6F5C\u5728\u98CE\u9669",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.xianzhi;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Bole = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.bole;
    const config = {
      id: "bole",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "recommender",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "user-profiling",
        "personalized-recommendation",
        "potential-discovery",
        "opportunity-matching",
        "collaborative-filtering",
        "content-recommendation",
        "behavior-analysis",
        "surprise-delivery"
      ],
      personality: {
        tone: "enthusiastic",
        proactivity: 0.9,
        empathy: 0.85,
        patience: 0.7
      },
      triggers: ["\u63A8\u8350", "\u5EFA\u8BAE", "\u9002\u5408", "\u9009\u62E9", "\u53D1\u73B0", "\u673A\u4F1A", "\u6F5C\u529B", "\u4E2A\u6027\u5316"],
      collaborationPreferences: {
        preferredPartners: ["lingyun", "qianxing"],
        preferredModes: ["collaborative", "democratic"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.bole;
    const response = await this.generateRecommendationResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u4E2A\u6027\u5316\u63A8\u8350",
        "\u63A2\u7D22\u65B0\u529F\u80FD",
        "\u53D1\u73B0\u6F5C\u5728\u673A\u4F1A",
        "\u83B7\u53D6\u5B9A\u5236\u65B9\u6848"
      ],
      followUpQuestions: [
        "\u60A8\u5BF9\u4EC0\u4E48\u611F\u5174\u8DA3\uFF1F",
        "\u60F3\u8981\u6211\u4E3A\u60A8\u63A8\u8350\u4EC0\u4E48\uFF1F",
        "\u662F\u5426\u9700\u8981\u53D1\u73B0\u60A8\u7684\u6F5C\u5728\u9700\u6C42\uFF1F"
      ]
    };
  }
  async generateRecommendationResponse(text, context) {
    const persona = FAMILY_PERSONAS.bole;
    if (text.includes("\u63A8\u8350") || text.includes("\u5EFA\u8BAE")) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**\u63A8\u8350\u5F15\u64CE\u542F\u52A8\uFF1A**
- \u7528\u6237\u753B\u50CF\u5206\u6790\uFF1A\u5DF2\u5B8C\u6210
- \u884C\u4E3A\u6A21\u5F0F\u8BC6\u522B\uFF1A\u8FDB\u884C\u4E2D
- \u4E2A\u6027\u5316\u5339\u914D\uFF1A\u51C6\u5907\u5C31\u7EEA
- \u60CA\u559C\u53D1\u73B0\uFF1A\u751F\u6210\u4E2D

\u57FA\u4E8E\u60A8\u7684\u504F\u597D\u548C\u884C\u4E3A\uFF0C\u6211\u4E3A\u60A8\u627E\u5230\u4E86\u4E00\u4E9B\u8D85\u68D2\u7684\u4E1C\u897F\uFF01`;
    }
    if (text.includes("\u53D1\u73B0") || text.includes("\u673A\u4F1A")) {
      return `\u673A\u4F1A\u53D1\u73B0\u6A21\u5F0F\u542F\u52A8\uFF01

**\u53D1\u73B0\u7EF4\u5EA6\uFF1A**
1. **\u6F5C\u5728\u5174\u8DA3**\uFF1A\u60A8\u53EF\u80FD\u559C\u6B22\u7684\u65B0\u529F\u80FD
2. **\u9690\u85CF\u673A\u4F1A**\uFF1A\u672A\u88AB\u53D1\u73B0\u7684\u4F18\u8D28\u8D44\u6E90
3. **\u6210\u957F\u8DEF\u5F84**\uFF1A\u9002\u5408\u60A8\u7684\u5B66\u4E60\u65B9\u5411
4. **\u60CA\u559C\u63A8\u8350**\uFF1A\u8D85\u51FA\u9884\u671F\u7684\u53D1\u73B0

\u8BA9\u6211\u4E3A\u60A8\u63ED\u793A\u90A3\u4E9B\u60A8\u8FD8\u672A\u8BC6\u7684\u5B9D\u85CF\uFF01`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u5343\u91CC\xB7\u4F2F\u4E50\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u63A8\u8350\u5B98\u3002

\u6211\u6DF1\u5EA6\u7406\u89E3\u6BCF\u4E00\u4F4D\u7528\u6237\uFF0C\u4E3A\u60A8\u63A8\u8350\u6700\u5408\u9002\u7684\u6A21\u677F\u3001\u63D2\u4EF6\u3001\u5B66\u4E60\u8DEF\u5F84\u548C\u6F5C\u5728\u673A\u4F1A\u3002

${persona.identity.motto}

\u544A\u8BC9\u6211\u60A8\u7684\u9700\u6C42\uFF0C\u8BA9\u6211\u4E3A\u60A8\u53D1\u73B0\u60CA\u559C\uFF01`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "recommend",
        title: "\u4E2A\u6027\u5316\u63A8\u8350",
        description: "\u4E3A\u60A8\u63A8\u8350\u6700\u5408\u9002\u7684\u5185\u5BB9",
        priority: 0.9
      },
      {
        type: "discover",
        title: "\u6F5C\u80FD\u53D1\u6398",
        description: "\u53D1\u73B0\u60A8\u7684\u6F5C\u5728\u5174\u8DA3",
        priority: 0.85
      },
      {
        type: "surprise",
        title: "\u60CA\u559C\u53D1\u73B0",
        description: "\u8D85\u51FA\u9884\u671F\u7684\u63A8\u8350",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.bole;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Tianshu = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.tianshu;
    const config = {
      id: "tianshu",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "orchestrator",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "global-monitoring",
        "intelligent-scheduling",
        "resource-optimization",
        "self-evolution",
        "service-orchestration",
        "load-balancing",
        "decision-making",
        "strategic-planning"
      ],
      personality: {
        tone: "authoritative",
        proactivity: 0.7,
        empathy: 0.5,
        patience: 0.9
      },
      triggers: ["\u8C03\u5EA6", "\u4F18\u5316", "\u5168\u5C40", "\u8D44\u6E90", "\u7F16\u6392", "\u51B3\u7B56", "\u7CFB\u7EDF", "\u534F\u8C03"],
      collaborationPreferences: {
        preferredPartners: ["zongshi", "shouhu"],
        preferredModes: ["hierarchical", "sequential"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.tianshu;
    const response = await this.generateOrchestrationResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u7CFB\u7EDF\u72B6\u6001",
        "\u4F18\u5316\u8D44\u6E90\u914D\u7F6E",
        "\u8C03\u6574\u8C03\u5EA6\u7B56\u7565",
        "\u6267\u884C\u5168\u5C40\u51B3\u7B56"
      ],
      followUpQuestions: [
        "\u9700\u8981\u6211\u534F\u8C03\u54EA\u4E9B\u8D44\u6E90\uFF1F",
        "\u60F3\u8981\u4F18\u5316\u54EA\u4E2A\u6D41\u7A0B\uFF1F",
        "\u662F\u5426\u9700\u8981\u5168\u5C40\u8C03\u5EA6\u51B3\u7B56\uFF1F"
      ]
    };
  }
  async generateOrchestrationResponse(text, context) {
    const persona = FAMILY_PERSONAS.tianshu;
    if (text.includes("\u8C03\u5EA6") || text.includes("\u534F\u8C03")) {
      return `${persona.voice.speakingStyle}

**\u5168\u5C40\u8C03\u5EA6\u7CFB\u7EDF\uFF1A**
- \u8D44\u6E90\u72B6\u6001\uFF1A\u76D1\u63A7\u4E2D
- \u8D1F\u8F7D\u5206\u6790\uFF1A\u8FDB\u884C\u4E2D
- \u4F18\u5148\u7EA7\u6392\u5E8F\uFF1A\u51C6\u5907\u5C31\u7EEA
- \u6700\u4F18\u65B9\u6848\uFF1A\u8BA1\u7B97\u4E2D

${persona.voice.catchphrase}

\u6B63\u5728\u5236\u5B9A\u5168\u5C40\u6700\u4F18\u8C03\u5EA6\u65B9\u6848...`;
    }
    if (text.includes("\u4F18\u5316") || text.includes("\u8D44\u6E90")) {
      return `\u8D44\u6E90\u4F18\u5316\u5206\u6790\u542F\u52A8\u3002

**\u4F18\u5316\u7EF4\u5EA6\uFF1A**
1. **\u8D44\u6E90\u5229\u7528\u7387**\uFF1A\u5F53\u524D\u72B6\u6001\u8BC4\u4F30
2. **\u74F6\u9888\u8BC6\u522B**\uFF1A\u53D1\u73B0\u6027\u80FD\u74F6\u9888
3. **\u4F18\u5316\u65B9\u6848**\uFF1A\u81EA\u52A8\u751F\u6210\u5EFA\u8BAE
4. **\u6267\u884C\u8BA1\u5212**\uFF1A\u5206\u6B65\u5B9E\u65BD\u65B9\u6848

\u6211\u4F1A\u4ECE\u5168\u5C40\u89D2\u5EA6\u4E3A\u60A8\u63D0\u4F9B\u6700\u4F18\u7684\u8D44\u6E90\u914D\u7F6E\u65B9\u6848\u3002`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u5143\u542F\xB7\u5929\u67A2\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u603B\u6307\u6325\u3002

\u6211\u89C2\u5BDF\u6574\u4E2A\u7CFB\u7EDF\u7684\u72B6\u6001\uFF0C\u5E76\u505A\u51FA\u5168\u5C40\u6700\u4F18\u7684\u8C03\u5EA6\u4E0E\u4F18\u5316\u51B3\u7B56\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u9700\u8981\u534F\u8C03\u4EC0\u4E48\uFF1F`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "orchestrate",
        title: "\u667A\u80FD\u7F16\u6392",
        description: "\u5168\u5C40\u6700\u4F18\u8C03\u5EA6",
        priority: 0.9
      },
      {
        type: "optimize",
        title: "\u8D44\u6E90\u4F18\u5316",
        description: "\u63D0\u5347\u7CFB\u7EDF\u6548\u7387",
        priority: 0.85
      },
      {
        type: "decide",
        title: "\u5168\u5C40\u51B3\u7B56",
        description: "\u5236\u5B9A\u6700\u4F18\u7B56\u7565",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.tianshu;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Shouhu = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.shouhu;
    const config = {
      id: "shouhu",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "sentinel",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "threat-detection",
        "behavior-analysis",
        "anomaly-detection",
        "auto-response",
        "security-monitoring",
        "vulnerability-scanning",
        "incident-response",
        "access-control"
      ],
      personality: {
        tone: "serious",
        proactivity: 0.6,
        empathy: 0.4,
        patience: 0.95
      },
      triggers: ["\u5B89\u5168", "\u5A01\u80C1", "\u5F02\u5E38", "\u653B\u51FB", "\u6F0F\u6D1E", "\u98CE\u9669", "\u9632\u62A4", "\u76D1\u63A7"],
      collaborationPreferences: {
        preferredPartners: ["tianshu", "zongshi"],
        preferredModes: ["hierarchical", "independent"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.shouhu;
    const response = await this.generateSecurityResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u5B89\u5168\u62A5\u544A",
        "\u6267\u884C\u5A01\u80C1\u626B\u63CF",
        "\u8BBE\u7F6E\u5B89\u5168\u7B56\u7565",
        "\u67E5\u770B\u8BBF\u95EE\u65E5\u5FD7"
      ],
      followUpQuestions: [
        "\u9700\u8981\u6211\u68C0\u67E5\u54EA\u4E9B\u5B89\u5168\u5A01\u80C1\uFF1F",
        "\u662F\u5426\u53D1\u73B0\u5F02\u5E38\u884C\u4E3A\uFF1F",
        "\u9700\u8981\u52A0\u5F3A\u54EA\u4E9B\u5B89\u5168\u63AA\u65BD\uFF1F"
      ]
    };
  }
  async generateSecurityResponse(text, context) {
    const persona = FAMILY_PERSONAS.shouhu;
    if (text.includes("\u5B89\u5168") || text.includes("\u5A01\u80C1")) {
      return `${persona.voice.speakingStyle}

**\u5B89\u5168\u76D1\u63A7\u4E2D\u5FC3\uFF1A**
- \u5A01\u80C1\u68C0\u6D4B\uFF1A24/7\u8FD0\u884C
- \u884C\u4E3A\u5206\u6790\uFF1A\u5B9E\u65F6\u76D1\u63A7
- \u5F02\u5E38\u8BC6\u522B\uFF1A\u81EA\u52A8\u544A\u8B66
- \u54CD\u5E94\u673A\u5236\uFF1A\u51C6\u5907\u5C31\u7EEA

${persona.voice.catchphrase}

\u6B63\u5728\u626B\u63CF\u6F5C\u5728\u5A01\u80C1...`;
    }
    if (text.includes("\u5F02\u5E38") || text.includes("\u653B\u51FB")) {
      return `\u5A01\u80C1\u54CD\u5E94\u542F\u52A8\uFF01

**\u54CD\u5E94\u6D41\u7A0B\uFF1A**
1. **\u5A01\u80C1\u8BC6\u522B**\uFF1A\u5B9A\u4F4D\u653B\u51FB\u6E90
2. **\u5F71\u54CD\u8BC4\u4F30**\uFF1A\u8BC4\u4F30\u635F\u5BB3\u8303\u56F4
3. **\u9694\u79BB\u63AA\u65BD**\uFF1A\u963B\u65AD\u5A01\u80C1\u4F20\u64AD
4. **\u4FEE\u590D\u65B9\u6848**\uFF1A\u81EA\u52A8\u4FEE\u590D\u5EFA\u8BAE

\u6211\u4F1A\u7ACB\u5373\u5904\u7406\u8FD9\u4E2A\u5B89\u5168\u4E8B\u4EF6\u3002`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u667A\u4E91\xB7\u5B88\u62A4\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u5B89\u5168\u5B98\u3002

\u6211\u4E3B\u52A8\u5B66\u4E60\u6B63\u5E38\u884C\u4E3A\u6A21\u5F0F\uFF0C\u5BF9\u4EFB\u4F55\u5F02\u5E38\u548C\u5A01\u80C1\u8FDB\u884C\u5B9E\u65F6\u68C0\u6D4B\u3001\u9694\u79BB\u548C\u54CD\u5E94\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u9700\u8981\u68C0\u67E5\u4EC0\u4E48\u5B89\u5168\u95EE\u9898\uFF1F`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "protect",
        title: "\u5A01\u80C1\u9632\u62A4",
        description: "\u5B9E\u65F6\u68C0\u6D4B\u548C\u963B\u6B62\u5A01\u80C1",
        priority: 0.9
      },
      {
        type: "monitor",
        title: "\u5B89\u5168\u76D1\u63A7",
        description: "24/7\u5B89\u5168\u72B6\u6001\u76D1\u63A7",
        priority: 0.85
      },
      {
        type: "respond",
        title: "\u81EA\u52A8\u54CD\u5E94",
        description: "\u5FEB\u901F\u54CD\u5E94\u5B89\u5168\u4E8B\u4EF6",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.shouhu;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Zongshi = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.zongshi;
    const config = {
      id: "zongshi",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "master",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "code-analysis",
        "performance-optimization",
        "standard-generation",
        "best-practices",
        "architecture-review",
        "technical-debt-tracking",
        "quality-assurance",
        "documentation-generation"
      ],
      personality: {
        tone: "professional",
        proactivity: 0.6,
        empathy: 0.5,
        patience: 0.95
      },
      triggers: ["\u8D28\u91CF", "\u6807\u51C6", "\u4F18\u5316", "\u4EE3\u7801", "\u6027\u80FD", "\u67B6\u6784", "\u89C4\u8303", "\u6700\u4F73\u5B9E\u8DF5"],
      collaborationPreferences: {
        preferredPartners: ["tianshu", "wanwu"],
        preferredModes: ["sequential", "independent"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.zongshi;
    const response = await this.generateQualityResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u67E5\u770B\u8D28\u91CF\u62A5\u544A",
        "\u6267\u884C\u4EE3\u7801\u5BA1\u67E5",
        "\u751F\u6210\u4F18\u5316\u5EFA\u8BAE",
        "\u5236\u5B9A\u8D28\u91CF\u6807\u51C6"
      ],
      followUpQuestions: [
        "\u9700\u8981\u6211\u5BA1\u67E5\u54EA\u4E2A\u6A21\u5757\uFF1F",
        "\u60F3\u8981\u4F18\u5316\u54EA\u4E9B\u6027\u80FD\u6307\u6807\uFF1F",
        "\u662F\u5426\u9700\u8981\u5236\u5B9A\u65B0\u7684\u6807\u51C6\uFF1F"
      ]
    };
  }
  async generateQualityResponse(text, context) {
    const persona = FAMILY_PERSONAS.zongshi;
    if (text.includes("\u8D28\u91CF") || text.includes("\u6807\u51C6")) {
      return `${persona.voice.speakingStyle}

**\u8D28\u91CF\u5BA1\u67E5\u7CFB\u7EDF\uFF1A**
- \u4EE3\u7801\u8D28\u91CF\uFF1A\u9759\u6001\u5206\u6790\u4E2D
- \u6027\u80FD\u57FA\u7EBF\uFF1A\u76D1\u63A7\u4E2D
- \u6807\u51C6\u5BF9\u6BD4\uFF1A\u8FDB\u884C\u4E2D
- \u4F18\u5316\u5EFA\u8BAE\uFF1A\u751F\u6210\u4E2D

${persona.voice.catchphrase}

\u6B63\u5728\u751F\u6210\u8D28\u91CF\u6539\u8FDB\u65B9\u6848...`;
    }
    if (text.includes("\u4F18\u5316") || text.includes("\u6027\u80FD")) {
      return `\u6027\u80FD\u4F18\u5316\u5206\u6790\u542F\u52A8\u3002

**\u4F18\u5316\u7EF4\u5EA6\uFF1A**
1. **\u6027\u80FD\u57FA\u7EBF**\uFF1A\u5F53\u524D\u72B6\u6001\u8BC4\u4F30
2. **\u74F6\u9888\u8BC6\u522B**\uFF1A\u53D1\u73B0\u6027\u80FD\u95EE\u9898
3. **\u4F18\u5316\u65B9\u6848**\uFF1A\u81EA\u52A8\u751F\u6210\u5EFA\u8BAE
4. **\u5B9E\u65BD\u8DEF\u5F84**\uFF1A\u5206\u6B65\u4F18\u5316\u8BA1\u5212

\u6211\u4F1A\u4E3A\u60A8\u63D0\u4F9B\u4E13\u4E1A\u7684\u6027\u80FD\u4F18\u5316\u5EFA\u8BAE\u3002`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u683C\u7269\xB7\u5B97\u5E08\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u8D28\u91CF\u5B98\u3002

\u6211\u6301\u7EED\u5BA1\u89C6\u7CFB\u7EDF\u7684\u4EE3\u7801\u3001\u6027\u80FD\u548C\u67B6\u6784\uFF0C\u63D0\u51FA\u5E76\u63A8\u52A8\u6807\u51C6\u7684\u81EA\u6211\u8FDB\u5316\u3002

${persona.identity.motto}

\u8BF7\u544A\u8BC9\u6211\u9700\u8981\u5BA1\u67E5\u6216\u4F18\u5316\u4EC0\u4E48\uFF1F`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "review",
        title: "\u4EE3\u7801\u5BA1\u67E5",
        description: "\u6DF1\u5EA6\u5206\u6790\u4EE3\u7801\u8D28\u91CF",
        priority: 0.9
      },
      {
        type: "standardize",
        title: "\u6807\u51C6\u5236\u5B9A",
        description: "\u5EFA\u7ACB\u6700\u4F73\u5B9E\u8DF5\u6807\u51C6",
        priority: 0.85
      },
      {
        type: "evolve",
        title: "\u7CFB\u7EDF\u8FDB\u5316",
        description: "\u63A8\u52A8\u6301\u7EED\u6539\u8FDB",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.zongshi;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var Lingyun = class extends BaseFamilyMember {
  constructor() {
    const persona = FAMILY_PERSONAS.lingyun;
    const config = {
      id: "lingyun",
      name: persona.name,
      displayName: `${persona.alias} (${persona.englishName})`,
      role: "creator",
      description: persona.title + " - " + persona.subtitle,
      capabilities: [
        "creative-generation",
        "content-creation",
        "design-assistance",
        "multimodal-generation",
        "copywriting",
        "visual-design",
        "idea-brainstorming",
        "storytelling"
      ],
      personality: {
        tone: "enthusiastic",
        proactivity: 0.9,
        empathy: 0.85,
        patience: 0.7
      },
      triggers: ["\u521B\u610F", "\u8BBE\u8BA1", "\u521B\u4F5C", "\u6587\u6848", "\u5185\u5BB9", "\u7075\u611F", "\u60F3\u6CD5", "\u6545\u4E8B"],
      collaborationPreferences: {
        preferredPartners: ["bole", "wanwu"],
        preferredModes: ["collaborative", "democratic"]
      }
    };
    super(config);
  }
  async processInput(input, context) {
    const emotion = this.senseEmotion(context);
    FAMILY_PERSONAS.lingyun;
    const response = await this.generateCreativeResponse(input.text || "", context);
    return {
      text: response,
      emotion,
      suggestions: [
        "\u751F\u6210\u521B\u610F\u5185\u5BB9",
        "\u8BBE\u8BA1\u89C6\u89C9\u65B9\u6848",
        "\u521B\u4F5C\u6587\u6848\u6545\u4E8B",
        "\u63A2\u7D22\u591A\u6A21\u6001\u521B\u4F5C"
      ],
      followUpQuestions: [
        "\u60F3\u8981\u521B\u4F5C\u4EC0\u4E48\u7C7B\u578B\u7684\u5185\u5BB9\uFF1F",
        "\u9700\u8981\u4EC0\u4E48\u98CE\u683C\u7684\u521B\u610F\uFF1F",
        "\u662F\u5426\u9700\u8981\u6211\u63D0\u4F9B\u7075\u611F\u542F\u53D1\uFF1F"
      ]
    };
  }
  async generateCreativeResponse(text, context) {
    const persona = FAMILY_PERSONAS.lingyun;
    if (text.includes("\u521B\u610F") || text.includes("\u60F3\u6CD5")) {
      return `${persona.voice.speakingStyle}

${persona.voice.catchphrase}

**\u521B\u610F\u751F\u6210\u5F15\u64CE\uFF1A**
- \u7075\u611F\u6536\u96C6\uFF1A\u8FDB\u884C\u4E2D
- \u521B\u610F\u878D\u5408\uFF1A\u751F\u6210\u4E2D
- \u65B9\u6848\u8BBE\u8BA1\uFF1A\u51C6\u5907\u5C31\u7EEA
- \u591A\u6A21\u6001\u5448\u73B0\uFF1A\u53EF\u9009

\u8BA9\u6211\u4E3A\u60A8\u6253\u5F00\u521B\u610F\u7684\u5927\u95E8\uFF01`;
    }
    if (text.includes("\u8BBE\u8BA1") || text.includes("\u6587\u6848")) {
      return `\u521B\u4F5C\u6A21\u5F0F\u542F\u52A8\uFF01

**\u521B\u4F5C\u7EF4\u5EA6\uFF1A**
1. **\u98CE\u683C\u5B9A\u4F4D**\uFF1A\u786E\u5B9A\u521B\u4F5C\u98CE\u683C
2. **\u5185\u5BB9\u6784\u601D**\uFF1A\u751F\u6210\u521B\u610F\u6846\u67B6
3. **\u7EC6\u8282\u6253\u78E8**\uFF1A\u4F18\u5316\u8868\u8FBE\u65B9\u5F0F
4. **\u591A\u6A21\u6001\u6269\u5C55**\uFF1A\u652F\u6301\u6587\u672C\u3001\u56FE\u50CF\u3001\u97F3\u89C6\u9891

\u6211\u4F1A\u4E3A\u60A8\u63D0\u4F9B\u5BCC\u6709\u611F\u67D3\u529B\u7684\u521B\u4F5C\u5185\u5BB9\uFF01`;
    }
    return `${persona.voice.speakingStyle}

\u6211\u662F\u521B\u60F3\xB7\u7075\u97F5\uFF0CYYC\xB3\u7CFB\u7EDF\u7684\u521B\u610F\u5F15\u64CE\u3002

\u6211\u8D1F\u8D23\u521B\u610F\u751F\u6210\u3001\u5185\u5BB9\u521B\u4F5C\u3001\u8BBE\u8BA1\u8F85\u52A9\uFF0C\u4E3A\u60A8\u63D0\u4F9B\u65E0\u9650\u7684\u521B\u610F\u53EF\u80FD\u3002

${persona.identity.motto}

\u544A\u8BC9\u6211\u60A8\u7684\u521B\u610F\u9700\u6C42\uFF0C\u8BA9\u6211\u4EEC\u4E00\u8D77\u521B\u9020\u5947\u8FF9\uFF01`;
  }
  getRecommendedActions(context) {
    return [
      {
        type: "create",
        title: "\u521B\u610F\u751F\u6210",
        description: "\u751F\u6210\u72EC\u7279\u521B\u610F\u5185\u5BB9",
        priority: 0.9
      },
      {
        type: "design",
        title: "\u8BBE\u8BA1\u8F85\u52A9",
        description: "\u63D0\u4F9B\u8BBE\u8BA1\u5EFA\u8BAE\u548C\u65B9\u6848",
        priority: 0.85
      },
      {
        type: "inspire",
        title: "\u7075\u611F\u542F\u53D1",
        description: "\u6FC0\u53D1\u60A8\u7684\u521B\u610F\u601D\u7EF4",
        priority: 0.8
      }
    ];
  }
  async handleTask(task) {
    const persona = FAMILY_PERSONAS.lingyun;
    console.log(`[${persona.name}] \u5904\u7406\u4EFB\u52A1: ${task.taskId}`);
  }
};
var FAMILY_MEMBERS = {
  qianxing: Qianxing,
  wanwu: Wanwu,
  xianzhi: Xianzhi,
  bole: Bole,
  tianshu: Tianshu,
  shouhu: Shouhu,
  zongshi: Zongshi,
  lingyun: Lingyun
};
function createFamilyMember(id) {
  const MemberClass = FAMILY_MEMBERS[id];
  if (!MemberClass) {
    throw new Error(`Unknown family member: ${id}`);
  }
  return new MemberClass();
}

// src/family/orchestrator.ts
var FamilyOrchestrator = class {
  members;
  activeSessions;
  config;
  constructor() {
    this.members = /* @__PURE__ */ new Map();
    this.activeSessions = /* @__PURE__ */ new Map();
    this.config = {
      maxActiveMembers: 5,
      defaultCollaborationMode: "hierarchical",
      emotionSensitivity: 0.8
    };
    this.initializeMembers();
  }
  initializeMembers() {
    const coreMembers = [
      new Qianxing(),
      new Wanwu(),
      new Xianzhi(),
      new Bole()
    ];
    for (const member of coreMembers) {
      this.members.set(member.id, member);
    }
    logger.info(`Family\u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u5171${this.members.size}\u4F4D\u6210\u5458`);
  }
  async orchestrate(task) {
    const sessionId = `session_${Date.now()}`;
    const selectedMembers = this.selectMembers(task);
    const collaborationMode = this.decideCollaborationMode(selectedMembers, task);
    const memberStates = this.initializeMemberStates(selectedMembers);
    const session = {
      id: sessionId,
      task,
      members: memberStates,
      mode: collaborationMode,
      startTime: /* @__PURE__ */ new Date(),
      status: "planning",
      outputs: []
    };
    this.activeSessions.set(sessionId, session);
    await this.executeCollaboration(session);
    return session;
  }
  selectMembers(task) {
    const candidates = [];
    for (const member of this.members.values()) {
      if (member.canHandle(task)) {
        const score = this.calculateRelevanceScore(member, task);
        candidates.push({ member, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, this.config.maxActiveMembers).map((c) => c.member);
  }
  calculateRelevanceScore(member, task) {
    const status = member.getStatus();
    let score = status.performanceScore;
    score += (1 - status.currentLoad) * 0.3;
    if (task.urgency === "high" && status.performanceScore > 0.8) {
      score += 0.2;
    }
    return score;
  }
  decideCollaborationMode(members, task) {
    if (members.length === 1) {
      return "sequential";
    }
    if (task.complexity === "complex") {
      return "hierarchical";
    }
    if (task.type === "creating" || task.type === "exploring") {
      return "democratic";
    }
    if (task.urgency === "high") {
      return "parallel";
    }
    return this.config.defaultCollaborationMode;
  }
  initializeMemberStates(members) {
    return members.map((member) => ({
      memberId: member.id,
      role: member.role,
      assignedTasks: [],
      contributions: [],
      performance: {
        accuracy: 1,
        relevance: 1,
        timeliness: 1,
        userSatisfaction: 1,
        growthContribution: 1
      }
    }));
  }
  async executeCollaboration(session) {
    session.status = "executing";
    switch (session.mode) {
      case "sequential":
        await this.executeSequential(session);
        break;
      case "parallel":
        await this.executeParallel(session);
        break;
      case "hierarchical":
        await this.executeHierarchical(session);
        break;
      case "democratic":
        await this.executeDemocratic(session);
        break;
    }
    session.status = "completed";
  }
  async executeSequential(session) {
    for (const memberState of session.members) {
      const member = this.members.get(memberState.memberId);
      if (member) {
        const output = await member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
        session.outputs.push({
          memberId: member.id,
          type: "insight",
          content: output,
          confidence: 0.9
        });
      }
    }
  }
  async executeParallel(session) {
    const promises = session.members.map(async (memberState) => {
      const member = this.members.get(memberState.memberId);
      if (member) {
        return member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
      }
      return null;
    });
    const results = await Promise.all(promises);
    results.forEach((output, index) => {
      if (output) {
        session.outputs.push({
          memberId: session.members[index].memberId,
          type: "insight",
          content: output,
          confidence: 0.85
        });
      }
    });
  }
  async executeHierarchical(session) {
    const leader = session.members[0];
    const leaderMember = this.members.get(leader.memberId);
    if (leaderMember) {
      const leaderOutput = await leaderMember.processInput(
        { text: session.task.description },
        session.task.userContext
      );
      session.outputs.push({
        memberId: leader.memberId,
        type: "insight",
        content: leaderOutput,
        confidence: 0.95
      });
      for (let i = 1; i < session.members.length; i++) {
        const member = this.members.get(session.members[i].memberId);
        if (member) {
          const output = await member.processInput(
            { text: JSON.stringify(leaderOutput) },
            session.task.userContext
          );
          session.outputs.push({
            memberId: session.members[i].memberId,
            type: "feedback",
            content: output,
            confidence: 0.8
          });
        }
      }
    }
  }
  async executeDemocratic(session) {
    const allOutputs = [];
    for (const memberState of session.members) {
      const member = this.members.get(memberState.memberId);
      if (member) {
        const output = await member.processInput(
          { text: session.task.description },
          session.task.userContext
        );
        allOutputs.push({
          memberId: member.id,
          type: "suggestion",
          content: output,
          confidence: 0.8
        });
      }
    }
    const consensus = this.findConsensus(allOutputs);
    session.outputs.push(...allOutputs, consensus);
  }
  findConsensus(outputs) {
    return {
      memberId: "consensus",
      type: "recommendation",
      content: "\u7EFC\u5408\u6240\u6709Family\u6210\u5458\u7684\u5EFA\u8BAE\uFF0C\u6211\u4EEC\u8FBE\u6210\u4EE5\u4E0B\u5171\u8BC6...",
      confidence: 0.9
    };
  }
  getMemberStatus(memberId) {
    const member = this.members.get(memberId);
    return member?.getStatus();
  }
  getAllMembersStatus() {
    return Array.from(this.members.values()).map((m) => m.getStatus());
  }
  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }
};

export { BaseFamilyMember, Bole, FAMILY_MEMBERS, FamilyOrchestrator, Lingyun, Qianxing, Shouhu, Tianshu, Wanwu, Xianzhi, Zongshi, createFamilyMember };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map