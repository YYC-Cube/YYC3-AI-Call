#!/usr/bin/env node
import { resolve } from 'path';
import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';

var TEMPLATES = [
  { title: "Dashboard \u4EEA\u8868\u76D8", value: "dashboard", description: "\u4FA7\u8FB9\u680F+\u5185\u5BB9\u533A+\u6570\u636E\u8868\u683C" },
  { title: "AI Platform AI\u5E73\u53F0", value: "ai-platform", description: "\u5BF9\u8BDD\u754C\u9762+\u6A21\u578B\u7BA1\u7406+\u5DE5\u5177\u8C03\u7528" },
  { title: "Landing Page \u7740\u9646\u9875", value: "landing", description: "\u54C1\u724C\u5C55\u793A+Spline 3D+\u52A8\u6548" },
  { title: "API Service API\u670D\u52A1", value: "api", description: "RESTful API+\u8BA4\u8BC1+\u4E2D\u95F4\u4EF6" }
];
var PORT_MAP = {
  dashboard: 3201,
  "ai-platform": 3300,
  landing: 3200,
  api: 3400
};
async function createProject(name, options) {
  const targetDir = resolve(process.cwd(), name);
  if (await fs.pathExists(targetDir)) {
    console.error(chalk.red(`\u76EE\u5F55 ${name} \u5DF2\u5B58\u5728`));
    process.exit(1);
  }
  let template = options.template;
  let port = options.port;
  let preset = options.preset;
  if (!template) {
    const answers = await prompts([
      {
        type: "select",
        name: "template",
        message: "\u9009\u62E9\u9879\u76EE\u6A21\u677F",
        choices: TEMPLATES
      }
    ]);
    template = answers.template;
  }
  if (!port) {
    port = PORT_MAP[template] || 3200;
  }
  if (!preset) {
    const answers = await prompts([
      {
        type: "select",
        name: "preset",
        message: "\u9009\u62E9\u4E3B\u9898\u9884\u8BBE",
        choices: [
          { title: "YYC\xB3 Dark (Cyberpunk)", value: "yyc3-dark" },
          { title: "YYC\xB3 Light (Business)", value: "yyc3-light" },
          { title: "YYC\xB3 Brand", value: "yyc3-brand" },
          { title: "Nova (shadcn default)", value: "nova" }
        ],
        initial: 0
      }
    ]);
    preset = answers.preset;
  }
  const spinner = ora("\u6B63\u5728\u521B\u5EFA\u9879\u76EE...").start();
  await fs.ensureDir(targetDir);
  const packageJson = {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: `next dev --port ${port}`,
      build: "next build",
      start: `next start --port ${port}`,
      lint: "next lint"
    },
    dependencies: {
      next: "^15.3.0",
      react: "^19.1.0",
      "react-dom": "^19.1.0"
    },
    devDependencies: {
      typescript: "^5.8.0",
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      tailwindcss: "^4.1.0",
      "@tailwindcss/postcss": "^4.1.0"
    }
  };
  await fs.writeJson(resolve(targetDir, "package.json"), packageJson, { spaces: 2 });
  const dirs = ["src/app", "src/components", "src/lib", "public"];
  for (const dir of dirs) {
    await fs.ensureDir(resolve(targetDir, dir));
  }
  await fs.writeFile(
    resolve(targetDir, "src/app/page.tsx"),
    `export default function Page() {
  return <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-3xl font-bold">${name}</h1>
  </div>
}
`
  );
  await fs.writeFile(
    resolve(targetDir, "src/app/layout.tsx"),
    `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "${name}", description: "YYC\xB3 Project" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>
}
`
  );
  await fs.writeFile(
    resolve(targetDir, "src/app/globals.css"),
    `@import "tailwindcss";
`
  );
  await fs.writeFile(
    resolve(targetDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] } },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }, null, 2)
  );
  await fs.writeFile(
    resolve(targetDir, "next.config.ts"),
    `import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default nextConfig
`
  );
  await fs.writeFile(
    resolve(targetDir, "postcss.config.mjs"),
    `/** @type {import('postcss-load-config').Config} */
const config = { plugins: { "@tailwindcss/postcss": {} } }
export default config
`
  );
  spinner.succeed(chalk.green(`\u9879\u76EE ${name} \u521B\u5EFA\u6210\u529F\uFF01`));
  console.log(chalk.blue("\n\u4E0B\u4E00\u6B65\uFF1A"));
  console.log(`  cd ${name}`);
  console.log(`  pnpm install`);
  console.log(`  npx @yyc3/cli init -p ${preset}`);
  console.log(`  pnpm dev`);
  console.log(chalk.gray(`
\u7AEF\u53E3: ${port} | \u6A21\u677F: ${template} | \u9884\u8BBE: ${preset}`));
}
var program = new Command().name("create-yyc3-app").description("YYC\xB3 \u9879\u76EE\u811A\u624B\u67B6 \u2014 \u4E00\u952E\u521B\u5EFA\u7B26\u5408 YYC\xB3 \u89C4\u8303\u7684 Next.js \u9879\u76EE").argument("<name>", "\u9879\u76EE\u540D\u79F0").option("-t, --template <template>", "\u9879\u76EE\u6A21\u677F (dashboard/ai-platform/landing/api)").option("-p, --port <port>", "\u5F00\u53D1\u7AEF\u53E3", parseInt).option("--preset <preset>", "\u4E3B\u9898\u9884\u8BBE (yyc3-dark/yyc3-light/yyc3-brand/nova)").action(createProject);
program.parse();
//# sourceMappingURL=create-app.js.map
//# sourceMappingURL=create-app.js.map