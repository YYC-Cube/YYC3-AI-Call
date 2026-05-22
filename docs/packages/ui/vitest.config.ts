import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**',
        '**/types.ts',
        'src/components/ui/**',
        'src/shadcn.ts',
        'src/hooks/use-mobile.ts',
        'src/core/hooks.ts',
        'src/core/index.ts',
        'src/components/index.ts',
        'src/components/family/index.ts',
        'src/components/layout.tsx',
        'src/themes/index.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 75,
        lines: 90,
      },
    },
    include: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
