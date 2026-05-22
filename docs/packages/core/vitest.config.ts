import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
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
        'src/multimodal/image-processor.ts',
        'src/multimodal/audio-processor.ts',
        'src/multimodal/manager.ts',
        'src/multimodal/document-processor.ts',
        'src/ai-family/agents.ts',
        'src/setup/quick-starter.ts',
        'src/setup/auto-detector.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
  },
})
