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
    minify: false,
    outDir: 'dist',
  },
  {
    entry: {
      'lib/cache': 'src/lib/cache.ts',
      'lib/plugins/index': 'src/lib/plugins/index.ts',
      'lib/icu/parser': 'src/lib/icu/parser.ts',
      'lib/ai/provider': 'src/lib/ai/provider.ts',
      'lib/mcp/server': 'src/lib/mcp/server.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    minify: false,
    outDir: 'dist',
  },
])
