import { defineConfig } from "wxt";
import { resolve } from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  browser: "chrome",
  alias: {
    "@": resolve(__dirname, "src"),
    "@components": resolve(__dirname, "src/components"),
    "@utils": resolve(__dirname, "utils"),
    "@services": resolve(__dirname, "src/services"),
    "@types": resolve(__dirname, "src/types"),
    "@hooks": resolve(__dirname, "src/hooks"),
    "@styles": resolve(__dirname, "src/styles"),
    "@constants": resolve(__dirname, "src/constants"),
    "@lib": resolve(__dirname, "src/lib"),
    "@assets": resolve(__dirname, "assets"),
  },
  manifest: {
    name: "Lucid Extension",
    description: "智能高亮与查词浏览器扩展",
    permissions: ["storage", "tts", "contextMenus", "activeTab"],
    host_permissions: [
      // API 权限将在后续添加
    ],
  },
  dev: {
    server: {
      port: 3000,
    },
    // 使用类型断言来允许 browserFlags
    ...({
      browserFlags: [
        "--auto-open-devtools-for-tabs",
        "--enable-features=AutoOpenDevToolsForPopups",
      ],
    } as any),
  },
  // 确保stagewise包只在开发环境中被包含
  outDir: process.env.NODE_ENV === "development" ? ".output" : undefined,
  vite: () => ({
    build: {
      minify: process.env.NODE_ENV === "production",
      sourcemap: process.env.NODE_ENV === "development",
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  }),
});
