import { resolve } from "path";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  browser: "chromium",
  // Chrome 137兼容性配置 - 禁用web-ext自动启动
  // webExt: {
  //   disabled: true, // 禁用自动浏览器启动，需要手动加载扩展
  // },
  alias: {
    "@": resolve(__dirname, "src"),
    "@components": resolve(__dirname, "src/components"),
    "@utils": resolve(__dirname, "src/utils"),
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
    action: {
      "default_title": "Lucid"
    },
    web_accessible_resources: [
      // Mock数据已移动到src/tests/mock-data，不再需要web_accessible_resources
      // 如果将来需要在content script中访问assets资源，可以在这里添加
    ],
  },
  dev: {
    server: {
      port: parseInt(process.env.WXT_DEV_SERVER_PORT || '3000'),
      host: '0.0.0.0',
    },
    // 使用类型断言来允许 browserFlags
    ...({
      browserFlags: [
        "--auto-open-devtools-for-tabs",
        "--enable-features=AutoOpenDevToolsForPopups",
      ],
    } as any),
  },
  outDir: process.env.NODE_ENV === "development" ? ".output" : undefined,
  vite: () => {
    const port = parseInt(process.env.WXT_DEV_SERVER_PORT || '3000');
    return {
      build: {
        minify: process.env.NODE_ENV === "production",
        sourcemap: process.env.NODE_ENV === "development",
      },
      server: {
        host: '0.0.0.0',
        port: port,
        strictPort: true,
        hmr: {
          host: '0.0.0.0',
          port: port,
          strictPort: true,
          clientPort: port,
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    };
  },
});
