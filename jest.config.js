// Jest config using Next.js preset to support TS/TSX and module aliases
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // 覆盖率防倒退门禁（2026-11-20 基线：语句73.4/分支56.41/函数74.6/行74.94）
  coverageThreshold: {
    global: {
      statements: 72,
      branches: 55,
      functions: 73,
      lines: 73,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // @yyc3/* 生态包 exports 仅含 "import" 条件（ESM-only），jest-resolve
    // 以 require/default 条件解析会报 Cannot find module，此处直连 dist 入口绕过 exports。
    "^@yyc3/core$": "<rootDir>/node_modules/@yyc3/core/dist/index.js",
    "^@yyc3/core/(.*)$": "<rootDir>/node_modules/@yyc3/core/dist/$1/index.js",
    "^@yyc3/ui$": "<rootDir>/node_modules/@yyc3/ui/dist/index.js",
    "^@yyc3/ai-hub$": "<rootDir>/node_modules/@yyc3/ai-hub/dist/index.js",
    "^@yyc3/plugins$": "<rootDir>/node_modules/@yyc3/plugins/dist/index.js",
    "^@yyc3/emotion$": "<rootDir>/node_modules/@yyc3/emotion/dist/index.js",
    "^@yyc3/mcp-servers$": "<rootDir>/node_modules/@yyc3/mcp-servers/dist/index.js",
    "^@yyc3/motion$": "<rootDir>/node_modules/@yyc3/motion/dist/index.js",
  },
  testMatch: [
    "<rootDir>/tests/**/*.(spec|test).{ts,tsx,js,jsx}",
    "<rootDir>/app/**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}",
    "<rootDir>/lib/**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}",
    "<rootDir>/components/**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/docs/packages/",
    "/enterprise/",
    "/examples/",
    "/dist/",
    "/tests/e2e/",
  ],
  // @yyc3/* 生态包为 ESM 产物，需交给 babel 转译。
  // 注意：next/jest 会用自身默认值覆盖此字段，真实生效值在下方导出函数中强制改写。
  transformIgnorePatterns: [
    "node_modules/(?!.*@yyc3/)",
  ],
};

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  // pnpm 实际路径形如 .pnpm/@yyc3+i18n-core@x/node_modules/@yyc3/...
  config.transformIgnorePatterns = ["node_modules/(?!.*@yyc3/)"];
  return config;
};
