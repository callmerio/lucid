#!/usr/bin/env node

/**
 * CSS模式切换脚本
 * 在完整版设计系统和精简版之间切换
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAIN_CSS_PATH = path.join(__dirname, '../src/styles/main.css');

const FULL_VERSION = `/* ===== Lucid Extension 设计系统 ===== */
@import './design-tokens.css';
@import './components.css';
@import './animations.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== 基础样式重置 ===== */

/* 确保所有 Lucid 组件使用统一的字体系统 */
.lucid-tooltip,
.lucid-toolpopup-container,
.lucid-highlight {
  font-family: var(--lucid-font-family);
}

/* ===== 高亮效果 ===== */

/* 使用新的动画系统 */
.lucid-highlight:hover {
  -webkit-mask-image: linear-gradient(
    -75deg,
    rgba(0, 0, 0, 0.6) 30%,
    #000 50%,
    rgba(0, 0, 0, 0.6) 70%
  );
  -webkit-mask-size: 200%;
  animation: lucid-shine 2s infinite;
}`;

const ESSENTIAL_VERSION = `/* ===== Lucid Extension 精简版设计系统 ===== */
@import './essential.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== 基础样式重置 ===== */

/* 确保所有 Lucid 组件使用统一的字体系统 */
.lucid-tooltip,
.lucid-toolpopup-container,
.lucid-highlight {
  font-family: var(--lucid-font-family);
}

/* ===== 高亮效果 ===== */

/* 使用精简版动画系统 */
.lucid-highlight:hover {
  -webkit-mask-image: linear-gradient(
    -75deg,
    rgba(0, 0, 0, 0.6) 30%,
    #000 50%,
    rgba(0, 0, 0, 0.6) 70%
  );
  -webkit-mask-size: 200%;
  animation: lucid-shine 2s infinite;
}`;

function getCurrentMode() {
  try {
    const content = fs.readFileSync(MAIN_CSS_PATH, 'utf8');
    if (content.includes('@import \'./essential.css\';')) {
      return 'essential';
    } else if (content.includes('@import \'./design-tokens.css\';')) {
      return 'full';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('❌ 无法读取main.css文件:', error.message);
    process.exit(1);
  }
}

function switchToMode(mode) {
  try {
    let content;
    if (mode === 'full') {
      content = FULL_VERSION;
    } else if (mode === 'essential') {
      content = ESSENTIAL_VERSION;
    } else {
      throw new Error('无效的模式，请使用 "full" 或 "essential"');
    }

    fs.writeFileSync(MAIN_CSS_PATH, content, 'utf8');
    console.log(`✅ 已切换到 ${mode === 'full' ? '完整版' : '精简版'} 设计系统`);
  } catch (error) {
    console.error('❌ 切换失败:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  const currentMode = getCurrentMode();
  console.log('\n📊 当前CSS模式状态:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (currentMode === 'full') {
    console.log('🎨 当前模式: 完整版设计系统');
    console.log('📦 预计大小: ~16kB');
    console.log('✨ 功能: 完整的设计token、组件库、动画系统');
    console.log('🎯 适用: 开发环境、功能测试');
  } else if (currentMode === 'essential') {
    console.log('⚡ 当前模式: 精简版设计系统');
    console.log('📦 预计大小: ~3-4kB');
    console.log('✨ 功能: 核心样式、基础动画、主题支持');
    console.log('🎯 适用: 生产环境、性能优化');
  } else {
    console.log('❓ 当前模式: 未知');
    console.log('⚠️  请检查main.css文件配置');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function showHelp() {
  console.log(`
🎨 Lucid Extension CSS模式切换工具

用法:
  node scripts/switch-css-mode.js [命令]

命令:
  full        切换到完整版设计系统 (~16kB)
  essential   切换到精简版设计系统 (~3-4kB)
  status      显示当前模式状态
  help        显示此帮助信息

示例:
  node scripts/switch-css-mode.js essential  # 切换到精简版
  node scripts/switch-css-mode.js full       # 切换到完整版
  node scripts/switch-css-mode.js status     # 查看当前状态

模式对比:
┌─────────────┬─────────────┬─────────────┬─────────────────┐
│    模式     │   文件大小  │    功能     │     适用场景    │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│  完整版     │   ~16kB     │   全功能    │   开发/测试     │
│  精简版     │   ~3-4kB    │   核心功能  │   生产环境      │
└─────────────┴─────────────┴─────────────┴─────────────────┘
`);
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '-h' || command === '--help') {
    showHelp();
    return;
  }

  switch (command) {
    case 'status':
      showStatus();
      break;

    case 'full':
      const currentMode = getCurrentMode();
      if (currentMode === 'full') {
        console.log('ℹ️  已经是完整版模式，无需切换');
        showStatus();
      } else {
        switchToMode('full');
        showStatus();
      }
      break;

    case 'essential':
      const currentModeEss = getCurrentMode();
      if (currentModeEss === 'essential') {
        console.log('ℹ️  已经是精简版模式，无需切换');
        showStatus();
      } else {
        switchToMode('essential');
        showStatus();
      }
      break;

    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('💡 使用 "help" 查看可用命令');
      process.exit(1);
  }
}

// 直接运行主程序
main();

export {
  getCurrentMode,
  switchToMode,
  showStatus
};
