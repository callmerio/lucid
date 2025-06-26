/**
 * Tooltip 基础UI组件
 * 负责tooltip的纯UI渲染，不包含业务逻辑
 */

import React from "react";
import "../../styles/components/Tooltip.css";
import { TooltipProps } from "@components/types";

export const Tooltip: React.FC<TooltipProps> = ({
  word,
  translation,
  phonetic,
  partOfSpeech,
  className = "",
  testId = "lucid-tooltip",
  onExpand,
  onCollapse,
  onClose: _onClose,
}) => {
  const handleExpand = () => {
    onExpand?.();
  };

  const handleCollapse = () => {
    onCollapse?.();
  };

  return (
    <div
      className={`lucid-tooltip lucid-tooltip-visible ${className}`}
      data-testid={testId}
      data-word={word}
    >
      <div className="lucid-tooltip-content">
        <div className="lucid-tooltip-main">
          <span className="lucid-tooltip-text">
            {translation}
            {phonetic && (
              <span className="lucid-tooltip-phonetic"> {phonetic}</span>
            )}
            {partOfSpeech && (
              <span className="lucid-tooltip-pos"> ({partOfSpeech})</span>
            )}
          </span>
          <div className="lucid-tooltip-hover-zone"></div>
        </div>

        <div className="lucid-tooltip-actions">
          <button
            className="lucid-tooltip-btn lucid-tooltip-btn-down"
            title="减少高亮计数"
            onClick={handleCollapse}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 1228 1024"
              fill="currentColor"
            >
              <path d="M858.303391 402.567077a50.637368 50.637368 0 0 0-71.601239 0L607.648418 581.570174 428.594684 402.567077A50.637368 50.637368 0 0 0 356.993446 474.168316l214.854353 214.854353a50.637368 50.637368 0 0 0 71.601239 0l214.854353-214.854353a50.637368 50.637368 0 0 0 0-71.601239z" />
            </svg>
          </button>

          <button
            className="lucid-tooltip-btn lucid-tooltip-btn-like"
            title="切换高亮状态"
            onClick={handleExpand}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 1024 1024"
              fill="currentColor"
            >
              <path d="M533.504 268.288q33.792-41.984 71.68-75.776 32.768-27.648 74.24-50.176t86.528-19.456q63.488 5.12 105.984 30.208t67.584 63.488 34.304 87.04 6.144 99.84-17.92 97.792-36.864 87.04-48.64 74.752-53.248 61.952q-40.96 41.984-85.504 78.336t-84.992 62.464-73.728 41.472-51.712 15.36q-20.48 1.024-52.224-14.336t-69.632-41.472-79.872-61.952-82.944-75.776q-26.624-25.6-57.344-59.392t-57.856-74.24-46.592-87.552-21.504-100.352 11.264-99.84 39.936-83.456 65.536-61.952 88.064-35.328q24.576-5.12 49.152-1.536t48.128 12.288 45.056 22.016 40.96 27.648q45.056 33.792 86.016 80.896z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
