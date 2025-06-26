/**
 * Tooltip管理器 - 处理高亮单词的hover解释显示
 */

import { UI_EVENTS } from '@constants/uiEvents';
import {
  calculateHighlight,
  decreaseWordHighlight,
  toggleWordHighlightState,
  type ToggleHighlightContext
} from '@utils/highlight/highlightUtils';
import { simpleEventManager, SimpleEventManager } from '../simpleEventManager';

// 模拟翻译数据 - 实际项目中应该从API获取
const MOCK_TRANSLATIONS: Record<string, {
  word: string;
  phonetic?: string;
  translation: string;
  partOfSpeech?: string;
}> = {
  "tailwind": {
    word: "Tailwind",
    phonetic: "/ˈteɪlwɪnd/",
    translation: "n. 顺风; 有利条件; 推动力",
    partOfSpeech: "noun"
  },
  "css": {
    word: "CSS",
    phonetic: "/siː es es/",
    translation: "n. 层叠样式表; 网页样式语言",
    partOfSpeech: "noun"
  },
  "framework": {
    word: "framework",
    phonetic: "/ˈfreɪmwɜːrk/",
    translation: "n. 框架; 结构; 体系",
    partOfSpeech: "noun"
  },
  "utility": {
    word: "utility",
    phonetic: "/juːˈtɪləti/",
    translation: "n. 实用性; 效用; 公用事业",
    partOfSpeech: "noun"
  },
  "component": {
    word: "component",
    phonetic: "/kəmˈpoʊnənt/",
    translation: "n. 组件; 成分; 部件",
    partOfSpeech: "noun"
  },
  "design": {
    word: "design",
    phonetic: "/dɪˈzaɪn/",
    translation: "n./v. 设计; 图案; 计划",
    partOfSpeech: "noun/verb"
  },
  "modern": {
    word: "modern",
    phonetic: "/ˈmɑːdərn/",
    translation: "adj. 现代的; 时髦的; 新式的",
    partOfSpeech: "adjective"
  },
  "website": {
    word: "website",
    phonetic: "/ˈwebsaɪt/",
    translation: "n. 网站; 网址",
    partOfSpeech: "noun"
  },
  "documentation": {
    word: "documentation",
    phonetic: "/ˌdɑːkjumenˈteɪʃn/",
    translation: "n. 文档; 文件; 证明材料",
    partOfSpeech: "noun"
  },
  "comprehensive": {
    word: "comprehensive",
    phonetic: "/ˌkɑːmprɪˈhensɪv/",
    translation: "adj. 全面的; 综合的; 详尽的",
    partOfSpeech: "adjective"
  },
  "development": {
    word: "development",
    phonetic: "/dɪˈveləpmənt/",
    translation: "n. 发展; 开发; 发育",
    partOfSpeech: "noun"
  },
  "react": {
    word: "React",
    phonetic: "/riˈækt/",
    translation: "n. React框架; 反应",
    partOfSpeech: "noun"
  },
  "javascript": {
    word: "JavaScript",
    phonetic: "/ˈdʒɑːvəskrɪpt/",
    translation: "n. JavaScript编程语言",
    partOfSpeech: "noun"
  },
  "typescript": {
    word: "TypeScript",
    phonetic: "/ˈtaɪpskrɪpt/",
    translation: "n. TypeScript编程语言",
    partOfSpeech: "noun"
  },
  "year": {
    word: "year",
    phonetic: "/jɪr/",
    translation: "n. 年; 年纪; 一年的期间; 某年级的学生",
    partOfSpeech: "noun"
  }
};

// 导入新的 mock data 服务
import { mockDataService } from '@services/mock/mockDataService';

/**
 * 获取单词的翻译信息 - 使用新的 mock data 服务
 */
export async function getWordTranslation(word: string) {
  // 使用新的 mock data 服务
  try {
    const mockData = await mockDataService.getTooltipData(word);

    if (mockData && mockData.words && mockData.words.length > 0) {
      // 尝试根据单词名称匹配mock数据
      const wordData = mockData.words.find((w: any) =>
        w.word.toLowerCase() === word.toLowerCase()
      ) || mockData.words[0]; // 如果找不到匹配的，使用第一个作为fallback

      // 收集所有词性的中文翻译，优先使用chinese_short
      const allTranslations = wordData.explain?.map((explainGroup: any) =>
        explainGroup.definitions?.map((def: any) =>
          def.chinese_short || def.chinese
        ).filter(Boolean)
      ).flat().filter(Boolean) || [];

      // 使用第一个翻译作为主要翻译，如果有多个则用分号连接
      const translation = allTranslations.length > 0
        ? allTranslations.slice(0, 2).join('；') // 最多显示前两个翻译
        : "暂无翻译";

      return {
        word: wordData.word,
        phonetic: wordData.phonetic?.us || wordData.phonetic?.uk,
        translation: translation,
        partOfSpeech: wordData.explain?.[0]?.pos || "unknown"
      };
    }

  } catch (error) {
    console.warn('[Lucid] Failed to load mock data from service, falling back to hardcoded data:', error);
  }

  // 回退到硬编码数据
  const normalizedWord = word.toLowerCase().trim();
  return MOCK_TRANSLATIONS[normalizedWord] || {
    word: word,
    translation: "暂无翻译",
    partOfSpeech: "unknown"
  };
}

/**
 * 同步版本的获取翻译信息（为了兼容现有代码）
 */
export function getWordTranslationSync(word: string) {
  const normalizedWord = word.toLowerCase().trim();
  return MOCK_TRANSLATIONS[normalizedWord] || {
    word: word,
    translation: "暂无翻译",
    partOfSpeech: "unknown"
  };
}

/**
 * Tooltip管理器类
 */
export class TooltipManager {
  private static instance: TooltipManager;
  private currentTooltip: HTMLElement | null = null;
  private hideTimeout: number | null = null;
  private shiftKeyCleanup: (() => void) | null = null; // 简化的清理函数
  private currentTargetElement: HTMLElement | null = null; // 跟踪当前目标元素
  private globalEventCleanups: (() => void)[] = []; // 全局事件清理函数

  private constructor() {
    // 订阅全局事件
    this.setupGlobalEventListeners();
  }

  /**
   * 设置全局事件监听器
   */
  private setupGlobalEventListeners(): void {
    // 监听全局隐藏事件
    const hideAllCleanup = simpleEventManager.subscribeGlobalEvent(
      UI_EVENTS.UI_STATE.HIDE_ALL,
      (event) => {
        if (event.payload.except !== 'tooltip') {
          this.hideTooltip(0);
        }
      },
      {},
      'TooltipManager'
    );

    this.globalEventCleanups.push(hideAllCleanup);
  }

  static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  /**
   * 获取页面body p元素的字体大小
   */
  private getBodyPFontSize(): number {
    // 尝试获取body p元素的字体大小
    const bodyP = document.querySelector('body p');
    if (bodyP) {
      const computedStyle = window.getComputedStyle(bodyP);
      const fontSize = parseFloat(computedStyle.fontSize);
      if (!isNaN(fontSize)) {
        return fontSize;
      }
    }

    // 如果没有找到body p，尝试获取body的字体大小
    const body = document.body;
    if (body) {
      const computedStyle = window.getComputedStyle(body);
      const fontSize = parseFloat(computedStyle.fontSize);
      if (!isNaN(fontSize)) {
        return fontSize;
      }
    }

    // 默认返回16px
    return 16;
  }

  /**
   * 获取当前单词的高亮状态信息
   */
  private getCurrentWordState(targetElement: HTMLElement): {
    word: string;
    markCount: number;
    baseColor: string;
    isHighlighted: boolean;
    isDarkText: boolean;
  } {
    const word = targetElement.dataset.word || '';
    const markCount = parseInt(targetElement.dataset.markCount || '0');
    const baseColor = targetElement.dataset.baseColor || 'orange';
    const isHighlighted = markCount > 0;

    // 检测文本颜色模式
    const computedColor = window.getComputedStyle(targetElement.parentElement || document.body).color;
    const [r, g, b] = computedColor.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const isDarkText = brightness < 128;

    return {
      word,
      markCount,
      baseColor,
      isHighlighted,
      isDarkText
    };
  }

  /**
   * 计算按钮的颜色样式
   */
  private calculateButtonColors(wordState: {
    markCount: number;
    baseColor: string;
    isHighlighted: boolean;
    isDarkText: boolean;
  }): {
    downButtonColor: string;
    likeButtonColor: string;
    likeButtonBg: string;
  } {
    const { markCount, baseColor, isHighlighted, isDarkText } = wordState;

    let downButtonColor = 'rgba(255, 255, 255, 0.8)'; // 默认颜色
    let likeButtonColor = 'rgba(255, 255, 255, 0.8)';
    let likeButtonBg = 'rgba(255, 255, 255, 0.1)';

    if (isHighlighted && markCount > 0) {
      // 使用高亮颜色计算逻辑
      const { hex } = calculateHighlight(baseColor, markCount, isDarkText);
      downButtonColor = hex;

      // 爱心按钮在高亮状态下显示为红色
      likeButtonColor = 'white';
      likeButtonBg = 'rgba(255, 107, 107, 0.8)';
    }

    return {
      downButtonColor,
      likeButtonColor,
      likeButtonBg
    };
  }

  /**
   * 显示tooltip
   */
  async showTooltip(targetElement: HTMLElement, word: string): Promise<void> {
    // 使用安全执行包装
    await SimpleEventManager.safeExecute(async () => {
      // 清除之前的隐藏定时器
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }

      // 如果已有tooltip且是同一个词，直接返回
      if (this.currentTooltip && this.currentTooltip.dataset.word === word) {
        return;
      }

      // 移除现有tooltip
      this.hideTooltip(0); // 立即隐藏，不延迟

      // 🔧 修复：显示tooltip时自动隐藏toolpopup，避免同时显示两个弹窗
      simpleEventManager.dispatchGlobalEvent(
        UI_EVENTS.UI_STATE.HIDE_ALL,
        { except: 'tooltip', reason: 'tooltip-showing' },
        'TooltipManager'
      );

      // 获取翻译信息（异步）
      const translation = await getWordTranslation(word);

      // 创建tooltip元素
      const tooltip = this.createTooltipElement(translation, targetElement);
      tooltip.dataset.word = word;

      // 保存当前目标元素引用
      this.currentTargetElement = targetElement;

      // 设置动态字体大小（页面body p字体的90%）
      const bodyPFontSize = this.getBodyPFontSize();
      const tooltipFontSize = bodyPFontSize * 0.9;
      const tooltipContent = tooltip.querySelector('.lucid-tooltip-content') as HTMLElement;
      const tooltipText = tooltip.querySelector('.lucid-tooltip-text') as HTMLElement;
      const tooltipActions = tooltip.querySelector('.lucid-tooltip-actions') as HTMLElement;

      if (tooltipContent) {
        tooltipContent.style.fontSize = `${tooltipFontSize}px`;

        // 根据字体大小动态调整容器高度
        const dynamicHeight = Math.max(20, tooltipFontSize * 1.4); // 字体大小的1.4倍作为最小高度
        const dynamicPadding = Math.max(4, tooltipFontSize * 0.3); // 字体大小的0.3倍作为内边距

        tooltipContent.style.minHeight = `${dynamicHeight}px`;
        tooltipContent.style.padding = `${dynamicPadding}px 10px`;

        if (tooltipText) {
          tooltipText.style.minHeight = `${dynamicHeight}px`;
          tooltipText.style.lineHeight = `${tooltipFontSize * 1.2}px`;
        }

        if (tooltipActions) {
          tooltipActions.style.height = `${dynamicHeight}px`;
        }
      }

      // 添加到DOM
      document.body.appendChild(tooltip);
      this.currentTooltip = tooltip;

      // 计算位置
      this.positionTooltip(tooltip, targetElement);

      // 显示动画
      requestAnimationFrame(() => {
        tooltip.classList.add('lucid-tooltip-visible');
        this.addShiftKeyListener(targetElement, word); // Add listener when tooltip is shown
      });
    }, 'Error in showTooltip');
  }

  /**
   * 取消隐藏tooltip
   */
  cancelHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * 隐藏tooltip
   */
  hideTooltip(delay: number = 800): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (delay === 0) {
      // 立即隐藏
      if (this.currentTooltip) {
        this.currentTooltip.remove();
        this.currentTooltip = null;
      }
      this.removeShiftKeyListener(); // Remove listener when tooltip is hidden
      this.hideTimeout = null;
      return;
    }

    this.hideTimeout = window.setTimeout(() => {
      if (this.currentTooltip) {
        // 如果tooltip处于扩展状态，同时触发按钮退出动画
        const actions = this.currentTooltip.querySelector('.lucid-tooltip-actions') as HTMLElement;
        if (this.currentTooltip.classList.contains('lucid-tooltip-expanded') && actions) {
          // 按钮退出动画与整体退出动画同时开始 - 向左滑动消失
          actions.style.opacity = '0';
          actions.style.transform = 'translateX(-15px) scale(0.8)';
        }

        this.currentTooltip.classList.remove('lucid-tooltip-visible');
        this.removeShiftKeyListener(); // Remove listener when tooltip is hidden
        setTimeout(() => {
          if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
          }
        }, 200); // 等待淡出动画完成
      }
      this.hideTimeout = null;
    }, delay);
  }

  /**
   * 创建tooltip元素
   */
  private createTooltipElement(
    translation: {
      word: string;
      phonetic?: string;
      translation: string;
      partOfSpeech?: string;
    },
    targetElement: HTMLElement
  ): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'lucid-tooltip';

    // 获取当前单词状态
    const wordState = this.getCurrentWordState(targetElement);
    const buttonColors = this.calculateButtonColors(wordState);

    const content = `
      <div class="lucid-tooltip-content">
        <div class="lucid-tooltip-main">
          <span class="lucid-tooltip-text">${translation.translation}</span>
          <div class="lucid-tooltip-hover-zone"></div>
        </div>
        <div class="lucid-tooltip-actions">
          <button class="lucid-tooltip-btn lucid-tooltip-btn-down" title="减少高亮计数" style="color: ${buttonColors.downButtonColor};">
            <svg width="22" height="22" viewBox="0 0 1228 1024" fill="currentColor">
              <path d="M858.303391 402.567077a50.637368 50.637368 0 0 0-71.601239 0L607.648418 581.570174 428.594684 402.567077A50.637368 50.637368 0 0 0 356.993446 474.168316l214.854353 214.854353a50.637368 50.637368 0 0 0 71.601239 0l214.854353-214.854353a50.637368 50.637368 0 0 0 0-71.601239z"/>
            </svg>
          </button>
          <button class="lucid-tooltip-btn lucid-tooltip-btn-like ${wordState.isHighlighted ? 'lucid-tooltip-btn-liked' : ''}" title="${wordState.isHighlighted ? '移除所有高亮' : '添加高亮'}" style="color: ${buttonColors.likeButtonColor}; background-color: ${buttonColors.likeButtonBg};">
            <svg width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M533.504 268.288q33.792-41.984 71.68-75.776 32.768-27.648 74.24-50.176t86.528-19.456q63.488 5.12 105.984 30.208t67.584 63.488 34.304 87.04 6.144 99.84-17.92 97.792-36.864 87.04-48.64 74.752-53.248 61.952q-40.96 41.984-85.504 78.336t-84.992 62.464-73.728 41.472-51.712 15.36q-20.48 1.024-52.224-14.336t-69.632-41.472-79.872-61.952-82.944-75.776q-26.624-25.6-57.344-59.392t-57.856-74.24-46.592-87.552-21.504-100.352 11.264-99.84 39.936-83.456 65.536-61.952 88.064-35.328q24.576-5.12 49.152-1.536t48.128 12.288 45.056 22.016 40.96 27.648q45.056 33.792 86.016 80.896z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    tooltip.innerHTML = content;

    // 获取关键元素
    const tooltipContent = tooltip.querySelector('.lucid-tooltip-content') as HTMLElement;
    const hoverZone = tooltip.querySelector('.lucid-tooltip-hover-zone') as HTMLElement;
    const actions = tooltip.querySelector('.lucid-tooltip-actions') as HTMLElement;
    const downBtn = tooltip.querySelector('.lucid-tooltip-btn-down') as HTMLElement;
    const likeBtn = tooltip.querySelector('.lucid-tooltip-btn-like') as HTMLElement;

    // 添加基础鼠标事件防止tooltip消失
    tooltip.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    tooltip.addEventListener('mouseleave', () => {
      this.hideTooltip(200);
    });

    // 添加右侧扩展功能
    this.setupTooltipExpansion(tooltip, tooltipContent, hoverZone, actions);

    // 添加按钮事件
    this.setupButtonEvents(downBtn, likeBtn, translation, targetElement, wordState);

    return tooltip;
  }

  /**
   * 设置tooltip右侧扩展功能
   */
  private setupTooltipExpansion(
    tooltip: HTMLElement,
    tooltipContent: HTMLElement,
    hoverZone: HTMLElement,
    actions: HTMLElement
  ): void {
    let isExpanded = false;

    // 监听鼠标在tooltip内的移动
    tooltipContent.addEventListener('mousemove', (e) => {
      const rect = tooltipContent.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const expandThreshold = rect.width * (3 / 5); // 右侧2/5区域的起始位置 (从3/5开始)
      const collapseThreshold = rect.width * (1 / 3); // 左侧1/3区域的结束位置

      if (mouseX >= expandThreshold && !isExpanded) {
        // 鼠标进入右侧2/5区域，立即扩展
        this.expandTooltip(tooltip, tooltipContent, actions);
        isExpanded = true;
      } else if (mouseX <= collapseThreshold && isExpanded) {
        // 鼠标进入左侧1/3区域，立即收缩
        this.collapseTooltip(tooltip, tooltipContent, actions);
        isExpanded = false;
      }
    });

    // 鼠标离开tooltip时收缩
    tooltip.addEventListener('mouseleave', () => {
      if (isExpanded) {
        this.collapseTooltip(tooltip, tooltipContent, actions);
        isExpanded = false;
      }
      // 延迟隐藏tooltip，让用户有时间重新进入
      this.hideTooltip(200);
    });
  }

  /**
   * 扩展tooltip
   */
  private expandTooltip(
    tooltip: HTMLElement,
    tooltipContent: HTMLElement,
    actions: HTMLElement
  ): void {
    actions.style.display = 'flex';
    tooltip.classList.add('lucid-tooltip-expanded');

    actions.style.opacity = '0';
    actions.style.transform = 'translateX(15px) scale(0.8)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        actions.style.opacity = '1';
        actions.style.transform = 'translateX(0) scale(1)';
      });
    });
  }

  /**
   * 收缩tooltip
   */
  private collapseTooltip(
    tooltip: HTMLElement,
    tooltipContent: HTMLElement,
    actions: HTMLElement
  ): void {
    actions.style.opacity = '0';
    actions.style.transform = 'translateX(-15px) scale(0.8)';

    tooltip.classList.remove('lucid-tooltip-expanded');

    setTimeout(() => {
      if (actions.style.opacity === '0') {
        actions.style.display = 'none';
      }
    }, 400 + 50);
  }

  /**
   * 设置按钮事件
   */
  private setupButtonEvents(
    downBtn: HTMLElement,
    likeBtn: HTMLElement,
    translation: { word: string; phonetic?: string; translation: string; partOfSpeech?: string; },
    targetElement: HTMLElement,
    wordState: { word: string; markCount: number; baseColor: string; isHighlighted: boolean; isDarkText: boolean; }
  ): void {
    // 下三角按钮 - 减少高亮计数
    downBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log(`[Lucid] 减少高亮计数: ${wordState.word}, 当前计数: ${wordState.markCount}`);

      if (wordState.isHighlighted && wordState.markCount > 0) {
        try {
          await decreaseWordHighlight(wordState.word, targetElement, wordState.isDarkText);
          // 刷新tooltip以反映最新状态，而不是隐藏
          this.refreshTooltip(targetElement, wordState.word);
        } catch (error) {
          console.error(`[Lucid] Error decreasing highlight for "${wordState.word}":`, error);
        }
      }
    });

    // 爱心按钮 - 切换高亮状态
    likeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const button = e.currentTarget as HTMLButtonElement;

      if (button.disabled) {
        return;
      }

      button.disabled = true;

      const currentWord = wordState.word;
      const currentIsDarkText = wordState.isDarkText;
      const context: ToggleHighlightContext = { sourceElement: targetElement };

      try {
        await toggleWordHighlightState(currentWord, currentIsDarkText, context);
        this.refreshTooltip(targetElement, currentWord);
      } catch (error) {
        console.error(`[Lucid] Error in likeBtn click for "${currentWord}" (via toggleWordHighlightState):`, error);
      } finally {
        button.disabled = false;
      }
    });
  }

  /**
   * 刷新tooltip以反映最新的高亮状态
   */
  private refreshTooltip(targetElement: HTMLElement, word: string): void {
    if (!this.currentTooltip) {
      return;
    }

    // 获取最新的单词状态
    // 如果高亮被移除，targetElement 可能不再有正确的 dataset，所以我们需要查找页面上的其他实例
    let wordState;
    const remainingHighlights = document.querySelectorAll<HTMLElement>('.lucid-highlight');
    const sameWordHighlight = Array.from(remainingHighlights).find(el => el.dataset.word === word);

    if (sameWordHighlight) {
      // 如果还有相同词汇的高亮存在，使用它的状态
      wordState = this.getCurrentWordState(sameWordHighlight);
    } else {
      // 如果没有高亮了，创建一个默认的未高亮状态
      wordState = {
        word: word,
        markCount: 0,
        baseColor: 'orange',
        isHighlighted: false,
        isDarkText: false
      };
    }

    const buttonColors = this.calculateButtonColors(wordState);

    // 更新按钮颜色和状态
    const downBtn = this.currentTooltip.querySelector('.lucid-tooltip-btn-down') as HTMLElement;
    const likeBtn = this.currentTooltip.querySelector('.lucid-tooltip-btn-like') as HTMLElement;

    if (downBtn) {
      downBtn.style.color = buttonColors.downButtonColor;
      downBtn.title = wordState.isHighlighted ? '减少高亮计数' : '无高亮可减少';
    }

    if (likeBtn) {
      likeBtn.style.color = buttonColors.likeButtonColor;
      likeBtn.style.backgroundColor = buttonColors.likeButtonBg;
      likeBtn.title = wordState.isHighlighted ? '移除所有高亮' : '添加高亮';

      // 更新爱心按钮的状态类
      if (wordState.isHighlighted) {
        likeBtn.classList.add('lucid-tooltip-btn-liked');
      } else {
        likeBtn.classList.remove('lucid-tooltip-btn-liked');
      }
    }

    console.log(`[Lucid] Tooltip refreshed for word: "${word}", new state:`, wordState);
  }

  /**
   * 显示详细信息
   */
  private showDetailedInfo(translation: { word: string; phonetic?: string; translation: string; partOfSpeech?: string; }): void {
    // 创建详细信息弹窗或扩展当前tooltip
    console.log('显示详细信息:', translation);
    // TODO: 实现详细信息显示
  }

  /**
   * 切换单词收藏状态
   */
  private toggleWordFavorite(word: string, button: HTMLElement): void {
    const isLiked = button.classList.contains('lucid-tooltip-btn-liked');

    if (isLiked) {
      button.classList.remove('lucid-tooltip-btn-liked');
      console.log(`取消收藏: ${word}`);
    } else {
      button.classList.add('lucid-tooltip-btn-liked');
      console.log(`收藏: ${word}`);

      // 添加点击动画
      button.style.transform = 'scale(1.2)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }

    // TODO: 保存到storage
  }

  /**
   * 计算并设置tooltip位置
   */
  private positionTooltip(tooltip: HTMLElement, targetElement: HTMLElement): void {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 默认位置：目标元素下方左对齐，更靠近
    let left = targetRect.left;
    let top = targetRect.bottom + 4;

    // 水平边界检查
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // 垂直边界检查 - 如果下方空间不足，显示在上方
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = targetRect.top - tooltipRect.height - 4;
      tooltip.classList.add('lucid-tooltip-above');
    }

    // 设置位置
    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.style.top = `${top + window.scrollY}px`;
  }

  /**
   * Adds a keydown listener to check for Shift key press.
   */
  private addShiftKeyListener(targetElement: HTMLElement, word: string): void {
    // 移除现有监听器
    this.removeShiftKeyListener();

    // 创建新的监听器
    const shiftKeyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && this.currentTooltip) {
        event.preventDefault(); // Prevent any default Shift behavior
        console.log('[Lucid] Shift key pressed. Transitioning from tooltip to toolpopup.');

        const currentWord = this.currentTooltip.dataset.word || word;
        const currentTargetElement = this.currentTargetElement || targetElement;
        const currentTooltipElement = this.currentTooltip;

        // 立即隐藏tooltip，避免与toolpopup重叠
        this.hideTooltip(0);

        // 通过事件系统请求显示toolpopup，传递当前tooltip元素用于平滑过渡
        simpleEventManager.dispatchGlobalEvent(
          UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
          {
            word: currentWord,
            targetElement: currentTargetElement,
            fromTooltip: currentTooltipElement
          },
          'TooltipManager'
        );
      }
    };

    // 使用轻量级事件管理器添加监听器
    this.shiftKeyCleanup = simpleEventManager.addEventListener(
      document.documentElement,
      'keydown',
      shiftKeyHandler as EventListener,
      false
    );
  }

  /**
   * Removes the keydown listener for Shift key.
   */
  private removeShiftKeyListener(): void {
    if (this.shiftKeyCleanup) {
      this.shiftKeyCleanup();
      this.shiftKeyCleanup = null;
    }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.hideTooltip(0);
    this.removeShiftKeyListener();

    // 清理全局事件监听器
    this.globalEventCleanups.forEach(cleanup => cleanup());
    this.globalEventCleanups = [];

    this.currentTargetElement = null;
    console.log('[TooltipManager] Destroyed');
  }
}
