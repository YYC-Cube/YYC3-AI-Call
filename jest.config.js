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
  ],
};

module.exports = createJestConfig(customJestConfig);
