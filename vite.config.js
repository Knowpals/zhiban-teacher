import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://teacher.knowpals.xyz', // 后端服务器地址
        changeOrigin: true,
        secure: false, // 允许 HTTPS 自签名证书
      },
    },
  },
})
