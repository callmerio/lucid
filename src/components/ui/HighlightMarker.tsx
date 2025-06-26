/**
 * HighlightMarker 高亮标记组件
 * 负责渲染高亮的文本标记
 */

import React from 'react';
import { HighlightMarkerProps } from '@components/types';

export const HighlightMarker: React.FC<HighlightMarkerProps> = ({
  word,
  count,
  baseColor,
  isDarkText: _isDarkText,
  className = '',
  testId = 'lucid-highlight',
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const handleClick = (_event: React.MouseEvent) => {
    _event.preventDefault();
    onClick?.();
  };

  const handleMouseEnter = (_event: React.MouseEvent) => {
    onMouseEnter?.();
  };

  const handleMouseLeave = (_event: React.MouseEvent) => {
    onMouseLeave?.();
  };

  return (
    <mark
      className={`lucid-highlight ${className}`}
      data-word={word}
      data-mark-count={count}
      data-base-color={baseColor}
      data-applied-timestamp={Date.now()}
      data-testid={testId}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {children || word}
    </mark>
  );
};