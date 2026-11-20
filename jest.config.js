// Jest config using Next.js preset to support TS/TSX and module aliases
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
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
