import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',
    'create-app': 'src/create-app.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    'framer-motion',
    '@splinetool/react-spline',
    'zod',
    '@modelcontextprotocol/sdk',
    'chalk',
    'commander',
    'ora',
    'prompts',
    'fs-extra',
    'dedent',
    'deepmerge',
    'open',
    'glob',
    'yaml',
  ],
  outDir: 'dist',
  alias: {
    '@/src': path.resolve(__dirname, 'src'),
  },
})
