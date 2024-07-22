import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    server: {
      proxy: {
        "/api": {
          target: env["VITE_API_URL"],
          changeOrigin: false,
          secure: false,
          rewrite: (path: string) => {
            return path;
          },
        },
      },
      headers: {
        "content-security-policy": "connect-src https://*.solana.com;",
      },
    },
    plugins: [
      vue(),
      nodePolyfills({
        globals: {
          Buffer: true,
        },
        protocolImports: true,
      }),
    ],
  };
});
