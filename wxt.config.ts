import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  browser: 'chrome',
  manifest: {
    name: 'Lucid Extension', // 您可以自定义扩展名称
    description: '智能高亮与查词浏览器扩展', // 您可以自定义描述
    permissions: [
      'storage', // 用于存储用户设置和标记
      'tts',     // 如果实现客户端TTS发音功能
      'contextMenus', // 如果计划添加右键菜单功能
      // 'activeTab', // 如果某些操作仅需当前活动标签页权限
    ],
    host_permissions: [
      // "https://your-backend-api.com/*", // 替换为您的后端API域名
    ],
    allFrames: true,       // 同源 iframe 也注入
    matchAboutBlank: true, // about:blank / srcdoc 也能拿到
    // WXT 会根据 entrypoints 的 matches 自动处理内容脚本的权限
    // 例如，如果您在 entrypoints/content.ts 的配置中指定了 matches: ["<all_urls>"]
    // WXT 会确保 manifest.json 中包含相应的 content_scripts 配置和权限。
    // 如果没有在 entrypoints 中指定，或者需要更复杂的权限，可以在这里显式添加。
    // content_scripts 字段将由 WXT 根据 entrypoints/content.ts 自动生成。
  },
  // 由于顶层 'entrypoints' 配置导致类型错误，我们在此处移除它。
  // WXT 仍会自动发现 'entrypoints/content.ts'。
});
