/**
 * @file ai/SecurityScanner.ts
 * @description F2.4 智能安全扫描模块，对项目文件执行安全漏洞检测，
 *              覆盖 XSS / 注入 / 认证 / 敏感数据 / 依赖 / CSRF / 配置 / 加密 / 权限 / 供应链，
 *              每条规则产出 severity + CWE 编号 + OWASP 分类 + 修复建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,security,scanner,vulnerabilities,cwe,owasp
 */

// ===================================================================
//  SecurityScanner — F2.4 智能安全扫描模块
//  对项目文件执行安全漏洞检测, 覆盖:
//    XSS / 注入 / 认证 / 敏感数据 / 依赖 / CSRF /
//    配置 / 加密 / 权限 / 供应链
//  每条规则产出: severity + CWE 编号 + OWASP 分类 + 修复建议
// ===================================================================

// ── 类型定义 ──

export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";

export type SecurityCategory =
  | "xss" // 跨站脚本
  | "injection" // 注入攻击
  | "auth" // 认证/授权
  | "sensitive-data" // 敏感数据暴露
  | "dependency" // 依赖安全
  | "csrf" // 跨站请求伪造
  | "config" // 安全配置
  | "crypto" // 加密问题
  | "access-control" // 访问控制
  | "supply-chain"; // 供应链安全

export interface SecurityFinding {
  id: string;
  ruleId: string;
  filepath: string;
  line: number;
  column: number;
  severity: SecuritySeverity;
  category: SecurityCategory;
  title: string;
  description: string;
  /** CWE 编号 */
  cweId?: string;
  /** OWASP Top 10 分类 */
  owaspCategory?: string;
  /** 修复建议 */
  remediation: string;
  /** 修复代码示例 */
  codeExample?: {
    vulnerable: string;
    secure: string;
  };
  /** 是否可自动修复 */
  autoFixable: boolean;
  /** 自动修复内容 */
  autoFix?: {
    range: { startLine: number; endLine: number };
    replacement: string;
  };
}

export interface SecurityReport {
  filepath: string;
  findings: SecurityFinding[];
  riskScore: number; // 0-100, 0 = 最安全
  analyzedAt: number;
}

export interface ProjectSecurityReport {
  files: SecurityReport[];
  overallRiskScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  topFindings: SecurityFinding[];
  categoryBreakdown: Record<SecurityCategory, number>;
  analyzedAt: number;
}

// ── ID 生成 ──

let _secId = 0;
function nextSecId(): string {
  return `sec-${++_secId}-${Date.now().toString(36)}`;
}

// ── 规则定义 ──

interface SecurityRule {
  id: string;
  title: string;
  category: SecurityCategory;
  severity: SecuritySeverity;
  cweId?: string;
  owaspCategory?: string;
  fileExtensions: string[] | null; // null = all
  check: (
    filepath: string,
    content: string,
    lines: string[],
  ) => Omit<
    SecurityFinding,
    | "id"
    | "ruleId"
    | "filepath"
    | "category"
    | "severity"
    | "cweId"
    | "owaspCategory"
  >[];
}

// ===================================================================
//  安全扫描规则集
// ===================================================================

const SECURITY_RULES: SecurityRule[] = [
  // ─── XSS ───

  {
    id: "xss-dangerously-set-html",
    title: "使用 dangerouslySetInnerHTML",
    category: "xss",
    severity: "high",
    cweId: "CWE-79",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("dangerouslySetInnerHTML")) {
          const hasUserInput =
            /\buser|input|data|html|content|text|body|message\b/i.test(
              lines[i],
            );
          results.push({
            line: i + 1,
            column: lines[i].indexOf("dangerouslySetInnerHTML") + 1,
            title: "使用 dangerouslySetInnerHTML 可能导致 XSS",
            description: `dangerouslySetInnerHTML 直接将 HTML 注入 DOM，${hasUserInput ? "且包含可能来自用户输入的变量，" : ""}可能被攻击者利用注入恶意脚本。`,
            remediation:
              "使用安全的 HTML 渲染库如 DOMPurify 净化 HTML，或使用 React 的文本插值替代。",
            codeExample: {
              vulnerable: `<div dangerouslySetInnerHTML={{ __html: userContent }} />`,
              secure: `import DOMPurify from 'dompurify'\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "xss-innerhtml-assignment",
    title: "直接赋值 innerHTML",
    category: "xss",
    severity: "critical",
    cweId: "CWE-79",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (/\.innerHTML\s*=/.test(line) || /\.outerHTML\s*=/.test(line)) {
          results.push({
            line: i + 1,
            column: Math.max(1, line.indexOf("innerHTML")),
            title: "直接赋值 innerHTML/outerHTML 极易导致 XSS",
            description:
              "在 React 项目中直接操作 DOM innerHTML 绕过了 React 的 XSS 防护机制。",
            remediation:
              "使用 React 的状态管理和 JSX 渲染替代直接 DOM 操作。如必须使用，先用 DOMPurify 净化内容。",
            codeExample: {
              vulnerable: `element.innerHTML = userInput`,
              secure: `element.textContent = userInput\n// 或使用 React 状态更新`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "xss-url-javascript",
    title: "URL 中包含 javascript: 协议",
    category: "xss",
    severity: "critical",
    cweId: "CWE-79",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (
          /href\s*=\s*[{"`'].*javascript:/i.test(line) ||
          /window\.location\s*=.*javascript:/i.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "URL 中使用 javascript: 协议可导致 XSS",
            description: "javascript: 伪协议会在用户点击时执行任意脚本。",
            remediation:
              "验证 URL 协议白名单 (http/https)，禁止 javascript: 协议。",
            codeExample: {
              vulnerable: `<a href={userUrl}>Click</a>`,
              secure: `const safeUrl = /^https?:\\/\\//.test(userUrl) ? userUrl : '#'\n<a href={safeUrl}>Click</a>`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  // ─── 注入攻击 ───

  {
    id: "injection-eval",
    title: "使用 eval() 或 new Function()",
    category: "injection",
    severity: "critical",
    cweId: "CWE-94",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (/\beval\s*\(/.test(line)) {
          results.push({
            line: i + 1,
            column: Math.max(1, line.indexOf("eval")),
            title: "eval() 可执行任意代码，存在代码注入风险",
            description:
              "eval 将字符串作为代码执行，如果输入来自用户或外部数据源，攻击者可注入恶意代码。",
            remediation:
              "使用 JSON.parse() 解析数据，或使用安全的解析库替代 eval",
            codeExample: {
              vulnerable: `const result = eval(userExpression)`,
              secure: `// 使用安全的表达式解析库\nimport { evaluate } from 'mathjs'\nconst result = evaluate(userExpression)`,
            },
            autoFixable: false,
          });
        }
        if (/\bnew\s+Function\s*\(/.test(line)) {
          results.push({
            line: i + 1,
            column: Math.max(1, line.indexOf("new Function")),
            title: "new Function() 等同于 eval，存在代码注入风险",
            description:
              "Function 构造函数从字符串创建函数体，具有与 eval 相同的安全风险。",
            remediation: "避免动态创建函数。使用预定义的函数映射替代。",
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "injection-sql-template",
    title: "SQL 查询使用字符串拼接",
    category: "injection",
    severity: "critical",
    cweId: "CWE-89",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect query(`SELECT ... ${...}`) or query("SELECT ... " + ...)
        if (
          /(?:query|execute|raw)\s*\(\s*`[^`]*\$\{/.test(line) &&
          /SELECT|INSERT|UPDATE|DELETE|DROP/i.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "SQL 查询使用模板字符串拼接变量",
            description: "在 SQL 查询中拼接用户输入会导致 SQL 注入攻击。",
            remediation: "使用参数化查询或预编译语句。",
            codeExample: {
              vulnerable:
                "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
              secure: "db.query('SELECT * FROM users WHERE id = $1', [userId])",
            },
            autoFixable: false,
          });
        }
        if (
          /(?:query|execute)\s*\(\s*["'].*(?:SELECT|INSERT|UPDATE|DELETE)/i.test(
            line,
          ) &&
          /\+\s*\w/.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "SQL 查询使用字符串拼接",
            description: "字符串拼接 SQL 查询容易受到 SQL 注入攻击。",
            remediation: "使用参数化查询。",
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  // ─── 敏感数据暴露 ───

  {
    id: "sensitive-hardcoded-secret",
    title: "硬编码密钥或令牌",
    category: "sensitive-data",
    severity: "critical",
    cweId: "CWE-798",
    owaspCategory: "A07:2021-Identification and Authentication Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx", ".env"],
    check: (fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      // Skip .env.example files
      if (fp.includes(".example") || fp.includes(".sample")) return results;

      const SECRET_PATTERNS = [
        {
          pattern:
            /(?:api[_-]?key|apikey)\s*[:=]\s*["'`]([A-Za-z0-9_\-]{20,})["'`]/i,
          name: "API Key",
        },
        {
          pattern:
            /(?:secret|token|password|passwd|pwd)\s*[:=]\s*["'`]([A-Za-z0-9_\-]{8,})["'`]/i,
          name: "密钥/令牌",
        },
        { pattern: /\bsk[-_][A-Za-z0-9]{20,}/, name: "OpenAI/Stripe 密钥" },
        { pattern: /\bghp_[A-Za-z0-9]{36,}/, name: "GitHub Personal Token" },
        { pattern: /\bAIza[A-Za-z0-9_\-]{35}/, name: "Google API Key" },
        { pattern: /\bAKIA[A-Z0-9]{16,}/, name: "AWS Access Key" },
        { pattern: /\bxox[bpars]-[A-Za-z0-9\-]{10,}/, name: "Slack Token" },
        { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, name: "私钥" },
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.trimStart().startsWith("//") ||
          line.trimStart().startsWith("#")
        )
          continue;
        // Skip placeholder-like values (but not AWS keys with "example" in them)
        if (/\b(YOUR_|REPLACE_|PLACEHOLDER|xxx)\b/i.test(line)) continue;

        for (const { pattern, name } of SECRET_PATTERNS) {
          if (pattern.test(line)) {
            results.push({
              line: i + 1,
              column: 1,
              title: `检测到硬编码的 ${name}`,
              description: `代码中包含疑似 ${name} 的硬编码凭证。如果代码被推送到公开仓库，凭证会被泄露。`,
              remediation: `将凭证移到环境变量中，通过 process.env.${name.toUpperCase().replace(/[^A-Z]/g, "_")} 引用。`,
              codeExample: {
                vulnerable: `const apiKey = "sk-abc123..."`,
                secure: `const apiKey = process.env.API_KEY`,
              },
              autoFixable: false,
            });
            break; // One finding per line
          }
        }
      }
      return results;
    },
  },

  {
    id: "sensitive-console-secrets",
    title: "日志中输出敏感数据",
    category: "sensitive-data",
    severity: "medium",
    cweId: "CWE-532",
    owaspCategory: "A09:2021-Security Logging and Monitoring Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (/console\.(?:log|info|debug|warn)\s*\(/.test(line)) {
          if (
            /(?:password|token|secret|key|credential|auth|cookie|session)/i.test(
              line,
            )
          ) {
            results.push({
              line: i + 1,
              column: 1,
              title: "日志语句可能输出敏感数据",
              description:
                "console.log 输出包含 password/token/secret 等敏感字段的变量，可能在浏览器控制台泄露。",
              remediation:
                "移除生产环境日志，或确保不输出敏感数据。使用专用日志库并配置脱敏规则。",
              autoFixable: true,
              autoFix: {
                range: { startLine: i + 1, endLine: i + 1 },
                replacement: "",
              },
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "sensitive-localstorage",
    title: "LocalStorage 存储敏感数据",
    category: "sensitive-data",
    severity: "high",
    cweId: "CWE-922",
    owaspCategory: "A04:2021-Insecure Design",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (
          /localStorage\.setItem\s*\(/.test(line) ||
          /sessionStorage\.setItem\s*\(/.test(line)
        ) {
          if (
            /(?:token|password|secret|key|credential|auth|jwt|session)/i.test(
              line,
            )
          ) {
            results.push({
              line: i + 1,
              column: 1,
              title: "将敏感数据存储在 localStorage/sessionStorage",
              description:
                "localStorage 数据可被 XSS 攻击读取，不适合存储令牌、密码等敏感信息。",
              remediation:
                "使用 HttpOnly Cookie 存储 JWT/session token，或使用安全的客户端存储方案。",
              codeExample: {
                vulnerable: `localStorage.setItem('authToken', token)`,
                secure: `// 使用 HttpOnly Cookie (需后端配合)\n// 或使用安全的 session 管理库`,
              },
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 认证/授权 ───

  {
    id: "auth-weak-comparison",
    title: "使用弱比较进行身份验证",
    category: "auth",
    severity: "high",
    cweId: "CWE-287",
    owaspCategory: "A07:2021-Identification and Authentication Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect password/token comparison with == instead of ===
        if (/(?:password|token|secret|hash)\s*==\s*[^=]/.test(line)) {
          results.push({
            line: i + 1,
            column: 1,
            title: "使用 == 比较密码/令牌，应使用 === 或时间安全比较",
            description:
              "== 运算符在比较前会进行类型转换，可能导致认证绕过。此外，字符串比较容易受到时序攻击。",
            remediation:
              "使用 === 严格比较，对于服务端密码验证应使用 crypto.timingSafeEqual。",
            codeExample: {
              vulnerable: `if (inputToken == storedToken) { grant() }`,
              secure: `if (crypto.timingSafeEqual(\n  Buffer.from(inputToken),\n  Buffer.from(storedToken)\n)) { grant() }`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "auth-no-csrf-token",
    title: "表单缺少 CSRF 防护",
    category: "csrf",
    severity: "medium",
    cweId: "CWE-352",
    owaspCategory: "A01:2021-Broken Access Control",
    fileExtensions: [".tsx", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        if (
          /<form\b/.test(lines[i]) &&
          /method\s*=\s*["']post["']/i.test(lines[i])
        ) {
          // Check if form or surrounding code mentions csrf token
          const formBlock = lines
            .slice(i, Math.min(i + 20, lines.length))
            .join("\n");
          if (!/csrf|_token|xsrf|anti.?forgery/i.test(formBlock)) {
            results.push({
              line: i + 1,
              column: 1,
              title: "POST 表单缺少 CSRF Token",
              description:
                "没有 CSRF 防护的 POST 表单可能被跨站攻击利用，代替用户提交恶意请求。",
              remediation:
                "添加 CSRF Token 隐藏字段，或使用带 CSRF 保护的 HTTP 客户端。",
              codeExample: {
                vulnerable: `<form method="post" action="/api/transfer">\n  <input name="amount" />\n</form>`,
                secure: `<form method="post" action="/api/transfer">\n  <input type="hidden" name="_csrf" value={csrfToken} />\n  <input name="amount" />\n</form>`,
              },
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 加密问题 ───

  {
    id: "crypto-weak-hash",
    title: "使用弱哈希算法",
    category: "crypto",
    severity: "high",
    cweId: "CWE-327",
    owaspCategory: "A02:2021-Cryptographic Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (/createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/.test(line)) {
          const algo = line.includes("md5") ? "MD5" : "SHA-1";
          results.push({
            line: i + 1,
            column: 1,
            title: `使用弱哈希算法 ${algo}`,
            description: `${algo} 存在已知碰撞攻击，不应用于安全敏感场景（密码存储、数字签名等）。`,
            remediation:
              "使用 SHA-256 或更强的算法。密码存储应使用 bcrypt/argon2。",
            codeExample: {
              vulnerable: `crypto.createHash('md5').update(data).digest('hex')`,
              secure: `crypto.createHash('sha256').update(data).digest('hex')\n// 密码存储使用: bcrypt.hash(password, 12)`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "crypto-math-random",
    title: "使用 Math.random() 生成安全相关值",
    category: "crypto",
    severity: "medium",
    cweId: "CWE-338",
    owaspCategory: "A02:2021-Cryptographic Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (/Math\.random\s*\(\s*\)/.test(line)) {
          // Check if used in security context (excluding non-security uses like delays)
          if (
            /(?:token|key|secret|password|nonce|salt|uuid|session|random_id|random_string|random_bytes)/i.test(
              line,
            ) &&
            !/(?:delay|timeout|animation|duration|interval|timer)/i.test(line)
          ) {
            results.push({
              line: i + 1,
              column: Math.max(1, line.indexOf("Math.random")),
              title: "Math.random() 不是密码学安全的随机数生成器",
              description:
                "Math.random() 的输出可被预测，不应用于生成令牌、密钥、会话ID等安全相关值。",
              remediation:
                "使用 crypto.randomUUID() 或 crypto.getRandomValues() 生成安全随机值。",
              codeExample: {
                vulnerable: `const token = Math.random().toString(36)`,
                secure: `const token = crypto.randomUUID()`,
              },
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 安全配置 ───

  {
    id: "config-cors-wildcard",
    title: "CORS 配置允许任意来源",
    category: "config",
    severity: "medium",
    cweId: "CWE-942",
    owaspCategory: "A05:2021-Security Misconfiguration",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (
          /(?:Access-Control-Allow-Origin|cors)\s*[:=].*['"]\*['"]/.test(
            line,
          ) ||
          /origin\s*:\s*['"]\*['"]/.test(line) ||
          /origin\s*:\s*true/.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "CORS 配置允许所有来源 (*)",
            description:
              "Access-Control-Allow-Origin: * 允许任意网站发起跨域请求，可能导致数据泄露。",
            remediation: "配置具体的允许来源列表，不要使用通配符。",
            codeExample: {
              vulnerable: `cors({ origin: '*' })`,
              secure: `cors({ origin: ['https://yourdomain.com'] })`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "config-http-no-https",
    title: "使用不安全的 HTTP 链接",
    category: "config",
    severity: "low",
    cweId: "CWE-319",
    owaspCategory: "A02:2021-Cryptographic Failures",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect http:// URLs in fetch/axios/API calls (not localhost)
        const match = line.match(
          /["'`](http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^\s"'`]+)["'`]/,
        );
        if (match && /fetch|axios|api|url|endpoint|href|src/i.test(line)) {
          results.push({
            line: i + 1,
            column: 1,
            title: "API 调用使用不安全的 HTTP 协议",
            description: "HTTP 明文传输数据，可被中间人攻击窃听和篡改。",
            remediation: "将 http:// 替换为 https://。",
            autoFixable: true,
            autoFix: {
              range: { startLine: i + 1, endLine: i + 1 },
              replacement: line.replace("http://", "https://"),
            },
          });
        }
      }
      return results;
    },
  },

  // ─── 访问控制 ───

  {
    id: "access-open-redirect",
    title: "未验证的重定向",
    category: "access-control",
    severity: "medium",
    cweId: "CWE-601",
    owaspCategory: "A01:2021-Broken Access Control",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // window.location = userInput  /  location.href = param
        if (/(?:window\.)?location(?:\.href)?\s*=\s*(?!['"`])/.test(line)) {
          // Check if value comes from user input (params, query, input)
          if (
            /(?:param|query|search|input|url|redirect|return|next|goto)/i.test(
              line,
            )
          ) {
            results.push({
              line: i + 1,
              column: 1,
              title: "未验证的 URL 重定向",
              description:
                "将用户输入直接用于重定向可导致开放重定向攻击，被用于钓鱼。",
              remediation:
                "验证重定向 URL 是否在允许的域名白名单内，或仅使用相对路径。",
              codeExample: {
                vulnerable: `window.location.href = req.query.redirectUrl`,
                secure: `const allowed = ['/dashboard', '/profile']\nif (allowed.includes(redirectUrl)) {\n  window.location.href = redirectUrl\n}`,
              },
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "access-debug-enabled",
    title: "生产环境调试模式未关闭",
    category: "access-control",
    severity: "low",
    cweId: "CWE-489",
    owaspCategory: "A05:2021-Security Misconfiguration",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (
          /debug\s*[:=]\s*true/.test(line) ||
          /DEBUG_MODE\s*=\s*true/.test(line) ||
          /enableDebug\s*=\s*true/.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "调试模式硬编码为 true",
            description:
              "调试模式可能暴露详细错误信息和内部状态，应在生产环境中禁用。",
            remediation:
              "使用环境变量控制调试模式: debug: process.env.NODE_ENV === 'development'",
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  // ─── 依赖安全 ───

  {
    id: "dep-prototype-pollution",
    title: "潜在的原型链污染",
    category: "dependency",
    severity: "high",
    cweId: "CWE-1321",
    owaspCategory: "A06:2021-Vulnerable and Outdated Components",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect obj[userInput] = value patterns
        if (
          /\w+\[\s*(?:key|prop|field|name|attr|input|param)\s*\]\s*=/.test(line)
        ) {
          results.push({
            line: i + 1,
            column: 1,
            title: "动态属性赋值可能导致原型链污染",
            description:
              "使用用户输入作为对象属性名可能污染 Object.prototype，影响整个应用。",
            remediation:
              "验证属性名不是 __proto__、constructor 或 prototype，或使用 Map 替代普通对象。",
            codeExample: {
              vulnerable: `obj[userKey] = userValue`,
              secure: `if (!['__proto__', 'constructor', 'prototype'].includes(userKey)) {\n  obj[userKey] = userValue\n}`,
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "dep-postmessage-no-origin",
    title: "postMessage 未验证来源",
    category: "dependency",
    severity: "high",
    cweId: "CWE-346",
    owaspCategory: "A01:2021-Broken Access Control",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;

        // postMessage with '*' target
        if (/\.postMessage\s*\([^)]*,\s*["']\*["']\s*\)/.test(line)) {
          results.push({
            line: i + 1,
            column: 1,
            title: "postMessage 目标为 '*'，数据可能泄露给恶意 iframe",
            description:
              "postMessage 使用 '*' 作为 targetOrigin 会将消息发送给任意窗口。",
            remediation:
              "指定确切的 targetOrigin，如 'https://trusted-domain.com'。",
            autoFixable: false,
          });
        }

        // addEventListener('message', ...) without origin check
        if (/addEventListener\s*\(\s*["']message["']/.test(line)) {
          const handlerBlock = lines
            .slice(i, Math.min(i + 10, lines.length))
            .join("\n");
          if (!/event\.origin|e\.origin|origin\s*[!=]==/.test(handlerBlock)) {
            results.push({
              line: i + 1,
              column: 1,
              title: "message 事件监听器未验证 event.origin",
              description:
                "不验证消息来源的 postMessage 监听器可能处理来自恶意页面的消息。",
              remediation: "在处理 message 事件前检查 event.origin。",
              codeExample: {
                vulnerable: `window.addEventListener('message', (e) => {\n  processData(e.data)\n})`,
                secure: `window.addEventListener('message', (e) => {\n  if (e.origin !== 'https://trusted.com') return\n  processData(e.data)\n})`,
              },
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 供应链安全 ───

  {
    id: "supply-unpinned-deps",
    title: "依赖版本未锁定",
    category: "supply-chain",
    severity: "info",
    cweId: "CWE-829",
    owaspCategory: "A06:2021-Vulnerable and Outdated Components",
    fileExtensions: null,
    check: (fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      if (!fp.endsWith("package.json")) return results;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect "dep": "^1.0.0" or "*" or "latest"
        const match = line.match(/"([^"]+)"\s*:\s*"(\^|~|>|>=|\*|latest|next)/);
        if (
          match &&
          !/"devDependencies"/.test(lines.slice(Math.max(0, i - 5), i).join(""))
        ) {
          const [, dep, prefix] = match;
          if (prefix === "*" || prefix === "latest" || prefix === "next") {
            results.push({
              line: i + 1,
              column: 1,
              title: `依赖 \`${dep}\` 使用不安全的版本范围 "${prefix}"`,
              description: "限定版本可能自动安装包含漏洞或恶意代码的新版本。",
              remediation: "锁定到具体版本号，使用 lock 文件确保可复现构建。",
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  // ─── 额外的安全模式检测 ───

  {
    id: "xss-document-write",
    title: "使用 document.write",
    category: "xss",
    severity: "high",
    cweId: "CWE-79",
    owaspCategory: "A03:2021-Injection",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (
          /document\.write\s*\(/.test(line) ||
          /document\.writeln\s*\(/.test(line)
        ) {
          results.push({
            line: i + 1,
            column: Math.max(1, line.indexOf("document.write")),
            title: "document.write() 可被利用进行 XSS 攻击",
            description:
              "document.write 在加载后调用会覆盖页面内容，且不经过任何净化。",
            remediation:
              "使用 DOM API (textContent, createElement) 或 React 状态管理替代。",
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },

  {
    id: "sensitive-error-leak",
    title: "错误响应可能泄露内部信息",
    category: "sensitive-data",
    severity: "low",
    cweId: "CWE-209",
    owaspCategory: "A04:2021-Insecure Design",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect catch blocks that expose error.stack or error.message to response/render
        if (/catch\s*\(/.test(line)) {
          const catchBlock = lines
            .slice(i, Math.min(i + 8, lines.length))
            .join("\n");
          if (
            /(?:res\.(?:json|send)|setState|setError|response)\s*\(.*(?:err|error)\.(?:stack|message)/i.test(
              catchBlock,
            )
          ) {
            results.push({
              line: i + 1,
              column: 1,
              title: "将内部错误详情暴露给用户/客户端",
              description:
                "错误堆栈或详细错误信息可能泄露文件路径、数据库结构等内部信息。",
              remediation:
                "向用户展示通用错误信息，将详细错误仅记录到服务端日志。",
              autoFixable: false,
            });
          }
        }
      }
      return results;
    },
  },

  {
    id: "config-unsafe-regex",
    title: "可能导致 ReDoS 的正则表达式",
    category: "config",
    severity: "medium",
    cweId: "CWE-1333",
    owaspCategory: "A05:2021-Security Misconfiguration",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx"],
    check: (_fp, _content, lines) => {
      const results: ReturnType<SecurityRule["check"]> = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        // Detect new RegExp(userInput) — user-controlled regex
        if (/new\s+RegExp\s*\(\s*(?!['"`\/])/.test(line)) {
          results.push({
            line: i + 1,
            column: 1,
            title: "使用用户输入构建正则表达式可能导致 ReDoS",
            description:
              "用户提供的正则表达式可能包含指数回溯模式，导致服务拒绝。",
            remediation:
              "对用户输入使用 escapeRegExp 转义特殊字符，或限制正则表达式复杂度。",
            codeExample: {
              vulnerable: `const re = new RegExp(userInput)`,
              secure:
                "const escaped = userInput.replace(/[.*+?^${}()|[\\\\]\\\\]/g, '\\\\$&')\nconst re = new RegExp(escaped)",
            },
            autoFixable: false,
          });
        }
      }
      return results;
    },
  },
];

// ===================================================================
//  分析入口
// ===================================================================

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function getExtension(filepath: string): string {
  const dot = filepath.lastIndexOf(".");
  return dot >= 0 ? filepath.slice(dot) : "";
}

function isAnalyzable(filepath: string): boolean {
  const ext = getExtension(filepath);
  return (
    CODE_EXTENSIONS.has(ext) ||
    filepath.endsWith("package.json") ||
    filepath.endsWith(".env")
  );
}

/** 扫描单个文件的安全问题 */
export function scanFile(filepath: string, content: string): SecurityReport {
  if (!isAnalyzable(filepath)) {
    return { filepath, findings: [], riskScore: 0, analyzedAt: Date.now() };
  }

  const lines = content.split("\n");
  const ext = getExtension(filepath);
  const findings: SecurityFinding[] = [];

  for (const rule of SECURITY_RULES) {
    if (
      rule.fileExtensions &&
      !rule.fileExtensions.includes(ext) &&
      !filepath.endsWith("package.json")
    )
      continue;

    try {
      const results = rule.check(filepath, content, lines);
      for (const r of results) {
        findings.push({
          ...r,
          id: nextSecId(),
          ruleId: rule.id,
          filepath,
          category: rule.category,
          severity: rule.severity,
          cweId: rule.cweId,
          owaspCategory: rule.owaspCategory,
        });
      }
    } catch {
      // Rule error — skip
    }
  }

  // Sort: critical > high > medium > low > info
  const severityOrder: Record<SecuritySeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  findings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  // Risk score: 0 = safe, higher = riskier
  const scoreMap: Record<SecuritySeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 1,
  };
  let riskScore = 0;
  for (const f of findings) {
    riskScore += scoreMap[f.severity];
  }
  riskScore = Math.min(100, riskScore);

  return { filepath, findings, riskScore, analyzedAt: Date.now() };
}

/** 扫描整个项目的安全问题 */
export function scanProject(
  fileContents: Record<string, string>,
): ProjectSecurityReport {
  const files: SecurityReport[] = [];
  const categoryBreakdown: Record<SecurityCategory, number> = {
    xss: 0,
    injection: 0,
    auth: 0,
    "sensitive-data": 0,
    dependency: 0,
    csrf: 0,
    config: 0,
    crypto: 0,
    "access-control": 0,
    "supply-chain": 0,
  };
  let criticalCount = 0,
    highCount = 0,
    mediumCount = 0,
    lowCount = 0,
    infoCount = 0;

  for (const [filepath, content] of Object.entries(fileContents)) {
    if (!isAnalyzable(filepath)) continue;
    if (content.length > 100000) continue; // Skip very large files

    const report = scanFile(filepath, content);
    if (report.findings.length > 0) {
      files.push(report);
      for (const f of report.findings) {
        categoryBreakdown[f.category]++;
        switch (f.severity) {
          case "critical":
            criticalCount++;
            break;
          case "high":
            highCount++;
            break;
          case "medium":
            mediumCount++;
            break;
          case "low":
            lowCount++;
            break;
          case "info":
            infoCount++;
            break;
        }
      }
    }
  }

  const overallRiskScore =
    files.length > 0
      ? Math.round(
          files.reduce((sum, f) => sum + f.riskScore, 0) / files.length,
        )
      : 0;

  const topFindings = files
    .flatMap((f) => f.findings)
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 10);

  return {
    files,
    overallRiskScore,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    topFindings,
    categoryBreakdown,
    analyzedAt: Date.now(),
  };
}

/** 应用自动修复 */
export function applySecurityFix(
  content: string,
  fix: { range: { startLine: number; endLine: number }; replacement: string },
): string {
  const lines = content.split("\n");
  const before = lines.slice(0, fix.range.startLine - 1);
  const after = lines.slice(fix.range.endLine);
  if (fix.replacement) {
    return [...before, fix.replacement, ...after].join("\n");
  }
  return [...before, ...after].join("\n");
}

/** 构建 AI 修复 prompt 上下文 */
export function buildSecurityFixPrompt(
  finding: SecurityFinding,
  fileContent: string,
): string {
  const lines = fileContent.split("\n");
  const start = Math.max(0, finding.line - 4);
  const end = Math.min(lines.length, finding.line + 4);
  const snippet = lines
    .slice(start, end)
    .map((l, i) => `${start + i + 1}| ${l}`)
    .join("\n");

  return `## 安全漏洞修复请求

**文件**: ${finding.filepath}
**行号**: ${finding.line}
**严重度**: ${finding.severity.toUpperCase()}
**规则**: ${finding.ruleId}
**分类**: ${finding.category}
${finding.cweId ? `**CWE**: ${finding.cweId}` : ""}
${finding.owaspCategory ? `**OWASP**: ${finding.owaspCategory}` : ""}

**问题**: ${finding.title}

**详情**: ${finding.description}

**修复建议**: ${finding.remediation}

### 代码片段:
\`\`\`
${snippet}
\`\`\`
${
  finding.codeExample
    ? `
### 安全的写法示例:
\`\`\`
${finding.codeExample.secure}
\`\`\`
`
    : ""
}
请修复该安全漏洞，输出修改后的完整文件内容。确保修复不影响现有功能。`;
}

/** 获取所有安全规则描述 */
export function getSecurityRuleDescriptions(): {
  id: string;
  title: string;
  category: SecurityCategory;
  severity: SecuritySeverity;
  cweId?: string;
  owaspCategory?: string;
}[] {
  return SECURITY_RULES.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    severity: r.severity,
    cweId: r.cweId,
    owaspCategory: r.owaspCategory,
  }));
}
