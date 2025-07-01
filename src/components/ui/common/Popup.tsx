/**
 * @file Popup.tsx
 * @description 通用的、高阶的Popup组件，现在只负责渲染内容和关闭逻辑。
 */

import React, { useEffect, useRef } from "react";
import { PopupOptions } from "@/types/services";

interface PopupProps {
  id: string;
  content: React.ReactNode;
  options: PopupOptions;
  onClose: () => void;
}

export const Popup: React.FC<PopupProps> = ({ id, content, options, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击事件是否发生在popupRef外部
      // 同时也要检查是否点击在触发弹窗的目标元素上，如果是，则不关闭
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !options.targetElement?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // 使用 'click' 事件并捕获，防止事件被内部组件阻止
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onClose, options.targetElement]);

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      // Shift 键处理由 TooltipManager 专门负责，避免重复
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 样式现在由外部的 hostElement 控制，这里只需要基础样式
  const popupStyle: React.CSSProperties = {
    // 动画效果可以保留
    transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
    opacity: 1,
    transform: "scale(1)",
  };

  return (
    // ID现在可以移到外部容器，或者保留用于测试
    <div ref={popupRef} id={`lucid-popup-content-${id}`} style={popupStyle}>
      {content}
    </div>
  );
};
