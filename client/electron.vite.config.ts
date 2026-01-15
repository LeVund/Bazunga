import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main'
    }
  },
  preload: {
    build: {
      outDir: 'dist/preload'
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src'),
        '@core': path.resolve(__dirname, '../core')
      }
    },
    plugins: [vue()]
  }
})
