/** @type {import('tailwindcss').Config} */

// 色板定义，与 plan.md 中的设计对应
const L_COLORS = ['orange', 'blue', 'green']; // 可配置的基础颜色
const L_SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900]; // Tailwind 色阶

const safelist = [];
L_COLORS.forEach(color => {
  L_SHADES.forEach(shade => {
    safelist.push(`bg-${color}-${shade}`);
    // 如果将来需要文本颜色或其他动态类，也可以在这里添加
    // safelist.push(`text-${color}-${shade}`);
  });
});

export default {
  content: [
    "./entrypoints/**/*.{js,ts,jsx,tsx,html}", // 扫描 entrypoints 目录下的所有相关文件
    "./components/**/*.{js,ts,jsx,tsx}",   // 扫描 components 目录
    "./popup/**/*.{js,ts,jsx,tsx,html}",     // 扫描 popup 相关文件 (如果 Tailwind 用于 popup)
    // 根据您的项目结构，添加其他可能使用 Tailwind CSS 的路径
  ],
  darkMode: "media", // 或者 'class'，取决于您的暗黑模式实现策略
  theme: {
    extend: {
      // 在这里可以扩展 Tailwind 的默认主题，例如添加自定义颜色
      // colors: {
      //   'custom-orange': {
      //     50: '#fff7ed',
      //     // ... 其他 orange 色阶
      //     900: '#7c2d12',
      //   },
      // },
    },
  },
  plugins: [],
  safelist: safelist, // 应用上面生成的安全列表
};
