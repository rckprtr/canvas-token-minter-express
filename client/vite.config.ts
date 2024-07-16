import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,

        secure: false,
        rewrite: (path) => {
          console.log(path, new Date());
          return path
        },
        bypass(req) {
          console.log('bypass', req.method, req.url, new Date());
          return null;
        }
      },
    },
  },
  plugins: [vue(),
    nodePolyfills({
      globals: {
        Buffer: true
      },
      protocolImports: true
    })
  ],
})
