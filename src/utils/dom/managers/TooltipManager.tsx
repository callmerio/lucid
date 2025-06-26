/**
 * TooltipManager - Tooltip 管理器 (重构版)
 * 作为协调器，整合各个专职管理器的功能
 */

import { popupService } from '../../../services/PopupService.tsx';
import { Tooltip } from '../../../components/ui/Tooltip';
import { TooltipStateManager } from './TooltipStateManager';

export interface TooltipManagerOptions {
  onWordAction?: (action: string, word: string) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
}

export interface ShowTooltipOptions {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  targetElement: HTMLElement;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export class TooltipManager {
  private static instance: TooltipManager;

  private stateManager: TooltipStateManager;

  private constructor(options: TooltipManagerOptions = {}) {
    // 初始化状态管理器
    this.stateManager = new TooltipStateManager();
    
    // 监听状态变化以同步渲染
    this.stateManager.addStateChangeListener((event) => {
      this.handleStateChange(event);
    });
  }

  /**
   * 获取单例实例
   */
  static getInstance(options?: TooltipManagerOptions): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager(options);
    }
    return TooltipManager.instance;
  }

  /**
   * 显示 tooltip
   */
  async showTooltip(options: ShowTooltipOptions): Promise<void> {
    const {
      word,
      translation,
      phonetic,
      partOfSpeech,
      targetElement,
      preferredPosition = 'auto',
    } = options;

    try {
      this.stateManager.show(word, targetElement);

      const tooltipContent = (
        <Tooltip
          word={word}
          translation={translation}
          phonetic={phonetic}
          partOfSpeech={partOfSpeech}
          visible={true}
          onExpand={() => this.stateManager.expand()}
          onCollapse={() => this.stateManager.collapse()}
          onClose={() => this.stateManager.hide(true)}
        />
      );

      popupService.show(`tooltip-${word}`, tooltipContent, {
        targetElement,
        position: preferredPosition,
      });

    } catch (error) {
      console.error('[TooltipManager] Error showing tooltip:', error);
      this.stateManager.hide(true);
      throw error;
    }
  }

  /**
   * 隐藏 tooltip
   */
  hideTooltip(immediate: boolean = false): void {
    const word = this.stateManager.getCurrentWord();
    if (word) {
      popupService.hide(`tooltip-${word}`);
    }
    this.stateManager.hide(immediate);
  }

  /**
   * 检查是否展开
   */
  isExpanded(): boolean {
    return this.stateManager.isExpanded();
  }

  /**
   * 获取当前单词
   */
  getCurrentWord(): string {
    return this.stateManager.getCurrentWord();
  }

  /**
   * 获取当前目标元素
   */
  getCurrentTargetElement(): HTMLElement | null {
    return this.stateManager.getCurrentTargetElement();
  }
}