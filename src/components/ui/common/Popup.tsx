/**
 * @file Popup.tsx
 * @description 通用的、高阶的Popup组件，负责处理定位、动画和渲染。
 */

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { PopupOptions } from "../../../types/services";

interface PopupProps {
  id: string;
  content: React.ReactNode;
  options: PopupOptions;
  zIndex: number;
  onClose: () => void;
}

export const Popup: React.FC<PopupProps> = ({
  id,
  content,
  options,
  zIndex,
  onClose,
}) => {
  const { targetElement, position: preferredPosition = "auto" } = options;
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // 计算位置
  useLayoutEffect(() => {
    if (!popupRef.current) return;

    const popupEl = popupRef.current;
    let newPos = { x: 0, y: 0 };

    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = popupEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 默认定位在目标元素下方
      let top = targetRect.bottom + 8;
      let left = targetRect.left;

      // 边界检测
      if (left + popupRect.width > viewportWidth - 8) {
        left = viewportWidth - popupRect.width - 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (top + popupRect.height > viewportHeight - 8) {
        top = targetRect.top - popupRect.height - 8;
      }

      newPos = { x: left + window.scrollX, y: top + window.scrollY };
    } else {
      // 如果没有目标元素，居中显示
      newPos = {
        x: (window.innerWidth - popupEl.offsetWidth) / 2 + window.scrollX,
        y: (window.innerHeight - popupEl.offsetHeight) / 2 + window.scrollY,
      };
    }

    setPosition(newPos);
    setIsVisible(true); // 计算完位置后设为可见
  }, [targetElement, preferredPosition]);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // 延迟添加事件监听，避免初始渲染时立即触发
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const popupStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: zIndex,
    visibility: isVisible ? "visible" : "hidden",
    // 可以在这里添加动画相关的样式
    transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "scale(1)" : "scale(0.95)",
  };

  return (
    <div ref={popupRef} id={`lucid-toolfull-${id}`} style={popupStyle}>
      {content}
    </div>
  );
};
