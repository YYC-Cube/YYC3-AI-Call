import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: true,
    treeshake: true,
    minify: true,
    external: ['eventemitter3', 'zod'],
    outDir: 'dist',
  },
  {
    entry: {
      'auth/index': 'src/auth/index.ts',
      'mcp/index': 'src/mcp/index.ts',
      'skills/index': 'src/skills/index.ts',
      'ai-family/index': 'src/ai-family/index.ts',
      'multimodal/index': 'src/multimodal/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    minify: true,
    external: ['eventemitter3', 'zod'],
    outDir: 'dist',
  },
])
