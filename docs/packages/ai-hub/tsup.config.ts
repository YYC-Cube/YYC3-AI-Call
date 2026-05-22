import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'family/index': 'src/family/index.ts',
    'family-compass/index': 'src/family-compass/index.ts',
    'work/index': 'src/work/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  outDir: 'dist',
  external: ['openai', 'ollama', 'zod', 'eventemitter3', '@yyc3/core'],
  target: 'es2022',
  esbuildOptions(options) {
    options.banner = {
      js: `/**
 * @preserve YYC³ AI Family Hub
 * @version ${process.env.npm_package_version || '1.0.0'}
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */
`,
    };
  },
});
