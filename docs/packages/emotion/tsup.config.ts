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
    external: ['eventemitter3'],
    outDir: 'dist',
  },
  {
    entry: {
      'engine/index': 'src/engine/index.ts',
      'music-bridge/index': 'src/music-bridge/index.ts',
      'event-bus/index': 'src/event-bus/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    minify: true,
    external: ['eventemitter3'],
    outDir: 'dist',
  },
])
