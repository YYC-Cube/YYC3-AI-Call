import { logger } from './chunk-2WVG7ILL.js';
export { FamilyCompass, createFamilyCompass } from './chunk-7ZZLCIPK.js';
export { FAMILY_PERSONAS, getAllPersonas, getNextDutyMember, getPersona, getPersonaByHour } from './chunk-QRTYEG24.js';
export { createFamilyWorkSystem } from './chunk-T7G4WUOR.js';
import { UnifiedAuthManager } from '@yyc3/core/auth';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { z } from 'zod';
import { spawn } from 'child_process';

/**
 * @preserve YYC³ AI Family Hub
 * @version 1.4.0
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */


// src/agent-router.ts
var DEFAULT_RULES = [
  { agent: "security-scanning", keywords: ["security", "vulnerability", "audit", "\u5B89\u5168", "\u6F0F\u6D1E"], priority: 90 },
  { agent: "kubernetes-operations", keywords: ["k8s", "kubernetes", "deploy", "container", "docker", "helm"], priority: 85 },
  { agent: "llm-application-dev", keywords: ["llm", "rag", "prompt", "agent", "ai", "\u6A21\u578B", "embedding"], priority: 80 },
  { agent: "backend-development", keywords: ["api", "server", "database", "microservice", "backend", "rest", "graphql"], priority: 75 },
  { agent: "python-development", keywords: ["python", "data", "ml", "machine learning", "pytorch", "pandas"], priority: 70 },
  { agent: "javascript-typescript", keywords: ["javascript", "typescript", "node", "react", "vue", "next", "nuxt"], priority: 70 },
  { agent: "rust-development", keywords: ["rust", "cargo", "wasm", "\u7CFB\u7EDF\u7F16\u7A0B"], priority: 65 },
  { agent: "go-development", keywords: ["golang", "go", "\u5E76\u53D1", "goroutine"], priority: 65 },
  { agent: "mobile-development", keywords: ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"], priority: 60 },
  { agent: "devops", keywords: ["devops", "ci", "cd", "pipeline", "jenkins", "github actions"], priority: 55 },
  { agent: "testing", keywords: ["test", "\u6D4B\u8BD5", "unit", "integration", "e2e", "vitest", "jest"], priority: 50 },
  { agent: "documentation", keywords: ["doc", "\u6587\u6863", "readme", "api doc", "typedoc"], priority: 45 }
];
var AgentRouter = class {
  static rules = [...DEFAULT_RULES];
  static customRules = [];
  static addRule(rule) {
    this.customRules.push(rule);
  }
  static clearCustomRules() {
    this.customRules = [];
  }
  static route(task) {
    const lowerTask = task.toLowerCase();
    const allRules = [...this.customRules, ...this.rules];
    const scored = [];
    for (const rule of allRules) {
      let score = 0;
      for (const keyword of rule.keywords) {
        if (lowerTask.includes(keyword.toLowerCase())) {
          score += keyword.length;
        }
      }
      if (rule.patterns) {
        for (const pattern of rule.patterns) {
          if (pattern.test(task)) {
            score += 10;
          }
        }
      }
      if (score > 0) {
        scored.push({ agent: rule.agent, score: score * (rule.priority / 100) });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) {
      return ["general"];
    }
    return scored.slice(0, 3).map((s) => s.agent);
  }
};
var AgentImpl = class {
  constructor(definition, auth) {
    this.definition = definition;
    this.auth = auth;
    this.id = definition.id;
  }
  definition;
  auth;
  id;
  async execute(task, context) {
    const startTime = Date.now();
    const provider = this.auth.getProvider();
    const model = this.auth.getModel(this.definition.model);
    try {
      let output = "";
      if (provider.type === "openai" && provider.client) {
        const response = await provider.client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: this.definition.systemPrompt },
            { role: "user", content: task }
          ]
        });
        output = response.choices[0]?.message?.content || "";
      }
      if (provider.type === "ollama" && provider.host) {
        const response = await fetch(`${provider.host}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: this.definition.systemPrompt },
              { role: "user", content: task }
            ],
            stream: false
          })
        });
        const data = await response.json();
        output = data.message?.content || "";
      }
      if (provider.type === "anthropic") {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY || "",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: this.definition.systemPrompt,
            messages: [{ role: "user", content: task }]
          })
        });
        const data = await response.json();
        output = data.content?.[0]?.text || "";
      }
      return {
        success: true,
        output,
        duration: Date.now() - startTime,
        tokensUsed: output.length
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
};
var AgentManager = class {
  agents = /* @__PURE__ */ new Map();
  auth;
  constructor(auth) {
    this.auth = auth;
  }
  async load(paths) {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }
  async loadFromPath(p) {
    if (!fs.existsSync(p)) {
      console.warn(`Agent\u8DEF\u5F84\u4E0D\u5B58\u5728: ${p}`);
      return;
    }
    const stats = fs.statSync(p);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(p);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = fs.readFileSync(path.join(p, file), "utf-8");
          const definitions = JSON.parse(content);
          definitions.forEach((def) => {
            this.agents.set(def.id, new AgentImpl(def, this.auth));
          });
        }
      }
    }
  }
  register(definition) {
    this.agents.set(definition.id, new AgentImpl(definition, this.auth));
  }
  get(id) {
    return this.agents.get(id);
  }
  list() {
    return Array.from(this.agents.keys());
  }
  getByCategory(category) {
    return Array.from(this.agents.values()).filter((a) => a.definition.category === category || a.definition.id.startsWith(category));
  }
  count() {
    return this.agents.size;
  }
};

// src/errors/codes.ts
var YYC3ErrorCode = /* @__PURE__ */ ((YYC3ErrorCode2) => {
  YYC3ErrorCode2["AUTH_NO_PROVIDER"] = "AUTH_1001";
  YYC3ErrorCode2["AUTH_OPENAI_KEY_MISSING"] = "AUTH_1002";
  YYC3ErrorCode2["AUTH_ANTHROPIC_KEY_MISSING"] = "AUTH_1003";
  YYC3ErrorCode2["AUTH_NOT_INITIALIZED"] = "AUTH_1004";
  YYC3ErrorCode2["AUTH_INIT_FAILED"] = "AUTH_1005";
  YYC3ErrorCode2["AGENT_NOT_FOUND"] = "AGENT_2001";
  YYC3ErrorCode2["AGENT_INVALID_DEFINITION"] = "AGENT_2002";
  YYC3ErrorCode2["AGENT_EXECUTION_FAILED"] = "AGENT_2003";
  YYC3ErrorCode2["AGENT_LOAD_FAILED"] = "AGENT_2004";
  YYC3ErrorCode2["AGENT_TIMEOUT"] = "AGENT_2005";
  YYC3ErrorCode2["SKILL_NOT_FOUND"] = "SKILL_3001";
  YYC3ErrorCode2["SKILL_INVALID_DEFINITION"] = "SKILL_3002";
  YYC3ErrorCode2["SKILL_APPLY_FAILED"] = "SKILL_3003";
  YYC3ErrorCode2["SKILL_LOAD_FAILED"] = "SKILL_3004";
  YYC3ErrorCode2["SKILL_NO_MATCH"] = "SKILL_3005";
  YYC3ErrorCode2["MCP_SERVER_NOT_FOUND"] = "MCP_4001";
  YYC3ErrorCode2["MCP_INVALID_CONFIG"] = "MCP_4002";
  YYC3ErrorCode2["MCP_START_FAILED"] = "MCP_4003";
  YYC3ErrorCode2["MCP_STOP_FAILED"] = "MCP_4004";
  YYC3ErrorCode2["MCP_LOAD_FAILED"] = "MCP_4005";
  YYC3ErrorCode2["HUB_NOT_INITIALIZED"] = "HUB_5001";
  YYC3ErrorCode2["HUB_EXECUTE_FAILED"] = "HUB_5002";
  YYC3ErrorCode2["HUB_INVALID_CONFIG"] = "HUB_5003";
  YYC3ErrorCode2["HUB_TASK_CONTEXT_INVALID"] = "HUB_5004";
  YYC3ErrorCode2["SCHEMA_VALIDATION_FAILED"] = "SCHEMA_6001";
  YYC3ErrorCode2["SCHEMA_PARSE_ERROR"] = "SCHEMA_6002";
  YYC3ErrorCode2["FAMILY_MEMBER_NOT_FOUND"] = "FAMILY_7001";
  YYC3ErrorCode2["FAMILY_PROFILE_NOT_FOUND"] = "FAMILY_7002";
  return YYC3ErrorCode2;
})(YYC3ErrorCode || {});
var YYC3_ERROR_DOMAINS = {
  AUTH: "\u8BA4\u8BC1\u6A21\u5757",
  AGENT: "\u667A\u80FD\u4F53\u6A21\u5757",
  SKILL: "\u6280\u80FD\u6A21\u5757",
  MCP: "MCP\u670D\u52A1\u6A21\u5757",
  HUB: "\u4E2D\u67A2\u6A21\u5757",
  SCHEMA: "Schema\u9A8C\u8BC1",
  FAMILY: "\u5BB6\u5EAD\u6A21\u5757"
};
var YYC3_ERROR_DOMAINS_EN = {
  AUTH: "Authentication",
  AGENT: "Agent",
  SKILL: "Skill",
  MCP: "MCP Server",
  HUB: "Hub Core",
  SCHEMA: "Schema Validation",
  FAMILY: "Family"
};

// src/errors/messages.ts
var ERROR_MESSAGES = {
  ["AUTH_1001" /* AUTH_NO_PROVIDER */]: {
    zh: "\u672A\u68C0\u6D4B\u5230\u53EF\u7528\u7684AI\u63D0\u4F9B\u5546\u3002\u8BF7\u8BBE\u7F6E OPENAI_API_KEY\u3001ANTHROPIC_API_KEY \u6216\u542F\u52A8 Ollama \u670D\u52A1\u3002",
    en: "No AI provider detected. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY or start Ollama service."
  },
  ["AUTH_1002" /* AUTH_OPENAI_KEY_MISSING */]: {
    zh: "\u672A\u627E\u5230 OpenAI API Key\u3002\u8BF7\u8BBE\u7F6E OPENAI_API_KEY \u73AF\u5883\u53D8\u91CF\u3002",
    en: "OpenAI API Key not found. Please set OPENAI_API_KEY environment variable."
  },
  ["AUTH_1003" /* AUTH_ANTHROPIC_KEY_MISSING */]: {
    zh: "\u672A\u627E\u5230 Anthropic API Key\u3002\u8BF7\u8BBE\u7F6E ANTHROPIC_API_KEY \u73AF\u5883\u53D8\u91CF\u3002",
    en: "Anthropic API Key not found. Please set ANTHROPIC_API_KEY environment variable."
  },
  ["AUTH_1004" /* AUTH_NOT_INITIALIZED */]: {
    zh: "\u8BA4\u8BC1\u672A\u521D\u59CB\u5316\u3002\u8BF7\u5148\u8C03\u7528 initialize()\u3002",
    en: "Authentication not initialized. Please call initialize() first."
  },
  ["AUTH_1005" /* AUTH_INIT_FAILED */]: {
    zh: "\u8BA4\u8BC1\u521D\u59CB\u5316\u5931\u8D25\u3002",
    en: "Authentication initialization failed."
  },
  ["AGENT_2001" /* AGENT_NOT_FOUND */]: {
    zh: "Agent \u672A\u627E\u5230: {id}",
    en: "Agent not found: {id}"
  },
  ["AGENT_2002" /* AGENT_INVALID_DEFINITION */]: {
    zh: "Agent \u5B9A\u4E49\u65E0\u6548: {reason}",
    en: "Invalid agent definition: {reason}"
  },
  ["AGENT_2003" /* AGENT_EXECUTION_FAILED */]: {
    zh: "Agent \u6267\u884C\u5931\u8D25: {id} - {reason}",
    en: "Agent execution failed: {id} - {reason}"
  },
  ["AGENT_2004" /* AGENT_LOAD_FAILED */]: {
    zh: "Agent \u52A0\u8F7D\u5931\u8D25: {path}",
    en: "Agent load failed: {path}"
  },
  ["AGENT_2005" /* AGENT_TIMEOUT */]: {
    zh: "Agent \u6267\u884C\u8D85\u65F6: {id}",
    en: "Agent execution timeout: {id}"
  },
  ["SKILL_3001" /* SKILL_NOT_FOUND */]: {
    zh: "Skill \u672A\u627E\u5230: {id}",
    en: "Skill not found: {id}"
  },
  ["SKILL_3002" /* SKILL_INVALID_DEFINITION */]: {
    zh: "Skill \u5B9A\u4E49\u65E0\u6548: {reason}",
    en: "Invalid skill definition: {reason}"
  },
  ["SKILL_3003" /* SKILL_APPLY_FAILED */]: {
    zh: "Skill \u5E94\u7528\u5931\u8D25: {id}",
    en: "Skill apply failed: {id}"
  },
  ["SKILL_3004" /* SKILL_LOAD_FAILED */]: {
    zh: "Skill \u52A0\u8F7D\u5931\u8D25: {path}",
    en: "Skill load failed: {path}"
  },
  ["SKILL_3005" /* SKILL_NO_MATCH */]: {
    zh: "\u6CA1\u6709\u5339\u914D\u7684 Skill \u53EF\u7528\u4E8E\u5F53\u524D\u8F93\u5165\u3002",
    en: "No matching skill for current input."
  },
  ["MCP_4001" /* MCP_SERVER_NOT_FOUND */]: {
    zh: "MCP Server \u672A\u627E\u5230: {id}",
    en: "MCP Server not found: {id}"
  },
  ["MCP_4002" /* MCP_INVALID_CONFIG */]: {
    zh: "MCP \u914D\u7F6E\u65E0\u6548: {reason}",
    en: "Invalid MCP configuration: {reason}"
  },
  ["MCP_4003" /* MCP_START_FAILED */]: {
    zh: "MCP Server \u542F\u52A8\u5931\u8D25: {id} - {reason}",
    en: "MCP Server start failed: {id} - {reason}"
  },
  ["MCP_4004" /* MCP_STOP_FAILED */]: {
    zh: "MCP Server \u505C\u6B62\u5931\u8D25: {id}",
    en: "MCP Server stop failed: {id}"
  },
  ["MCP_4005" /* MCP_LOAD_FAILED */]: {
    zh: "MCP \u52A0\u8F7D\u5931\u8D25: {path}",
    en: "MCP load failed: {path}"
  },
  ["HUB_5001" /* HUB_NOT_INITIALIZED */]: {
    zh: "Hub \u672A\u521D\u59CB\u5316\u3002\u8BF7\u5148\u8C03\u7528 initialize()\u3002",
    en: "Hub not initialized. Please call initialize() first."
  },
  ["HUB_5002" /* HUB_EXECUTE_FAILED */]: {
    zh: "\u4EFB\u52A1\u6267\u884C\u5931\u8D25: {reason}",
    en: "Task execution failed: {reason}"
  },
  ["HUB_5003" /* HUB_INVALID_CONFIG */]: {
    zh: "Hub \u914D\u7F6E\u65E0\u6548: {reason}",
    en: "Invalid Hub configuration: {reason}"
  },
  ["HUB_5004" /* HUB_TASK_CONTEXT_INVALID */]: {
    zh: "\u4EFB\u52A1\u4E0A\u4E0B\u6587\u65E0\u6548: {reason}",
    en: "Invalid task context: {reason}"
  },
  ["SCHEMA_6001" /* SCHEMA_VALIDATION_FAILED */]: {
    zh: "Schema \u9A8C\u8BC1\u5931\u8D25: {fieldCount} \u4E2A\u5B57\u6BB5\u5F02\u5E38",
    en: "Schema validation failed: {fieldCount} field(s) invalid"
  },
  ["SCHEMA_6002" /* SCHEMA_PARSE_ERROR */]: {
    zh: "Schema \u89E3\u6790\u9519\u8BEF: {reason}",
    en: "Schema parse error: {reason}"
  },
  ["FAMILY_7001" /* FAMILY_MEMBER_NOT_FOUND */]: {
    zh: "\u5BB6\u5EAD\u6210\u5458\u4E0D\u5B58\u5728: {memberId}",
    en: "Family member not found: {memberId}"
  },
  ["FAMILY_7002" /* FAMILY_PROFILE_NOT_FOUND */]: {
    zh: "\u7528\u6237\u6863\u6848\u4E0D\u5B58\u5728: {userId}",
    en: "User profile not found: {userId}"
  }
};

// src/errors/index.ts
var currentLocale = "zh";
function setLocale(locale) {
  currentLocale = locale;
}
function getLocale() {
  return currentLocale;
}
var YYC3Error = class _YYC3Error extends Error {
  code;
  context;
  domain;
  cause;
  constructor(code, context = {}, cause) {
    const template = ERROR_MESSAGES[code];
    const msg = template ? renderMessage(template[currentLocale], context) : String(code);
    super(msg);
    this.name = "YYC3Error";
    this.code = code;
    this.context = context;
    this.domain = code.split("_")[0];
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _YYC3Error);
    }
  }
  get messageZh() {
    return renderMessage(ERROR_MESSAGES[this.code]?.zh || "", this.context);
  }
  get messageEn() {
    return renderMessage(ERROR_MESSAGES[this.code]?.en || "", this.context);
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      domain: this.domain,
      message: this.message,
      messageZh: this.messageZh,
      messageEn: this.messageEn,
      context: this.context
    };
  }
  static isYYC3Error(error) {
    return error instanceof _YYC3Error;
  }
  static fromError(error, fallbackCode) {
    if (error instanceof _YYC3Error) return error;
    const code = fallbackCode ?? "HUB_5002" /* HUB_EXECUTE_FAILED */;
    const cause = error instanceof Error ? error : new Error(String(error));
    return new _YYC3Error(code, { originalMessage: cause.message }, cause);
  }
};
function renderMessage(template, context) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = context[key];
    return val !== void 0 ? String(val) : `{${key}}`;
  });
}

// src/auth.ts
var YYC3Auth = class {
  config;
  provider = null;
  constructor(config = {}) {
    this.config = config;
  }
  async initialize() {
    const authType = this.config.authType || "auto";
    logger.info(`Initializing authentication with type: ${authType}`);
    if (authType === "auto") {
      this.provider = await this.autoDetect();
    } else if (authType === "openai") {
      this.provider = await this.initOpenAI();
    } else if (authType === "anthropic") {
      this.provider = await this.initAnthropic();
    } else {
      this.provider = await this.initOllama();
    }
    logger.info(`Authentication initialized successfully: ${this.provider?.type}`);
    return this.provider;
  }
  maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) return "***";
    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  }
  getOpenAIKey() {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      logger.debug(`Using OpenAI API Key: ${this.maskApiKey(apiKey)}`);
    }
    return apiKey;
  }
  getAnthropicKey() {
    const apiKey = this.config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      logger.debug(`Using Anthropic API Key: ${this.maskApiKey(apiKey)}`);
    }
    return apiKey;
  }
  async autoDetect() {
    if (process.env.OPENAI_API_KEY || this.config.apiKey) {
      return this.initOpenAI();
    }
    if (process.env.ANTHROPIC_API_KEY || this.config.anthropicApiKey) {
      return this.initAnthropic();
    }
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (response.ok) {
        return this.initOllama();
      }
    } catch {
    }
    throw new YYC3Error("AUTH_1001" /* AUTH_NO_PROVIDER */);
  }
  async initOpenAI() {
    const apiKey = this.getOpenAIKey();
    if (!apiKey) {
      throw new YYC3Error("AUTH_1002" /* AUTH_OPENAI_KEY_MISSING */);
    }
    const client = new OpenAI({ apiKey });
    return {
      type: "openai",
      client,
      modelMapping: {
        opus: this.config.modelMapping?.opus || "o1",
        sonnet: this.config.modelMapping?.sonnet || "gpt-4o",
        haiku: this.config.modelMapping?.haiku || "gpt-4o-mini"
      }
    };
  }
  async initAnthropic() {
    const apiKey = this.getAnthropicKey();
    if (!apiKey) {
      throw new YYC3Error("AUTH_1003" /* AUTH_ANTHROPIC_KEY_MISSING */);
    }
    return {
      type: "anthropic",
      client: null,
      modelMapping: {
        opus: this.config.modelMapping?.opus || "claude-opus-4-20250514",
        sonnet: this.config.modelMapping?.sonnet || "claude-sonnet-4-20250514",
        haiku: this.config.modelMapping?.haiku || "claude-3-5-haiku-20241022"
      }
    };
  }
  async initOllama() {
    const host = this.config.ollamaHost || "http://localhost:11434";
    return {
      type: "ollama",
      client: null,
      host,
      modelMapping: {
        opus: this.config.modelMapping?.opus || "llama3.1:70b",
        sonnet: this.config.modelMapping?.sonnet || "llama3.1:8b",
        haiku: this.config.modelMapping?.haiku || "llama3.2:3b"
      }
    };
  }
  getProvider() {
    if (!this.provider) {
      throw new YYC3Error("AUTH_1004" /* AUTH_NOT_INITIALIZED */);
    }
    return this.provider;
  }
  getModel(tier) {
    return this.getProvider().modelMapping[tier];
  }
};
var MCPServerMetadataSchema = z.object({
  displayName: z.string().max(128).optional(),
  category: z.string().max(64).optional(),
  description: z.string().max(512).optional(),
  vendor: z.string().max(64).optional(),
  repository: z.string().url().optional()
}).optional();
var MCPServerConfigSchema = z.object({
  command: z.string().min(1, "command \u4E0D\u80FD\u4E3A\u7A7A"),
  args: z.array(z.string()).max(32).optional(),
  env: z.record(z.string(), z.string()).optional(),
  metadata: MCPServerMetadataSchema
}).strict();

// src/schemas/index.ts
var ValidationError = class extends Error {
  code = "SCHEMA_6001";
  issues;
  constructor(issues) {
    super(`YYC\xB3 Schema \u9A8C\u8BC1\u5931\u8D25 (${issues.length} \u4E2A\u9519\u8BEF)`);
    this.name = "ValidationError";
    this.issues = issues;
  }
};
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => ({
        path: i.path.map((p) => String(p)).join("."),
        message: i.message
      }))
    );
  }
  return result.data;
}
var MCPServerImpl = class {
  constructor(id, config) {
    this.id = id;
    this.config = config;
  }
  id;
  config;
  process;
  status = "stopped";
  async start() {
    this.process = spawn(this.config.command, this.config.args || [], {
      env: { ...process.env, ...this.config.env },
      stdio: ["pipe", "pipe", "pipe"]
    });
    return new Promise((resolve, reject) => {
      this.process.on("spawn", () => {
        this.status = "running";
        resolve();
      });
      this.process.on("error", (err) => {
        this.status = "error";
        reject(new YYC3Error("MCP_4003" /* MCP_START_FAILED */, { id: this.id, reason: err.message }, err));
      });
    });
  }
  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = void 0;
      this.status = "stopped";
    }
  }
};
var MCPManager = class {
  servers = /* @__PURE__ */ new Map();
  async load(paths) {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }
  async loadFromPath(p) {
    if (!fs.existsSync(p)) {
      logger.warn(`MCP\u914D\u7F6E\u8DEF\u5F84\u4E0D\u5B58\u5728: ${p}`);
      return;
    }
    const content = fs.readFileSync(p, "utf-8");
    const config = JSON.parse(content);
    if (config.mcpServers) {
      for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
        const cfg = serverConfig;
        if (cfg.command && !id.startsWith("$") && id !== "_comment") {
          this.servers.set(id, new MCPServerImpl(id, cfg));
        }
      }
    }
  }
  register(id, config) {
    const validated = validate(MCPServerConfigSchema, config);
    this.servers.set(id, new MCPServerImpl(id, validated));
  }
  get(id) {
    return this.servers.get(id);
  }
  list() {
    return Array.from(this.servers.keys());
  }
  async startServer(id) {
    const server = this.servers.get(id);
    if (server) {
      await server.start();
    }
  }
  async stopServer(id) {
    const server = this.servers.get(id);
    if (server) {
      await server.stop();
    }
  }
  async startAll() {
    await Promise.all(
      Array.from(this.servers.values()).map((s) => s.start())
    );
  }
  async stopAll() {
    await Promise.all(
      Array.from(this.servers.values()).map((s) => s.stop())
    );
  }
  count() {
    return this.servers.size;
  }
  getByCategory(category) {
    return Array.from(this.servers.values()).filter((s) => s.config.metadata?.category === category);
  }
};
var SkillImpl = class {
  constructor(definition) {
    this.definition = definition;
    this.id = definition.id;
  }
  definition;
  id;
  async apply(context) {
    return `${this.definition.prompt}

## Context
${context}`;
  }
  matches(input) {
    if (typeof this.definition.trigger === "string") {
      return input.includes(this.definition.trigger);
    }
    return this.definition.trigger.test(input);
  }
};
var SkillManager = class {
  skills = /* @__PURE__ */ new Map();
  async load(paths) {
    for (const p of paths) {
      await this.loadFromPath(p);
    }
  }
  async loadFromPath(p) {
    if (!fs.existsSync(p)) {
      console.warn(`Skill\u8DEF\u5F84\u4E0D\u5B58\u5728: ${p}`);
      return;
    }
    const stats = fs.statSync(p);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(p, { recursive: true });
      for (const file of files) {
        if (file.endsWith(".md") && file.includes("SKILL")) {
          const content = fs.readFileSync(path.join(p, file), "utf-8");
          const skill = this.parseSkillMarkdown(content);
          if (skill) {
            this.skills.set(skill.id, new SkillImpl(skill));
          }
        }
      }
    }
  }
  parseSkillMarkdown(content) {
    const idMatch = content.match(/##\s+(.+)/);
    const descMatch = content.match(/\*\*描述\*\*[：:]\s*(.+)/);
    const triggerMatch = content.match(/\*\*触发\*\*[：:]\s*(.+)/);
    if (!idMatch) return null;
    return {
      id: idMatch[1].toLowerCase().replace(/\s+/g, "-"),
      name: idMatch[1],
      description: descMatch?.[1] || "",
      trigger: triggerMatch?.[1] || "",
      prompt: content
    };
  }
  register(definition) {
    this.skills.set(definition.id, new SkillImpl(definition));
  }
  get(id) {
    return this.skills.get(id);
  }
  list() {
    return Array.from(this.skills.keys());
  }
  findMatching(input) {
    return Array.from(this.skills.values()).filter((skill) => skill.matches(input));
  }
  count() {
    return this.skills.size;
  }
};

// src/hub.ts
var YYC3AIHub = class {
  constructor(config = {}) {
    this.config = config;
    this.coreAuth = new UnifiedAuthManager({
      preferLocal: false,
      autoDetect: true,
      openai: config.apiKey ? { apiKey: config.apiKey } : void 0,
      anthropic: config.anthropicApiKey ? { apiKey: config.anthropicApiKey } : void 0
    });
    this.auth = new YYC3Auth(config);
    this.agents = new AgentManager(this.auth);
    this.skills = new SkillManager();
    this.mcp = new MCPManager();
  }
  config;
  coreAuth;
  auth;
  agents;
  skills;
  mcp;
  initialized = false;
  async initialize() {
    logger.init("YYC\xB3 AI Hub \u521D\u59CB\u5316\u4E2D...");
    logger.step(1, "\u8BA4\u8BC1\u521D\u59CB\u5316 (core UnifiedAuthManager)");
    const providers = await this.coreAuth.autoDetect();
    logger.stat("Core Providers", String(providers.length));
    logger.step(2, "\u8BA4\u8BC1\u521D\u59CB\u5316 (hub auth)");
    await this.auth.initialize();
    logger.step(3, "\u52A0\u8F7DAgents");
    await this.agents.load([
      "./agents"
    ]);
    logger.step(4, "\u52A0\u8F7DSkills");
    await this.skills.load([
      "./skills"
    ]);
    logger.step(5, "\u52A0\u8F7DMCP\u670D\u52A1\u5668");
    await this.mcp.load([
      "./config/mcp-servers.json",
      "./config/vscode-mcp.json"
    ]);
    this.initialized = true;
    logger.done("YYC\xB3 AI Hub \u521D\u59CB\u5316\u5B8C\u6210");
    logger.stat("Agents", String(this.agents.count()));
    logger.stat("Skills", String(this.skills.count()));
    logger.stat("MCP Servers", String(this.mcp.count()));
  }
  async execute(task, options = { task }) {
    if (!this.initialized) {
      await this.initialize();
    }
    const startTime = Date.now();
    try {
      const context = await this.analyzeContext(task);
      const plan = await this.createPlan(context);
      const output = await this.executePlan(plan, options);
      return {
        success: true,
        output,
        metrics: {
          tokensUsed: 0,
          duration: Date.now() - startTime,
          agentCalls: plan.steps.length
        }
      };
    } catch (error) {
      const yyc3Error = YYC3Error.fromError(error, "HUB_5002" /* HUB_EXECUTE_FAILED */);
      return {
        success: false,
        output: "",
        errors: [yyc3Error.message],
        metrics: {
          tokensUsed: 0,
          duration: Date.now() - startTime,
          agentCalls: 0
        }
      };
    }
  }
  async analyzeContext(task) {
    const matchingSkills = this.skills.findMatching(task);
    return {
      task,
      matchingSkills: matchingSkills.map((s) => s.id),
      suggestedAgents: this.suggestAgents(task)
    };
  }
  suggestAgents(task) {
    return AgentRouter.route(task);
  }
  async createPlan(context) {
    return {
      steps: [
        { type: "analyze", context },
        { type: "execute", agent: context.suggestedAgents[0] || "general" },
        { type: "validate", skills: context.matchingSkills }
      ]
    };
  }
  async executePlan(plan, options) {
    const results = [];
    for (const step of plan.steps) {
      if (step.type === "execute" && step.agent) {
        const agent = this.agents.get(step.agent);
        if (agent) {
          const result = await agent.execute(options.task, options);
          results.push(result.output);
        }
      }
      if (step.type === "validate" && step.skills?.length) {
        const skillIds = step.skills;
        for (const skillId of skillIds) {
          const skill = this.skills.get(skillId);
          if (skill) {
            const result = await skill.apply(options.task);
            results.push(`[Skill: ${skillId}] ${result}`);
          }
        }
      }
    }
    return results.join("\n\n");
  }
  getAgents() {
    return this.agents.list();
  }
  getSkills() {
    return this.skills.list();
  }
  getMCPServers() {
    return this.mcp.list();
  }
  getAgentManager() {
    return this.agents;
  }
  getSkillManager() {
    return this.skills;
  }
  getMCPManager() {
    return this.mcp;
  }
  getAuth() {
    return this.auth;
  }
};

export { ValidationError, YYC3AIHub, YYC3Auth, YYC3Error, YYC3ErrorCode, YYC3_ERROR_DOMAINS, YYC3_ERROR_DOMAINS_EN, getLocale, setLocale };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map