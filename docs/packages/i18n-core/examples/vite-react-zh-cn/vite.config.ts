import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 示例直连本包的浏览器安全入口（dist/browser.js）：
// 仓库根 node_modules 中存在已发布的 @yyc3/i18n-core@2.4.0，默认解析会命中该副本，
// 因此显式 alias 到本地构建产物，确保示例验证的是当前源码。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@yyc3/i18n-core/browser': fileURLToPath(
        new URL('../../dist/browser.js', import.meta.url)
      ),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
