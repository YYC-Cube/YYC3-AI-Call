import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/types.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 0,
        lines: 90,
      },
    },
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    testTimeout: 10000,
  },
})
