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
    outDir: 'dist',
  },
  {
    entry: {
      'types/index': 'src/types/index.ts',
      'registry/index': 'src/registry/index.ts',
      'server/index': 'src/server/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    minify: true,
    outDir: 'dist',
  },
])
