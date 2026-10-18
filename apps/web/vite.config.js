import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api/v1": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:5002",
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
  };
});
