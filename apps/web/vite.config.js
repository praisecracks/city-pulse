import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const androidDownloadDelayHours = 7;
  const androidAppUnlockAt = new Date(
    Date.now() + androidDownloadDelayHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_ANDROID_APP_UNLOCK_AT": JSON.stringify(androidAppUnlockAt),
    },
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
