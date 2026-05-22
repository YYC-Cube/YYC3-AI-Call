/**
 * @file NLCommandService.ts
 * @description 自然语言命令转换服务 - 将自然语言转换为终端命令
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status mvp
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags nlp,terminal,command,ai,natural-language
 */

import { createLogger } from "../utils/logger";
const log = createLogger("NLCommand");

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  template: string;
  params: string[];
  category: "file" | "git" | "npm" | "system" | "docker" | "k8s";
  examples: string[];
}

export interface NLCommandResult {
  success: boolean;
  command?: string;
  explanation?: string;
  confidence?: number;
  error?: string;
}

export interface CommandCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * 自然语言命令转换服务
 */
export class NLCommandService {
  private templates: Map<string, CommandTemplate> = new Map();
  private categories: Map<string, CommandCategory> = new Map();

  constructor() {
    this.loadBuiltInTemplates();
    this.loadCategories();
  }

  /**
   * 加载命令分类
   */
  private loadCategories(): void {
    this.categories.set("file", {
      id: "file",
      name: "文件操作",
      icon: "📁",
      color: "#3b82f6",
    });

    this.categories.set("git", {
      id: "git",
      name: "Git 操作",
      icon: "🔀",
      color: "#f97316",
    });

    this.categories.set("npm", {
      id: "npm",
      name: "NPM 操作",
      icon: "📦",
      color: "#ef4444",
    });

    this.categories.set("system", {
      id: "system",
      name: "系统命令",
      icon: "💻",
      color: "#10b981",
    });

    this.categories.set("docker", {
      id: "docker",
      name: "Docker",
      icon: "🐳",
      color: "#06b6d4",
    });

    this.categories.set("k8s", {
      id: "k8s",
      name: "Kubernetes",
      icon: "☸️",
      color: "#3b82f6",
    });
  }

  /**
   * 加载内置命令模板
   */
  private loadBuiltInTemplates(): void {
    // === 文件操作 ===
    this.addTemplate({
      id: "list-files",
      name: "列出文件",
      description: "列出目录中的文件",
      patterns: [
        "列出文件",
        "显示文件",
        "查看文件",
        "list files",
        "show files",
        "有什么文件",
        "目录下有什么",
      ],
      template: "ls -la{{#path}} {{path}}{{/path}}",
      params: ["path"],
      category: "file",
      examples: ["列出当前目录的文件", "列出 src 目录的文件"],
    });

    this.addTemplate({
      id: "create-file",
      name: "创建文件",
      description: "创建新文件",
      patterns: [
        "创建文件",
        "新建文件",
        "生成文件",
        "create file",
        "new file",
        "touch",
      ],
      template: "touch {{filename}}",
      params: ["filename"],
      category: "file",
      examples: ["创建一个新文件 test.txt", "新建文件 README.md"],
    });

    this.addTemplate({
      id: "delete-file",
      name: "删除文件",
      description: "删除文件",
      patterns: [
        "删除文件",
        "移除文件",
        "删掉",
        "delete file",
        "remove file",
        "rm",
      ],
      template: "rm {{filename}}",
      params: ["filename"],
      category: "file",
      examples: ["删除文件 test.txt", "移除旧文件"],
    });

    this.addTemplate({
      id: "copy-file",
      name: "复制文件",
      description: "复制文件",
      patterns: [
        "复制文件",
        "拷贝文件",
        "cp",
        "copy file",
        "duplicate",
      ],
      template: "cp {{source}} {{destination}}",
      params: ["source", "destination"],
      category: "file",
      examples: ["复制文件 a.txt 到 b.txt", "拷贝 src 到 dist"],
    });

    this.addTemplate({
      id: "move-file",
      name: "移动文件",
      description: "移动/重命名文件",
      patterns: [
        "移动文件",
        "重命名",
        "mv",
        "move file",
        "rename",
      ],
      template: "mv {{source}} {{destination}}",
      params: ["source", "destination"],
      category: "file",
      examples: ["移动文件 a.txt 到 b.txt", "重命名 old.js 为 new.js"],
    });

    this.addTemplate({
      id: "view-file",
      name: "查看文件内容",
      description: "查看文件内容",
      patterns: [
        "查看文件",
        "显示内容",
        "cat",
        "view file",
        "show content",
        "读取文件",
      ],
      template: "cat {{filename}}",
      params: ["filename"],
      category: "file",
      examples: ["查看文件 package.json", "显示 README.md 的内容"],
    });

    // === Git 操作 ===
    this.addTemplate({
      id: "git-status",
      name: "Git 状态",
      description: "查看 Git 状态",
      patterns: [
        "git 状态",
        "git status",
        "查看 git 状态",
        "代码状态",
        "有什么改动",
      ],
      template: "git status",
      params: [],
      category: "git",
      examples: ["查看 git 状态", "git status"],
    });

    this.addTemplate({
      id: "git-add",
      name: "Git 添加",
      description: "添加文件到暂存区",
      patterns: [
        "git add",
        "添加文件",
        "暂存",
        "stage",
        "git add .",
        "全部添加",
      ],
      template: "git add{{#file}} {{file}}{{/file}}{{^file}} .{{/file}}",
      params: ["file"],
      category: "git",
      examples: ["git add", "添加所有文件", "添加文件 src/app.tsx"],
    });

    this.addTemplate({
      id: "git-commit",
      name: "Git 提交",
      description: "提交更改",
      patterns: [
        "git commit",
        "提交",
        "commit",
        "提交代码",
        "保存更改",
      ],
      template: "git commit -m \"{{message}}\"",
      params: ["message"],
      category: "git",
      examples: ["提交代码，消息：添加登录功能", "commit: 修复 bug"],
    });

    this.addTemplate({
      id: "git-push",
      name: "Git 推送",
      description: "推送到远程仓库",
      patterns: [
        "git push",
        "推送",
        "push",
        "上传代码",
        "推送到远程",
      ],
      template: "git push{{#remote}} {{remote}}{{/remote}}{{^remote}} origin{{/remote}}{{#branch}} {{branch}}{{/branch}}{{^branch}} main{{/branch}}",
      params: ["remote", "branch"],
      category: "git",
      examples: ["git push", "推送到远程", "推送到 origin main"],
    });

    this.addTemplate({
      id: "git-pull",
      name: "Git 拉取",
      description: "从远程拉取",
      patterns: [
        "git pull",
        "拉取",
        "pull",
        "下载代码",
        "从远程拉取",
      ],
      template: "git pull{{#remote}} {{remote}}{{/remote}}{{^remote}} origin{{/remote}}{{#branch}} {{branch}}{{/branch}}{{^branch}} main{{/branch}}",
      params: ["remote", "branch"],
      category: "git",
      examples: ["git pull", "拉取最新代码", "从 origin 拉取"],
    });

    this.addTemplate({
      id: "git-log",
      name: "Git 日志",
      description: "查看提交历史",
      patterns: [
        "git log",
        "查看日志",
        "提交历史",
        "git history",
        "历史记录",
      ],
      template: "git log --oneline{{#limit}} -n {{limit}}{{/limit}}",
      params: ["limit"],
      category: "git",
      examples: ["查看 git 日志", "查看最近 10 条提交", "git log"],
    });

    this.addTemplate({
      id: "git-branch",
      name: "Git 分支",
      description: "查看/创建分支",
      patterns: [
        "git branch",
        "分支",
        "branch",
        "查看分支",
        "创建分支",
      ],
      template: "git branch{{#name}} {{name}}{{/name}}{{^name}} -a{{/name}}",
      params: ["name"],
      category: "git",
      examples: ["查看分支", "创建新分支 feature", "git branch"],
    });

    this.addTemplate({
      id: "git-checkout",
      name: "Git 切换",
      description: "切换分支",
      patterns: [
        "git checkout",
        "切换分支",
        "checkout",
        "切换到",
        "switch",
      ],
      template: "git checkout {{branch}}",
      params: ["branch"],
      category: "git",
      examples: ["切换到 main 分支", "checkout develop", "切换到分支 feature"],
    });

    this.addTemplate({
      id: "git-diff",
      name: "Git 差异",
      description: "查看代码差异",
      patterns: [
        "git diff",
        "查看差异",
        "diff",
        "有什么不同",
        "改动",
      ],
      template: "git diff{{#target}} {{target}}{{/target}}",
      params: ["target"],
      category: "git",
      examples: ["查看差异", "git diff", "查看与 main 的差异"],
    });

    // === NPM 操作 ===
    this.addTemplate({
      id: "npm-install",
      name: "NPM 安装",
      description: "安装包",
      patterns: [
        "npm install",
        "安装包",
        "npm i",
        "install",
        "添加依赖",
        "下载包",
      ],
      template: "npm install{{#package}} {{package}}{{/package}}{{#dev}} --save-dev{{/dev}}",
      params: ["package", "dev"],
      category: "npm",
      examples: ["安装 lodash", "npm install react", "添加开发依赖 eslint"],
    });

    this.addTemplate({
      id: "npm-uninstall",
      name: "NPM 卸载",
      description: "卸载包",
      patterns: [
        "npm uninstall",
        "卸载包",
        "卸载",
        "remove",
        "删除依赖",
      ],
      template: "npm uninstall {{package}}",
      params: ["package"],
      category: "npm",
      examples: ["卸载 lodash", "npm uninstall react", "删除包"],
    });

    this.addTemplate({
      id: "npm-run",
      name: "NPM 运行",
      description: "运行脚本",
      patterns: [
        "npm run",
        "运行",
        "run",
        "执行脚本",
        "启动",
      ],
      template: "npm run {{script}}",
      params: ["script"],
      category: "npm",
      examples: ["运行 dev", "npm run build", "启动开发服务器"],
    });

    this.addTemplate({
      id: "npm-test",
      name: "NPM 测试",
      description: "运行测试",
      patterns: [
        "npm test",
        "测试",
        "test",
        "运行测试",
        "执行测试",
      ],
      template: "npm test{{#pattern}} -- {{pattern}}{{/pattern}}",
      params: ["pattern"],
      category: "npm",
      examples: ["运行测试", "npm test", "测试文件 App.test.tsx"],
    });

    this.addTemplate({
      id: "npm-build",
      name: "NPM 构建",
      description: "构建项目",
      patterns: [
        "npm build",
        "构建",
        "build",
        "编译",
        "打包",
      ],
      template: "npm run build",
      params: [],
      category: "npm",
      examples: ["构建项目", "npm build", "打包"],
    });

    this.addTemplate({
      id: "npm-start",
      name: "NPM 启动",
      description: "启动项目",
      patterns: [
        "npm start",
        "启动",
        "start",
        "运行项目",
        "启动服务",
      ],
      template: "npm start",
      params: [],
      category: "npm",
      examples: ["启动项目", "npm start", "运行服务"],
    });

    // === 系统命令 ===
    this.addTemplate({
      id: "pwd",
      name: "当前目录",
      description: "显示当前工作目录",
      patterns: [
        "pwd",
        "当前目录",
        "在哪里",
        "where",
        "什么路径",
      ],
      template: "pwd",
      params: [],
      category: "system",
      examples: ["当前目录", "pwd", "我在哪里"],
    });

    this.addTemplate({
      id: "cd",
      name: "切换目录",
      description: "切换工作目录",
      patterns: [
        "cd",
        "切换目录",
        "进入目录",
        "change directory",
        "go to",
      ],
      template: "cd {{path}}",
      params: ["path"],
      category: "system",
      examples: ["cd src", "切换到 src 目录", "进入 app 文件夹"],
    });

    this.addTemplate({
      id: "mkdir",
      name: "创建目录",
      description: "创建新目录",
      patterns: [
        "mkdir",
        "创建目录",
        "新建文件夹",
        "create directory",
        "make directory",
      ],
      template: "mkdir -p {{name}}",
      params: ["name"],
      category: "system",
      examples: ["创建目录 src", "新建文件夹 components", "mkdir utils"],
    });

    this.addTemplate({
      id: "clear",
      name: "清屏",
      description: "清空终端屏幕",
      patterns: [
        "clear",
        "清屏",
        "清空",
        "cls",
        "清除屏幕",
      ],
      template: "clear",
      params: [],
      category: "system",
      examples: ["清屏", "clear", "清空终端"],
    });

    this.addTemplate({
      id: "echo",
      name: "输出文本",
      description: "输出文本到终端",
      patterns: [
        "echo",
        "输出",
        "显示",
        "print",
        "打印",
      ],
      template: "echo \"{{text}}\"",
      params: ["text"],
      category: "system",
      examples: ["输出 Hello", "echo Hello World", "打印测试"],
    });

    this.addTemplate({
      id: "grep",
      name: "搜索文本",
      description: "在文件中搜索文本",
      patterns: [
        "grep",
        "搜索",
        "查找",
        "search",
        "find text",
      ],
      template: "grep -r \"{{pattern}}\"{{#file}} {{file}}{{/file}}",
      params: ["pattern", "file"],
      category: "system",
      examples: ["搜索 console", "grep error", "在 src 中查找 function"],
    });

    this.addTemplate({
      id: "wc",
      name: "统计",
      description: "统计行数/词数",
      patterns: [
        "wc",
        "统计",
        "多少行",
        "count",
        "行数",
      ],
      template: "wc -l{{#file}} {{file}}{{/file}}",
      params: ["file"],
      category: "system",
      examples: ["统计行数", "wc -l", "多少行代码"],
    });

    // === Docker ===
    this.addTemplate({
      id: "docker-ps",
      name: "Docker 容器",
      description: "查看运行中的容器",
      patterns: [
        "docker ps",
        "容器列表",
        "运行中的容器",
        "docker containers",
      ],
      template: "docker ps{{#all}} -a{{/all}}",
      params: ["all"],
      category: "docker",
      examples: ["docker ps", "查看容器", "查看所有容器"],
    });

    this.addTemplate({
      id: "docker-images",
      name: "Docker 镜像",
      description: "查看镜像列表",
      patterns: [
        "docker images",
        "镜像列表",
        "查看镜像",
        "docker image ls",
      ],
      template: "docker images",
      params: [],
      category: "docker",
      examples: ["docker images", "查看镜像", "镜像列表"],
    });

    this.addTemplate({
      id: "docker-build",
      name: "Docker 构建",
      description: "构建 Docker 镜像",
      patterns: [
        "docker build",
        "构建镜像",
        "docker build",
        "build docker",
      ],
      template: "docker build -t {{tag}} .",
      params: ["tag"],
      category: "docker",
      examples: ["构建镜像 myapp", "docker build -t app", "构建 Docker"],
    });

    this.addTemplate({
      id: "docker-run",
      name: "Docker 运行",
      description: "运行 Docker 容器",
      patterns: [
        "docker run",
        "运行容器",
        "启动容器",
        "docker run",
      ],
      template: "docker run -d -p {{port}}:{{port}} {{image}}",
      params: ["port", "image"],
      category: "docker",
      examples: ["运行容器 nginx", "docker run -p 80:80 nginx"],
    });

    this.addTemplate({
      id: "docker-stop",
      name: "Docker 停止",
      description: "停止容器",
      patterns: [
        "docker stop",
        "停止容器",
        "stop docker",
        "关闭容器",
      ],
      template: "docker stop {{container}}",
      params: ["container"],
      category: "docker",
      examples: ["停止容器", "docker stop myapp", "关闭容器"],
    });

    // === Kubernetes ===
    this.addTemplate({
      id: "k8s-pods",
      name: "K8s Pods",
      description: "查看 Pods",
      patterns: [
        "kubectl get pods",
        "k8s pods",
        "查看 pods",
        "pod 列表",
      ],
      template: "kubectl get pods{{#namespace}} -n {{namespace}}{{/namespace}}",
      params: ["namespace"],
      category: "k8s",
      examples: ["查看 pods", "kubectl get pods", "k8s pod 列表"],
    });

    this.addTemplate({
      id: "k8s-services",
      name: "K8s Services",
      description: "查看 Services",
      patterns: [
        "kubectl get services",
        "k8s services",
        "查看服务",
        "service 列表",
      ],
      template: "kubectl get services{{#namespace}} -n {{namespace}}{{/namespace}}",
      params: ["namespace"],
      category: "k8s",
      examples: ["查看 services", "kubectl get svc", "k8s 服务列表"],
    });

    this.addTemplate({
      id: "k8s-deploy",
      name: "K8s 部署",
      description: "部署应用",
      patterns: [
        "kubectl apply",
        "k8s deploy",
        "部署",
        "deploy",
        "应用配置",
      ],
      template: "kubectl apply -f {{file}}",
      params: ["file"],
      category: "k8s",
      examples: ["部署应用", "kubectl apply -f deployment.yaml", "k8s 部署"],
    });

    log.info(`Loaded ${this.templates.size} command templates`);
  }

  /**
   * 添加命令模板
   */
  addTemplate(template: CommandTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * 移除命令模板
   */
  removeTemplate(id: string): void {
    this.templates.delete(id);
  }

  /**
   * 获取命令模板
   */
  getTemplate(id: string): CommandTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 列出所有模板
   */
  listTemplates(): CommandTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 列出分类
   */
  listCategories(): CommandCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * 将自然语言转换为命令
   */
  async convertToCommand(input: string): Promise<NLCommandResult> {
    const normalizedInput = input.toLowerCase().trim();

    // 匹配模板
    const match = this.matchTemplate(normalizedInput);
    
    if (!match) {
      return {
        success: false,
        error: "无法识别的命令，请尝试更具体的描述",
        confidence: 0,
      };
    }

    const { template, params } = match;
    const command = this.renderTemplate(template, params);

    return {
      success: true,
      command,
      explanation: this.generateExplanation(template, params),
      confidence: this.calculateConfidence(template, normalizedInput),
    };
  }

  /**
   * 匹配命令模板
   */
  private matchTemplate(input: string): { template: CommandTemplate; params: Record<string, string> } | null {
    for (const template of this.templates.values()) {
      for (const pattern of template.patterns) {
        const normalizedPattern = pattern.toLowerCase();
        
        // 精确匹配
        if (input.includes(normalizedPattern)) {
          const params = this.extractParams(input, template);
          return { template, params };
        }
      }
    }

    return null;
  }

  /**
   * 提取参数
   */
  private extractParams(input: string, template: CommandTemplate): Record<string, string> {
    const params: Record<string, string> = {};

    // 根据模板类型提取参数
    if (template.category === "file") {
      // 提取文件名
      const fileMatch = input.match(/(\S+\.(?:txt|md|json|js|ts|tsx|jsx|py|go|rs|java))/);
      if (fileMatch && template.params.includes("filename")) {
        params.filename = fileMatch[1];
      }
      if (fileMatch && template.params.includes("file")) {
        params.file = fileMatch[1];
      }
      if (fileMatch && template.params.includes("source")) {
        params.source = fileMatch[1];
      }
      
      // 提取路径
      const pathMatch = input.match(/(?:目录 | 文件夹 | 路径)[:：]?\s*(\S+)/);
      if (pathMatch && template.params.includes("path")) {
        params.path = pathMatch[1];
      }
    }

    if (template.category === "git") {
      // 提取分支名
      const branchMatch = input.match(/(?:分支 | branch)[:：]?\s*(\S+)/);
      if (branchMatch && template.params.includes("branch")) {
        params.branch = branchMatch[1];
      }
      
      // 提取提交消息
      const messageMatch = input.match(/(?:消息 |message)[:：]?\s*["']?([^"']+)["']?/);
      if (messageMatch && template.params.includes("message")) {
        params.message = messageMatch[1].trim();
      }
    }

    if (template.category === "npm") {
      // 提取包名
      const packageMatch = input.match(/(?:包 |package|install|卸载 |remove)[:：]?\s*(\S+)/);
      if (packageMatch && template.params.includes("package")) {
        params.package = packageMatch[1];
      }
      
      // 提取脚本名
      const scriptMatch = input.match(/(?:运行 |run|脚本 |script)[:：]?\s*(\S+)/);
      if (scriptMatch && template.params.includes("script")) {
        params.script = scriptMatch[1];
      }
    }

    if (template.category === "docker") {
      // 提取镜像名
      const imageMatch = input.match(/(?:镜像 |image|容器 |container)[:：]?\s*(\S+)/);
      if (imageMatch && template.params.includes("image")) {
        params.image = imageMatch[1];
      }
      
      // 提取端口
      const portMatch = input.match(/(?:端口 |port)[:：]?\s*(\d+)/);
      if (portMatch && template.params.includes("port")) {
        params.port = portMatch[1];
      }
    }

    if (template.category === "k8s") {
      // 提取命名空间
      const nsMatch = input.match(/(?:命名空间 |namespace|ns)[:：]?\s*(\S+)/);
      if (nsMatch && template.params.includes("namespace")) {
        params.namespace = nsMatch[1];
      }
      
      // 提取文件名
      const fileMatch = input.match(/(?:文件 |file|yaml)[:：]?\s*(\S+\.yaml)/);
      if (fileMatch && template.params.includes("file")) {
        params.file = fileMatch[1];
      }
    }

    // 系统命令参数
    if (template.params.includes("text") && !params.text) {
      const textMatch = input.match(/["']([^"']+)["']/);
      if (textMatch) {
        params.text = textMatch[1];
      }
    }

    if (template.params.includes("limit") && !params.limit) {
      const limitMatch = input.match(/(\d+)\s*(?:条 | 个 | 行)/);
      if (limitMatch) {
        params.limit = limitMatch[1];
      }
    }

    return params;
  }

  /**
   * 渲染模板
   */
  private renderTemplate(template: CommandTemplate, params: Record<string, string>): string {
    let command = template.template;

    // 替换简单参数
    for (const [key, value] of Object.entries(params)) {
      command = command.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    // 处理条件参数
    command = command.replace(/{{#(\w+)}}(.*?){{\/\1}}/g, (match, key, content) => {
      return params[key] ? content : "";
    });

    command = command.replace(/{{\^(\w+)}}(.*?){{\/\1}}/g, (match, key, content) => {
      return params[key] ? "" : content;
    });

    return command.trim();
  }

  /**
   * 生成命令解释
   */
  private generateExplanation(template: CommandTemplate, params: Record<string, string>): string {
    const category = this.categories.get(template.category);
    const categoryName = category?.name || template.category;

    let explanation = `执行${categoryName}：${template.name}\n`;
    explanation += `命令：${this.renderTemplate(template, params)}\n`;
    
    if (Object.keys(params).length > 0) {
      explanation += `参数：${JSON.stringify(params)}\n`;
    }

    return explanation;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(template: CommandTemplate, input: string): number {
    let confidence = 0.5;

    // 精确匹配提升置信度
    for (const pattern of template.patterns) {
      if (input.includes(pattern.toLowerCase())) {
        confidence += 0.3;
        break;
      }
    }

    // 参数完整提升置信度
    if (template.params.every(p => Object.keys(this.extractParams(input, template)).includes(p))) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): CommandTemplate[] {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery) ||
        t.patterns.some((p) => p.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * 导出模板
   */
  exportTemplates(): string {
    return JSON.stringify(
      Array.from(this.templates.values()),
      null,
      2
    );
  }

  /**
   * 导入模板
   */
  importTemplates(json: string): number {
    try {
      const templates = JSON.parse(json) as CommandTemplate[];
      let count = 0;
      for (const template of templates) {
        if (template.id && template.name) {
          this.templates.set(template.id, template);
          count++;
        }
      }
      return count;
    } catch (error) {
      log.error("Import failed:", error);
      return 0;
    }
  }
}

// 导出单例
export const nlCommandService = new NLCommandService();

// 导出工具函数
export const convertToCommand = nlCommandService.convertToCommand.bind(nlCommandService);
export const listTemplates = nlCommandService.listTemplates.bind(nlCommandService);
export const listCategories = nlCommandService.listCategories.bind(nlCommandService);
export const searchTemplates = nlCommandService.searchTemplates.bind(nlCommandService);

export default NLCommandService;
