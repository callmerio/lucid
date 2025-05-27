/**
 * Tooltip管理器 - 处理高亮单词的hover解释显示
 */

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

/**
 * 获取单词的翻译信息
 */
export function getWordTranslation(word: string) {
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

  private constructor() { }

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
   * 显示tooltip
   */
  showTooltip(targetElement: HTMLElement, word: string): void {
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

    // 获取翻译信息
    const translation = getWordTranslation(word);

    // 创建tooltip元素
    const tooltip = this.createTooltipElement(translation);
    tooltip.dataset.word = word;

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
    });
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
  private createTooltipElement(translation: {
    word: string;
    phonetic?: string;
    translation: string;
    partOfSpeech?: string;
  }): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'lucid-tooltip';

    const content = `
      <div class="lucid-tooltip-content">
        <div class="lucid-tooltip-main">
          <span class="lucid-tooltip-text">${translation.translation}</span>
          <div class="lucid-tooltip-hover-zone"></div>
        </div>
        <div class="lucid-tooltip-actions">
          <button class="lucid-tooltip-btn lucid-tooltip-btn-down" title="展开详情">
            <svg width="12" height="12" viewBox="0 0 1228 1024" fill="currentColor">
              <path d="M858.303391 402.567077a50.637368 50.637368 0 0 0-71.601239 0L607.648418 581.570174 428.594684 402.567077A50.637368 50.637368 0 0 0 356.993446 474.168316l214.854353 214.854353a50.637368 50.637368 0 0 0 71.601239 0l214.854353-214.854353a50.637368 50.637368 0 0 0 0-71.601239z"/>
            </svg>
          </button>
          <button class="lucid-tooltip-btn lucid-tooltip-btn-like" title="收藏单词">
            <svg width="12" height="12" viewBox="0 0 1024 1024" fill="currentColor">
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
    this.setupButtonEvents(downBtn, likeBtn, translation);

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
    // 预设初始状态
    actions.style.display = 'flex';
    actions.style.opacity = '0';
    actions.style.transform = 'translateX(-15px) scale(0.8)';

    tooltip.classList.add('lucid-tooltip-expanded');

    // 添加扩展动画 - 更流畅的向右拉升效果
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
    // 收缩动画 - 向左滑动消失并缩小
    actions.style.opacity = '0';
    actions.style.transform = 'translateX(-15px) scale(0.8)';

    setTimeout(() => {
      tooltip.classList.remove('lucid-tooltip-expanded');
      actions.style.display = 'none';
    }, 300); // 等待动画完成
  }

  /**
   * 设置按钮事件
   */
  private setupButtonEvents(
    downBtn: HTMLElement,
    likeBtn: HTMLElement,
    translation: { word: string; phonetic?: string; translation: string; partOfSpeech?: string; }
  ): void {
    // 下三角按钮 - 展开详情
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`[Lucid] 展开详情: ${translation.word}`);
      // TODO: 实现详情展开功能
      this.showDetailedInfo(translation);
    });

    // 大拇指按钮 - 收藏单词
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`[Lucid] 收藏单词: ${translation.word}`);
      // TODO: 实现收藏功能
      this.toggleWordFavorite(translation.word, likeBtn);
    });
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
}
