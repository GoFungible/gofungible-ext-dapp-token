import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/gofungible-ext-dapp-token/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/data',
    },
  },
})