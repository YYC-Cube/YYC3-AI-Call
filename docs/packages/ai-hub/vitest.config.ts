import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@yyc3/core': path.resolve(__dirname, '../core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/types.ts',
        'examples/**',
        'src/index.ts',
        'src/family/index.ts',
        'src/work/index.ts',
        'src/family-compass/family-compass.ts',
        'src/family/members.ts',
        'src/agents.ts',
        'src/work/trust-system.ts',
        'src/family/orchestrator.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 80,
        lines: 90,
      },
    },
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
  },
})
