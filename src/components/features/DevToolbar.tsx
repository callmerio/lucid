import React, { useEffect, useState } from 'react';
import { StagewiseToolbar } from '@stagewise/toolbar-react';

// stagewise配置
const stagewiseConfig = {
  plugins: []
};

/**
 * 开发环境下的stagewise工具栏组件
 * 只在开发环境中渲染，不会包含在生产环境中
 */
export const DevToolbar: React.FC = () => {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // 在浏览器环境中检查是否为开发环境
    // 注意：在浏览器扩展中，process.env可能不可用，所以使用其他方式检测
    if (import.meta.env && import.meta.env.DEV) {
      setIsDev(true);
    }
  }, []);

  // 只在开发环境中渲染工具栏
  if (!isDev) {
    return null;
  }

  // 创建一个独立的DOM元素来渲染工具栏，避免干扰主应用
  return (
    <div id="stagewise-toolbar-container" style={{ position: 'fixed', bottom: 0, left: 0, zIndex: 9999 }}>
      <StagewiseToolbar config={stagewiseConfig} />
    </div>
  );
};

export default DevToolbar; 