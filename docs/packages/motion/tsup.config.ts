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
    external: ['framer-motion', 'react', 'react-dom'],
    outDir: 'dist',
  },
  {
    entry: {
      'css/index': 'src/css/index.ts',
      'waapi/index': 'src/waapi/index.ts',
      'framer/index': 'src/framer/index.ts',
      'hooks/index': 'src/hooks/index.ts',
      'components/index': 'src/components/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: true,
    treeshake: true,
    minify: true,
    external: ['framer-motion', 'react', 'react-dom'],
    outDir: 'dist',
  },
])
