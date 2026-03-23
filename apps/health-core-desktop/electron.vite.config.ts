import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    // Point to the health-core web app as the renderer source.
    // In dev mode the main process loads http://localhost:5173 directly.
    // This config is used for the production build only.
    root: resolve(__dirname, '../health-core'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, '../health-core/index.html'),
        },
      },
      outDir: resolve(__dirname, '../health-core-desktop/out/renderer'),
    },
  },
})

