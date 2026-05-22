#!/usr/bin/env node

import { resolve, basename } from "path"
import { Command } from "commander"
import prompts from "prompts"
import chalk from "chalk"
import ora from "ora"
import fs from "fs-extra"

const TEMPLATES = [
  { title: "Dashboard 仪表盘", value: "dashboard", description: "侧边栏+内容区+数据表格" },
  { title: "AI Platform AI平台", value: "ai-platform", description: "对话界面+模型管理+工具调用" },
  { title: "Landing Page 着陆页", value: "landing", description: "品牌展示+Spline 3D+动效" },
  { title: "API Service API服务", value: "api", description: "RESTful API+认证+中间件" },
]

const PORT_MAP: Record<string, number> = {
  dashboard: 3201,
  "ai-platform": 3300,
  landing: 3200,
  api: 3400,
}

async function createProject(name: string, options: { template?: string; port?: number; preset?: string }) {
  const targetDir = resolve(process.cwd(), name)

  if (await fs.pathExists(targetDir)) {
    console.error(chalk.red(`目录 ${name} 已存在`))
    process.exit(1)
  }

  let template = options.template
  let port = options.port
  let preset = options.preset

  if (!template) {
    const answers = await prompts([
      {
        type: "select",
        name: "template",
        message: "选择项目模板",
        choices: TEMPLATES,
      },
    ])
    template = answers.template
  }

  if (!port) {
    port = PORT_MAP[template!] || 3200
  }

  if (!preset) {
    const answers = await prompts([
      {
        type: "select",
        name: "preset",
        message: "选择主题预设",
        choices: [
          { title: "YYC³ Dark (Cyberpunk)", value: "yyc3-dark" },
          { title: "YYC³ Light (Business)", value: "yyc3-light" },
          { title: "YYC³ Brand", value: "yyc3-brand" },
          { title: "Nova (shadcn default)", value: "nova" },
        ],
        initial: 0,
      },
    ])
    preset = answers.preset
  }

  const spinner = ora("正在创建项目...").start()

  await fs.ensureDir(targetDir)

  const packageJson = {
    name: name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: `next dev --port ${port}`,
      build: "next build",
      start: `next start --port ${port}`,
      lint: "next lint",
    },
    dependencies: {
      next: "^15.3.0",
      react: "^19.1.0",
      "react-dom": "^19.1.0",
    },
    devDependencies: {
      typescript: "^5.8.0",
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      tailwindcss: "^4.1.0",
      "@tailwindcss/postcss": "^4.1.0",
    },
  }

  await fs.writeJson(resolve(targetDir, "package.json"), packageJson, { spaces: 2 })

  const dirs = ["src/app", "src/components", "src/lib", "public"]
  for (const dir of dirs) {
    await fs.ensureDir(resolve(targetDir, dir))
  }

  await fs.writeFile(
    resolve(targetDir, "src/app/page.tsx"),
    `export default function Page() {\n  return <div className="min-h-screen flex items-center justify-center">\n    <h1 className="text-3xl font-bold">${name}</h1>\n  </div>\n}\n`,
  )

  await fs.writeFile(
    resolve(targetDir, "src/app/layout.tsx"),
    `import type { Metadata } from "next"\nimport "./globals.css"\n\nexport const metadata: Metadata = { title: "${name}", description: "YYC³ Project" }\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="zh-CN"><body>{children}</body></html>\n}\n`,
  )

  await fs.writeFile(
    resolve(targetDir, "src/app/globals.css"),
    `@import "tailwindcss";\n`,
  )

  await fs.writeFile(
    resolve(targetDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] } },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }, null, 2),
  )

  await fs.writeFile(
    resolve(targetDir, "next.config.ts"),
    `import type { NextConfig } from "next"\n\nconst nextConfig: NextConfig = {}\n\nexport default nextConfig\n`,
  )

  await fs.writeFile(
    resolve(targetDir, "postcss.config.mjs"),
    `/** @type {import('postcss-load-config').Config} */\nconst config = { plugins: { "@tailwindcss/postcss": {} } }\nexport default config\n`,
  )

  spinner.succeed(chalk.green(`项目 ${name} 创建成功！`))

  console.log(chalk.blue("\n下一步："))
  console.log(`  cd ${name}`)
  console.log(`  pnpm install`)
  console.log(`  npx @yyc3/cli init -p ${preset}`)
  console.log(`  pnpm dev`)
  console.log(chalk.gray(`\n端口: ${port} | 模板: ${template} | 预设: ${preset}`))
}

const program = new Command()
  .name("create-yyc3-app")
  .description("YYC³ 项目脚手架 — 一键创建符合 YYC³ 规范的 Next.js 项目")
  .argument("<name>", "项目名称")
  .option("-t, --template <template>", "项目模板 (dashboard/ai-platform/landing/api)")
  .option("-p, --port <port>", "开发端口", parseInt)
  .option("--preset <preset>", "主题预设 (yyc3-dark/yyc3-light/yyc3-brand/nova)")
  .action(createProject)

program.parse()
