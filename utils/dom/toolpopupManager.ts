/**
 * ToolpopupManager - Handles the display of detailed word information.
 */

import { formatPhonetic } from '../text/phoneticUtils';

// 避免循环导入，使用延迟导入
let TooltipManager: any = null;

// Define a type for the detailed word data, based on dictionary.json structure
export interface WordDefinition {
    definition: string;
    chinese: string;
    chinese_short?: string;
}

export interface WordExplain {
    pos: string; // Part of Speech (e.g., "verb", "noun")
    definitions: WordDefinition[];
}

export interface WordPhonetic {
    us?: string;
    uk?: string;
    // Potentially other regions
}

export interface WordFormat {
    name: string;
    form: string;
}

export interface DetailedWordData {
    word: string;
    explain: WordExplain[];
    wordFormats?: WordFormat[];
    phonetic?: WordPhonetic;
    // Add other fields from dictionary.json as needed, e.g., relationships, metadata
}

export class ToolpopupManager {
    private static instance: ToolpopupManager;
    private currentToolpopup: HTMLElement | null = null;

    /**
     * 从CSS变量获取设计系统的值，避免硬编码
     */
    private getCSSVariable(variableName: string, fallback: string = ''): string {
        // 创建一个临时元素来获取CSS变量值
        const tempElement = document.createElement('div');
        tempElement.style.display = 'none';
        document.body.appendChild(tempElement);

        const computedStyle = getComputedStyle(tempElement);
        const value = computedStyle.getPropertyValue(variableName).trim();

        document.body.removeChild(tempElement);

        return value || fallback;
    }

    /**
     * 获取ToolPopup的标准宽度（从CSS变量）
     */
    private getToolpopupWidth(): string {
        return this.getCSSVariable('--lucid-width-toolpopup', '300px');
    }

    /**
     * 获取单词的标记次数
     * 优先从页面上的高亮元素获取，如果没有则从storage获取
     */
    private async getWordMarkCount(word: string): Promise<number> {
        // 首先尝试从页面上的高亮元素获取
        const highlightElements = document.querySelectorAll<HTMLElement>('.lucid-highlight');
        for (const element of highlightElements) {
            if (element.dataset.word === word.toLowerCase()) {
                const markCount = parseInt(element.dataset.markCount || '0');
                console.log(`[ToolpopupManager] Found mark count from DOM for "${word}": ${markCount}`);
                return markCount;
            }
        }

        // 如果页面上没有找到，从storage获取
        try {
            if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                const data = await browser.storage.local.get(['wordMarkings']);
                const wordMarkings = data.wordMarkings || {};
                const markCount = wordMarkings[word.toLowerCase()] || 0;
                console.log(`[ToolpopupManager] Found mark count from storage for "${word}": ${markCount}`);
                return markCount;
            }
        } catch (error) {
            console.warn(`[ToolpopupManager] Error getting mark count from storage for "${word}":`, error);
        }

        console.log(`[ToolpopupManager] No mark count found for "${word}", defaulting to 0`);
        return 0;
    }

    /**
     * 获取Tooltip的最大宽度（从CSS变量）
     */
    private getTooltipMaxWidth(): string {
        return this.getCSSVariable('--lucid-width-tooltip-max', '300px');
    }

    /**
     * 获取英文tooltip的最大宽度（比popup宽度小20px）
     */
    private getEnglishTooltipMaxWidth(): string {
        const toolpopupWidth = parseInt(this.getToolpopupWidth());
        return `${toolpopupWidth - 20}px`; // 留20px边距
    }

    private constructor() { }

    public static getInstance(): ToolpopupManager {
        if (!ToolpopupManager.instance) {
            ToolpopupManager.instance = new ToolpopupManager();
        }
        return ToolpopupManager.instance;
    }

    /**
     * 从mock数据文件获取单词的详细信息
     */
    private async loadMockData(): Promise<any> {
        try {
            // 在浏览器插件环境中，需要使用正确的URL路径
            let mockDataUrl = './mock-data/tooltip-mock-data.json';

            // 如果是在插件环境中，使用runtime.getURL
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
                mockDataUrl = browser.runtime.getURL('mock-data/tooltip-mock-data.json' as any);
            }

            console.log('[ToolpopupManager] Attempting to load mock data from:', mockDataUrl);
            const response = await fetch(mockDataUrl);
            if (!response.ok) {
                throw new Error(`Failed to load mock data: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('[ToolpopupManager] Mock data loaded successfully:', data);
            return data;
        } catch (error) {
            console.warn('[ToolpopupManager] Failed to load mock data file, falling back to hardcoded data:', error);
            return null;
        }
    }

    /**
     * Simulates fetching detailed word data.
     * In a real application, this would involve an API call.
     */
    private async getWordDetailedInfo(word: string): Promise<DetailedWordData | null> {
        console.log(`[ToolpopupManager] Fetching detailed info for: ${word}`);

        // 首先尝试从mock数据文件加载
        const mockData = await this.loadMockData();
        if (mockData && mockData.words && mockData.words.length > 0) {
            // 尝试根据单词名称匹配mock数据
            const wordData = mockData.words.find((w: any) =>
                w.word.toLowerCase() === word.toLowerCase()
            ) || mockData.words[0]; // 如果找不到匹配的，使用第一个作为fallback

            console.log('[ToolpopupManager] Using mock data file for:', word, wordData);

            return {
                word: wordData.word,
                phonetic: wordData.phonetic,
                explain: wordData.explain,
                wordFormats: wordData.wordFormats || []
            };
        }

        // 移除硬编码的escalade数据，完全依赖mock数据文件

        // 当mock数据中找不到对应单词时的fallback
        console.log(`[ToolpopupManager] No data found for word: ${word}, using fallback`);
        return {
            word: word,
            explain: [
                {
                    pos: "unknown",
                    definitions: [
                        {
                            definition: `Detailed information not available for "${word}" yet. Please check mock data file.`,
                            chinese: "暂无详细释义",
                            chinese_short: "暂无释义"
                        }
                    ]
                }
            ],
            phonetic: { us: "N/A" },
            wordFormats: []
        };
    }

    /**
     * 音节分割函数
     */
    private syllabify(word: string): string[] {
        if (!word || typeof word !== 'string') {
            return [word || ''];
        }

        const cleanWord = word.toLowerCase().trim();

        if (cleanWord.length <= 1) {
            return [word];
        }

        // 基础字典（最常用的单词）
        const basicDict: { [key: string]: string[] } = {
            'debug': ['de', 'bug'],
            'escalade': ['es', 'ca', 'lade'],
            'beautiful': ['beau', 'ti', 'ful'],
            'computer': ['com', 'pu', 'ter'],
            'technology': ['tech', 'nol', 'o', 'gy'],
            'information': ['in', 'for', 'ma', 'tion'],
            'development': ['de', 'vel', 'op', 'ment'],
            'javascript': ['ja', 'va', 'script'],
            'database': ['da', 'ta', 'base'],
            'keyboard': ['key', 'board'],
            'software': ['soft', 'ware'],
            'internet': ['in', 'ter', 'net'],
            'chocolate': ['choc', 'o', 'late'],
            'elephant': ['el', 'e', 'phant']
        };

        if (basicDict[cleanWord]) {
            return basicDict[cleanWord];
        }

        // 简单的音节分割算法
        const vowels = 'aeiouAEIOU';
        const syllables: string[] = [];
        let currentSyllable = '';

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            currentSyllable += char;

            if (vowels.includes(char)) {
                if (i + 1 < word.length) {
                    const nextChar = word[i + 1];
                    if (!vowels.includes(nextChar) && i + 2 < word.length) {
                        const nextNextChar = word[i + 2];
                        if (vowels.includes(nextNextChar)) {
                            currentSyllable += nextChar;
                            syllables.push(currentSyllable);
                            currentSyllable = '';
                            i++;
                        }
                    }
                }
            }
        }

        if (currentSyllable) {
            syllables.push(currentSyllable);
        }

        return syllables.length > 0 ? syllables : [word];
    }



    /**
     * 显示音节分割的单词
     */
    private createSyllabifiedWordHTML(word: string): string {
        const syllables = this.syllabify(word);

        return syllables.map((syllable, index) => {
            let html = `<span class="lucid-toolpopup-syllable">${syllable}</span>`;

            // 添加分隔符（除了最后一个音节）
            if (index < syllables.length - 1) {
                html += `<span class="lucid-toolpopup-syllable-separator">·</span>`;
            }

            return html;
        }).join('');
    }

    /**
     * 分割文本为可点击的单词
     */
    private splitTextIntoWords(text: string): string {
        // 按空格分割但保持标点符号
        const words = text.split(/(\s+)/).filter(word => word.trim() !== '');

        return words.map(word => {
            // 跳过纯空白
            if (/^\s+$/.test(word)) {
                return word;
            }

            // 为每个单词创建span
            return `<span class="lucid-toolpopup-definition-word" onclick="this.dispatchEvent(new CustomEvent('wordClick', {detail: '${word.replace(/[^\w]/g, '')}', bubbles: true}))">${word}</span>`;
        }).join('');
    }

    /**
     * Creates the HTML element for the toolpopup.
     */
    private createToolpopupElement(wordDetails: DetailedWordData, markCount: number = 0): HTMLElement {
        const popup = document.createElement('div');
        popup.className = 'lucid-toolpopup-container'; // Use styles from toolpopup.html

        // 创建音标HTML
        let phoneticHTML = '';
        if (wordDetails.phonetic?.us) {
            const formattedUSPhonetic = formatPhonetic(wordDetails.phonetic.us);
            phoneticHTML += `
                <div class="lucid-toolpopup-phonetic-group us-phonetic" onclick="this.dispatchEvent(new CustomEvent('playPronunciation', {detail: {word: '${wordDetails.word}', region: 'us'}, bubbles: true}))">
                    <span class="lucid-toolpopup-phonetic-region">US</span>
                    <span class="lucid-toolpopup-phonetic-text">${formattedUSPhonetic}</span>
                </div>
            `;
        }
        if (wordDetails.phonetic?.uk && wordDetails.phonetic.us !== wordDetails.phonetic.uk) {
            const formattedUKPhonetic = formatPhonetic(wordDetails.phonetic.uk);
            phoneticHTML += `
                <div class="lucid-toolpopup-phonetic-group uk-phonetic" onclick="this.dispatchEvent(new CustomEvent('playPronunciation', {detail: {word: '${wordDetails.word}', region: 'uk'}, bubbles: true}))">
                    <span class="lucid-toolpopup-phonetic-region">UK</span>
                    <span class="lucid-toolpopup-phonetic-text">${formattedUKPhonetic}</span>
                </div>
            `;
        }

        // 创建定义HTML，包含智能滑动功能
        const definitionsHTML = wordDetails.explain.map((group, index) => {
            // Determine POS class for styling, matching toolpopup.html
            let posClass = 'lucid-toolpopup-pos';
            const lowerPos = group.pos.toLowerCase();

            if (lowerPos.startsWith('n')) {
                // Special case for the 4th item (index 3) as per image styling for 'Project'
                if (wordDetails.word.toLowerCase() === 'project' && index === 3) {
                    posClass += ' pos-n-dynamic';
                } else {
                    posClass += ' pos-n';
                }
            } else if (lowerPos.startsWith('v') && !lowerPos.includes('auxiliary')) {
                posClass += ' pos-v';
            } else if (lowerPos.startsWith('web')) {
                posClass += ' pos-web';
            } else if (lowerPos === 'verb') {
                posClass += ' pos-verb';
            } else if (lowerPos === 'auxiliary verb') {
                posClass += ' pos-auxiliary-verb';
            }

            const defs = group.definitions.map(def => {
                // 使用 chinese_short 作为显示文本
                const chineseText = def.chinese_short || def.chinese;
                // 创建带有智能滑动功能的英文tooltip
                const englishTooltipContent = this.createSmartSlidingTooltip(def.definition);

                return `<span class="lucid-toolpopup-definition-text-chinese">${chineseText}<span class="lucid-toolpopup-definition-text-english-tooltip">${englishTooltipContent}</span></span>`;
            }).join("<br>");

            return `
                <div class="lucid-toolpopup-explain-group">
                    <div class="lucid-toolpopup-definition">
                        <span class="${posClass}">${group.pos}</span>
                        ${defs}
                    </div>
                </div>
            `;
        }).join('');

        popup.innerHTML = `
            <div class="lucid-toolpopup-header">
                <span class="lucid-toolpopup-word">${this.createSyllabifiedWordHTML(wordDetails.word)}</span>
                <div class="lucid-toolpopup-header-icons">
                    <svg t="1748503165621" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3121"><path d="M325.973333 833.28h-38.826666a106.666667 106.666667 0 0 1-106.666667-106.666667V441.173333a106.666667 106.666667 0 0 1 106.666667-106.666666h38.826666a21.333333 21.333333 0 0 1 21.333334 21.333333v456.106667a21.333333 21.333333 0 0 1-21.333334 21.333333z m-38.826666-456.106667a64 64 0 0 0-64 64v285.44a64 64 0 0 0 64 64h17.493333V377.173333z" p-id="3122"></path><path d="M758.613333 832H325.973333a21.333333 21.333333 0 0 1-21.333333-21.333333V355.84a21.333333 21.333333 0 0 1 21.333333-21.333333h8.96l99.413334-158.933334A85.333333 85.333333 0 0 1 595.84 213.333333v121.6h166.826667a100.906667 100.906667 0 0 1 75.52 34.346667 104.96 104.96 0 0 1 25.386666 82.986667l-43.946666 325.973333A62.08 62.08 0 0 1 758.613333 832z m-411.306666-42.666667h411.306666a19.413333 19.413333 0 0 0 18.773334-17.28L821.333333 448a62.293333 62.293333 0 0 0-15.146666-49.28 57.386667 57.386667 0 0 0-42.666667-19.84h-188.586667a21.333333 21.333333 0 0 1-21.333333-21.333333V213.333333a42.666667 42.666667 0 0 0-80.64-17.493333l-1.28 2.346667-106.666667 170.666666a21.333333 21.333333 0 0 1-17.493333 10.026667z" p-id="3123"></path></svg>
                    <svg class="icon-heart" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </div>
            </div>
            <div class="lucid-toolpopup-phonetic">
                ${phoneticHTML}
            </div>
            <div class="lucid-toolpopup-definitions-area">
                ${definitionsHTML}
            </div>
            <div class="lucid-toolpopup-footer">
                <div class="lucid-toolpopup-history">
                    <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
                    <span class="lucid-toolpopup-history-count">${markCount}</span>
                </div>
                <div class="lucid-toolpopup-actions">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                </div>
            </div>
        `;

        // 添加事件监听器
        this.addToolpopupEventListeners(popup, wordDetails.word);

        return popup;
    }

    /**
     * 创建智能滑动tooltip内容
     */
    private createSmartSlidingTooltip(text: string): string {
        const wordsHTML = this.splitTextIntoWords(text);

        return `
            <div class="lucid-tooltip-text-container">
                <div class="lucid-tooltip-text-content">${wordsHTML}</div>
                <div class="lucid-tooltip-hover-zone right"></div>
                <div class="lucid-tooltip-hover-zone left"></div>
                <div class="lucid-tooltip-scroll-hint"></div>
            </div>
        `;
    }

    /**
     * 添加toolpopup事件监听器
     */
    private addToolpopupEventListeners(popup: HTMLElement, word: string): void {
        // 发音事件监听
        popup.addEventListener('playPronunciation', (event: Event) => {
            const customEvent = event as CustomEvent;
            const { word: pronunciationWord, region } = customEvent.detail;
            this.playPronunciation(pronunciationWord, region);
        });

        // 单词点击事件监听
        popup.addEventListener('wordClick', (event: Event) => {
            const customEvent = event as CustomEvent;
            const clickedWord = customEvent.detail;
            this.handleWordClick(clickedWord);
        });

        // 初始化智能滑动功能
        this.initializeSmartSliding(popup);

        // 点击外部关闭
        const closeHandler = (event: Event) => {
            if (!popup.contains(event.target as Node)) {
                this.hideToolpopup();
                document.removeEventListener('click', closeHandler);
            }
        };

        // 延迟添加点击外部关闭，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 100);

        // ESC键关闭
        const escHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.hideToolpopup();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * 播放发音
     */
    private playPronunciation(word: string, region: string): void {
        console.log(`[ToolpopupManager] Playing ${region.toUpperCase()} pronunciation for "${word}"`);

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = region === 'us' ? 'en-US' : 'en-GB';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    /**
     * 处理单词点击
     */
    private handleWordClick(word: string): void {
        console.log(`[ToolpopupManager] Word clicked: "${word}"`);

        // 可以在这里添加更多功能，比如：
        // - 查找单词定义
        // - 添加到词汇表
        // - 播放单词发音
        // - 打开词典

        // 示例：播放单词发音
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    /**
     * 判断单词是否为功能词（介词、冠词、连词等）
     */
    private isFunctionWord(word: string): boolean {
        const functionWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
            'between', 'among', 'under', 'over', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
            'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
            'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
            'her', 'its', 'our', 'their'
        ]);
        return functionWords.has(word.toLowerCase().replace(/[^\w]/g, ''));
    }

    /**
     * 寻找最优的单词边界位置（智能滑动）
     */
    private findOptimalWordBoundary(content: HTMLElement, currentOffset: number, containerWidth: number, direction: 'next' | 'prev'): number {
        const text = content.textContent || '';
        if (!text) return currentOffset;

        // 创建临时测量元素
        const measurer = document.createElement('span');
        measurer.style.visibility = 'hidden';
        measurer.style.position = 'absolute';
        measurer.style.whiteSpace = 'nowrap';
        measurer.style.font = window.getComputedStyle(content).font;
        document.body.appendChild(measurer);

        try {
            // 按单词分割文本（保留空格和标点）
            const words = text.split(/(\s+)/);
            const totalContentWidth = content.scrollWidth;
            const maxOffset = totalContentWidth - containerWidth;

            if (direction === 'next') {
                // 向前滑动：寻找合适的停止点
                const idealSlideDistance = containerWidth * 0.8; // 理想滑动距离为容器宽度的80%
                const targetOffset = currentOffset + idealSlideDistance;

                console.log(`[SmartSlide] Next direction: currentOffset=${currentOffset}, idealDistance=${idealSlideDistance}, targetOffset=${targetOffset}, maxOffset=${maxOffset}`);

                // 如果目标位置超过最大偏移，直接返回最大偏移
                if (targetOffset >= maxOffset) {
                    console.log(`[SmartSlide] Target exceeds max, returning maxOffset=${maxOffset}`);
                    return maxOffset;
                }

                let bestOffset = targetOffset;
                let bestScore = -1;
                let candidateCount = 0;

                // 寻找最佳单词边界
                for (let i = 0; i < words.length; i++) {
                    measurer.textContent = words.slice(0, i + 1).join('');
                    const wordEndWidth = measurer.offsetWidth;

                    // 只考虑在目标范围内的位置
                    if (wordEndWidth <= currentOffset || wordEndWidth > maxOffset) {
                        continue;
                    }

                    // 计算这个位置的得分
                    const distanceFromTarget = Math.abs(wordEndWidth - targetOffset);
                    const distanceFromCurrent = wordEndWidth - currentOffset;

                    // 确保有足够的滑动距离（至少容器宽度的50%）
                    if (distanceFromCurrent < containerWidth * 0.5) {
                        continue;
                    }

                    candidateCount++;
                    const currentWord = words[i];
                    const isContentWord = !this.isFunctionWord(currentWord);

                    // 计算综合得分（距离越近得分越高，内容词结束位置加分）
                    let score = 1000 - distanceFromTarget;
                    if (isContentWord) {
                        score += 100; // 内容词结束位置加分
                    }

                    // 如果距离目标位置很近（在理想距离的±20%范围内），额外加分
                    if (distanceFromTarget <= idealSlideDistance * 0.2) {
                        score += 50;
                    }

                    console.log(`[SmartSlide] Candidate ${candidateCount}: word="${currentWord}", width=${wordEndWidth}, distance=${distanceFromCurrent}, score=${score}, isContent=${isContentWord}`);

                    if (score > bestScore) {
                        bestScore = score;
                        bestOffset = wordEndWidth;
                    }
                }

                const finalOffset = Math.max(currentOffset, Math.min(bestOffset, maxOffset));
                console.log(`[SmartSlide] Next sliding result: bestOffset=${bestOffset}, finalOffset=${finalOffset}, candidates=${candidateCount}`);
                return finalOffset;

            } else {
                // 向后滑动：寻找合适的起始点
                const idealSlideDistance = containerWidth * 0.8;
                const targetOffset = Math.max(0, currentOffset - idealSlideDistance);

                console.log(`[SmartSlide] Prev direction: currentOffset=${currentOffset}, idealDistance=${idealSlideDistance}, targetOffset=${targetOffset}`);

                if (targetOffset <= 0) {
                    console.log(`[SmartSlide] Target at start, returning 0`);
                    return 0;
                }

                let bestOffset = targetOffset;
                let bestScore = -1;
                let candidateCount = 0;

                // 寻找最佳单词边界
                for (let i = 0; i < words.length; i++) {
                    measurer.textContent = words.slice(0, i + 1).join('');
                    const wordEndWidth = measurer.offsetWidth;

                    // 只考虑在目标范围内的位置
                    if (wordEndWidth >= currentOffset || wordEndWidth < 0) {
                        continue;
                    }

                    // 确保有足够的滑动距离（至少容器宽度的50%）
                    const distanceFromCurrent = currentOffset - wordEndWidth;
                    if (distanceFromCurrent < containerWidth * 0.5) {
                        continue;
                    }

                    candidateCount++;
                    const currentWord = words[i];
                    const isContentWord = !this.isFunctionWord(currentWord);

                    // 计算这个位置的得分
                    const distanceFromTarget = Math.abs(wordEndWidth - targetOffset);

                    let score = 1000 - distanceFromTarget;
                    if (isContentWord) {
                        score += 100;
                    }

                    // 如果距离目标位置很近，额外加分
                    if (distanceFromTarget <= idealSlideDistance * 0.2) {
                        score += 50;
                    }

                    console.log(`[SmartSlide] Prev candidate ${candidateCount}: word="${currentWord}", width=${wordEndWidth}, distance=${distanceFromCurrent}, score=${score}, isContent=${isContentWord}`);

                    if (score > bestScore) {
                        bestScore = score;
                        bestOffset = wordEndWidth;
                    }
                }

                const finalOffset = Math.max(0, bestOffset);
                console.log(`[SmartSlide] Prev sliding result: bestOffset=${bestOffset}, finalOffset=${finalOffset}, candidates=${candidateCount}`);
                return finalOffset;
            }

        } catch (error) {
            console.warn('[SmartSlide] Error in optimal word boundary detection:', error);
            // 降级到简单的百分比计算
            if (direction === 'next') {
                return Math.min(currentOffset + containerWidth * 0.6, content.scrollWidth - containerWidth);
            } else {
                return Math.max(0, currentOffset - containerWidth * 0.6);
            }
        } finally {
            document.body.removeChild(measurer);
        }
    }

    /**
     * 初始化智能滑动功能
     */
    private initializeSmartSliding(popup: HTMLElement): void {
        console.log(`[SmartSlide] Initializing smart sliding for popup`);
        const tooltips = popup.querySelectorAll('.lucid-toolpopup-definition-text-english-tooltip');
        console.log(`[SmartSlide] Found ${tooltips.length} tooltips to initialize`);

        tooltips.forEach((tooltip, index) => {
            console.log(`[SmartSlide] Processing tooltip ${index + 1}/${tooltips.length}`);
            const container = tooltip.querySelector('.lucid-tooltip-text-container') as HTMLElement;
            const content = tooltip.querySelector('.lucid-tooltip-text-content') as HTMLElement;
            const rightHoverZone = tooltip.querySelector('.lucid-tooltip-hover-zone.right') as HTMLElement;
            const leftHoverZone = tooltip.querySelector('.lucid-tooltip-hover-zone.left') as HTMLElement;
            const scrollHint = tooltip.querySelector('.lucid-tooltip-scroll-hint') as HTMLElement;

            console.log(`[SmartSlide] Tooltip ${index + 1} elements:`, {
                container: !!container,
                content: !!content,
                rightHoverZone: !!rightHoverZone,
                leftHoverZone: !!leftHoverZone,
                scrollHint: !!scrollHint
            });

            if (!container || !content || !rightHoverZone || !leftHoverZone || !scrollHint) {
                console.warn(`[SmartSlide] Missing elements for tooltip ${index + 1}, skipping`);
                return;
            }

            console.log(`[SmartSlide] Setting up smart sliding for tooltip ${index + 1}`);
            this.setupSmartSlidingForTooltip(tooltip as HTMLElement, container, content, rightHoverZone, leftHoverZone, scrollHint);
        });

        console.log(`[SmartSlide] Smart sliding initialization completed`);
    }

    /**
     * 为单个tooltip设置智能滑动
     */
    private setupSmartSlidingForTooltip(
        tooltip: HTMLElement,
        container: HTMLElement,
        content: HTMLElement,
        rightHoverZone: HTMLElement,
        leftHoverZone: HTMLElement,
        scrollHint: HTMLElement
    ): void {
        let isSliding = false;
        let slideDistance = 0;
        const originalTransform = '';

        // 检查是否需要滑动
        const checkScrollable = () => {
            const styles = getComputedStyle(tooltip);
            const hasWidth = tooltip.offsetWidth > 0;
            const hasHeight = tooltip.offsetHeight > 0;
            const notHidden = styles.visibility !== 'hidden';
            const hasOpacity = parseFloat(styles.opacity) > 0.5;
            const hasMaxWidth = styles.maxWidth !== '0px' && styles.maxWidth !== 'none';

            const isVisible = hasWidth && hasHeight && notHidden && hasOpacity && hasMaxWidth;

            if (isVisible) {
                // 使用container的宽度而不是tooltip的宽度
                const containerWidth = container.offsetWidth || parseInt(styles.maxWidth) || 280;
                const contentWidth = content.scrollWidth;

                console.log(`[SmartSlide] Checking scrollable: containerWidth=${containerWidth}, contentWidth=${contentWidth}`);

                if (contentWidth > containerWidth) {
                    if (!tooltip.classList.contains('scrollable')) {
                        tooltip.classList.add('scrollable');
                        slideDistance = contentWidth - containerWidth;
                        console.log(`[SmartSlide] Content overflows by ${slideDistance}px, ready for sliding`);
                    }
                    return contentWidth - containerWidth;
                } else {
                    tooltip.classList.remove('scrollable');
                    return 0;
                }
            }
            return 0;
        };

        // 滑动到末尾
        const slideToEnd = () => {
            const currentSlideDistance = checkScrollable();
            if (currentSlideDistance > 0 && !isSliding) {
                isSliding = true;
                slideDistance = currentSlideDistance;
                content.style.transform = `translateX(-${slideDistance}px)`;
                container.classList.add('slid');
                // 添加模糊效果
                tooltip.classList.add('lucid-slide-blur-left', 'active');
                console.log(`[SmartSlide] Sliding ${slideDistance}px to show hidden content with blur effect`);
            }
        };

        // 滑动回起始位置
        const slideToStart = () => {
            if (isSliding) {
                isSliding = false;
                content.style.transform = originalTransform;
                container.classList.remove('slid');
                // 移除模糊效果
                tooltip.classList.remove('active');
                // 延迟移除模糊类，让过渡动画完成
                setTimeout(() => {
                    tooltip.classList.remove('lucid-slide-blur-left');
                }, 300);
                console.log('[SmartSlide] Sliding back to original position, removing blur effect');
            }
        };

        let currentSlideOffset = 0; // 当前滑动偏移量
        let totalContentWidth = 0;
        let containerWidth = 0;
        let hoverTimeout: number | null = null; // 悬停延迟定时器
        let isInRightZone = false;
        let isInLeftZone = false;
        const HOVER_DELAY = 1000; // 1秒悬停延迟
        const CONTINUOUS_DELAY = 1800; // 连续滑动间隔（1.8秒，比首次触发快一些）

        // 计算下一个分段滑动距离（基于智能单词边界）
        const calculateNextSlideDistance = (): number => {
            return this.findOptimalWordBoundary(content, currentSlideOffset, containerWidth, 'next');
        };

        // 计算上一个分段滑动距离（基于智能单词边界）
        const calculatePrevSlideDistance = (): number => {
            return this.findOptimalWordBoundary(content, currentSlideOffset, containerWidth, 'prev');
        };

        // 分段滑动到下一段（使用智能单词边界）
        const slideToNextSegment = () => {
            console.log(`[SmartSlide] slideToNextSegment called`);
            const maxSlideDistance = checkScrollable();
            console.log(`[SmartSlide] maxSlideDistance: ${maxSlideDistance}, containerWidth: ${containerWidth}, totalContentWidth: ${totalContentWidth}`);

            if (maxSlideDistance > 0) {
                // 使用智能单词边界计算下一个滑动位置
                const nextOffset = calculateNextSlideDistance();

                console.log(`[SmartSlide] Smart boundary calculation: current=${currentSlideOffset}, next=${nextOffset}`);

                if (nextOffset > currentSlideOffset) {
                    currentSlideOffset = nextOffset;
                    content.style.transform = `translateX(-${currentSlideOffset}px)`;
                    container.classList.add('slid');
                    // 添加模糊效果
                    tooltip.classList.add('lucid-slide-blur-left', 'active');
                    isSliding = currentSlideOffset > 0;
                    console.log(`[SmartSlide] ✅ Sliding to next word boundary: ${currentSlideOffset}px with blur effect`);
                } else {
                    console.log(`[SmartSlide] ⚠️ No more content to slide (nextOffset <= currentSlideOffset)`);
                }
            } else {
                console.log(`[SmartSlide] ⚠️ Content does not need scrolling (maxSlideDistance <= 0)`);
            }
        };

        // 分段滑动到上一段（使用智能单词边界）
        const slideToPrevSegment = () => {
            if (currentSlideOffset > 0) {
                // 使用智能单词边界计算上一个滑动位置
                const prevOffset = calculatePrevSlideDistance();

                console.log(`[SmartSlide] Smart prev boundary calculation: current=${currentSlideOffset}, prev=${prevOffset}`);

                currentSlideOffset = prevOffset;
                content.style.transform = `translateX(-${currentSlideOffset}px)`;

                if (currentSlideOffset === 0) {
                    container.classList.remove('slid');
                    // 移除模糊效果
                    tooltip.classList.remove('active');
                    setTimeout(() => {
                        tooltip.classList.remove('lucid-slide-blur-left');
                    }, 300);
                    isSliding = false;
                } else {
                    isSliding = true;
                }
                console.log(`[SmartSlide] ✅ Sliding to previous word boundary: ${currentSlideOffset}px`);
            }
        };

        // 清除悬停定时器
        const clearHoverTimeout = () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
        };

        // 更新checkScrollable以设置全局变量
        const originalCheckScrollable = checkScrollable;
        const enhancedCheckScrollable = () => {
            console.log(`[SmartSlide] enhancedCheckScrollable called`);
            const result = originalCheckScrollable();
            const styles = getComputedStyle(tooltip);
            containerWidth = container.offsetWidth || parseInt(styles.maxWidth) || 280;
            totalContentWidth = content.scrollWidth;
            console.log(`[SmartSlide] Updated dimensions - containerWidth: ${containerWidth}, totalContentWidth: ${totalContentWidth}, result: ${result}`);
            return result;
        };

        // 鼠标移动事件（带延迟触发）
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const currentContainerWidth = rect.width;

            const rightZoneStart = currentContainerWidth * 0.9; // 右边10%
            const leftZoneEnd = currentContainerWidth * 0.1;   // 左边10%

            // console.log(`[SmartSlide] Mouse move: x=${x.toFixed(1)}, width=${currentContainerWidth.toFixed(1)}, rightZone=${rightZoneStart.toFixed(1)}, leftZone=${leftZoneEnd.toFixed(1)}`);

            if (x >= rightZoneStart) {
                // 进入右侧区域
                if (!isInRightZone) {
                    isInRightZone = true;
                    isInLeftZone = false;
                    console.log(`[SmartSlide] Entered RIGHT zone, starting continuous sliding`);
                    clearHoverTimeout();

                    // 启动连续滑动逻辑
                    const startContinuousSliding = () => {
                        if (isInRightZone) {
                            console.log(`[SmartSlide] RIGHT zone continuous timer triggered`);
                            enhancedCheckScrollable(); // 更新全局变量
                            slideToNextSegment();

                            // 如果还在右侧区域且还有内容可以滑动，继续设置下一次滑动
                            if (isInRightZone && currentSlideOffset < (totalContentWidth - containerWidth)) {
                                hoverTimeout = setTimeout(startContinuousSliding, CONTINUOUS_DELAY) as any;
                            }
                        }
                    };

                    hoverTimeout = setTimeout(startContinuousSliding, HOVER_DELAY) as any;
                }
            } else if (x <= leftZoneEnd) {
                // 进入左侧区域
                if (!isInLeftZone) {
                    isInLeftZone = true;
                    isInRightZone = false;
                    console.log(`[SmartSlide] Entered LEFT zone, starting continuous sliding`);
                    clearHoverTimeout();

                    // 启动连续滑动逻辑
                    const startContinuousSliding = () => {
                        if (isInLeftZone) {
                            console.log(`[SmartSlide] LEFT zone continuous timer triggered`);
                            enhancedCheckScrollable(); // 更新全局变量
                            slideToPrevSegment();

                            // 如果还在左侧区域且还有内容可以滑动，继续设置下一次滑动
                            if (isInLeftZone && currentSlideOffset > 0) {
                                hoverTimeout = setTimeout(startContinuousSliding, CONTINUOUS_DELAY) as any;
                            }
                        }
                    };

                    hoverTimeout = setTimeout(startContinuousSliding, HOVER_DELAY) as any;
                }
            } else {
                // 在中间区域
                if (isInRightZone || isInLeftZone) {
                    console.log(`[SmartSlide] Left zones, entering MIDDLE zone`);
                    isInRightZone = false;
                    isInLeftZone = false;
                    clearHoverTimeout();
                }
            }
        });

        // 鼠标离开事件
        container.addEventListener('mouseleave', () => {
            clearHoverTimeout();
            isInRightZone = false;
            isInLeftZone = false;
            console.log(`[SmartSlide] Mouse left container, resetting all states`);

            // 延迟回到起始位置
            setTimeout(() => {
                if (currentSlideOffset > 0) {
                    console.log(`[SmartSlide] Returning to start position`);
                    currentSlideOffset = 0;
                    content.style.transform = originalTransform;
                    container.classList.remove('slid');
                    tooltip.classList.remove('active');
                    setTimeout(() => {
                        tooltip.classList.remove('lucid-slide-blur-left');
                    }, 300);
                    isSliding = false;
                }
            }, 100);
        });

        // 监听tooltip的显示状态变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    const styles = getComputedStyle(tooltip);
                    if (styles.opacity !== '0' && styles.visibility !== 'hidden') {
                        setTimeout(checkScrollable, 100);
                    }
                }
            });
        });

        observer.observe(tooltip, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // 初始检查（延迟更长时间确保DOM完全渲染）
        setTimeout(checkScrollable, 500);
    }

    /**
     * Positions the toolpopup on the screen.
     * 使用与tooltip相同的定位逻辑，确保位置一致
     */
    private positionToolpopup(toolpopupEl: HTMLElement, referenceEl?: HTMLElement): void {
        if (!referenceEl) {
            // 如果没有参考元素，居中显示
            const top = (window.innerHeight / 2) - (toolpopupEl.offsetHeight / 2) + window.scrollY;
            const left = (window.innerWidth / 2) - (toolpopupEl.offsetWidth / 2) + window.scrollX;
            toolpopupEl.style.position = 'absolute';
            toolpopupEl.style.top = `${top}px`;
            toolpopupEl.style.left = `${left}px`;
            toolpopupEl.style.zIndex = '2147483647';
            return;
        }

        const targetRect = referenceEl.getBoundingClientRect();
        const toolpopupRect = toolpopupEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 使用与tooltip相同的定位逻辑：目标元素下方左对齐，更靠近
        let left = targetRect.left;
        let top = targetRect.bottom + 4; // 与tooltip相同的间距

        // 水平边界检查 - 与tooltip相同的逻辑
        if (left < 8) {
            left = 8;
        } else if (left + toolpopupRect.width > viewportWidth - 8) {
            left = viewportWidth - toolpopupRect.width - 8;
        }

        // 垂直边界检查 - 与tooltip相同的逻辑
        if (top + toolpopupRect.height > viewportHeight - 8) {
            top = targetRect.top - toolpopupRect.height - 4;
            toolpopupEl.classList.add('lucid-toolpopup-above');
        }

        // 设置位置 - 与tooltip相同的方式
        toolpopupEl.style.position = 'absolute';
        toolpopupEl.style.left = `${left + window.scrollX}px`;
        toolpopupEl.style.top = `${top + window.scrollY}px`;
        toolpopupEl.style.zIndex = '2147483647';
    }

    /**
     * 获取页面body p元素的字体大小（与TooltipManager保持一致）
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

        // 默认返回20px
        return 20;
    }

    /**
     * Shows the toolpopup with detailed information for the given word.
     * 支持从小型tooltip平滑过渡到大型弹窗
     */
    public async showToolpopup(word: string, referenceElement?: HTMLElement, fromTooltip?: HTMLElement): Promise<void> {
        console.log(`[ToolpopupManager] Showing toolpopup for word: ${word}`);

        if (this.currentToolpopup) {
            this.hideToolpopup();
        }

        // 🔧 修复：显示toolpopup时自动隐藏tooltip，避免同时显示两个弹窗
        if (!TooltipManager) {
            // 延迟导入避免循环依赖
            const { TooltipManager: TM } = await import('./tooltipManager');
            TooltipManager = TM;
        }
        TooltipManager.getInstance().hideTooltip(0); // 立即隐藏tooltip

        const wordDetails = await this.getWordDetailedInfo(word);
        if (!wordDetails) {
            console.warn(`[ToolpopupManager] No detailed info found for: ${word}`);
            return;
        }

        // 获取单词的标记次数
        const markCount = await this.getWordMarkCount(word);

        this.currentToolpopup = this.createToolpopupElement(wordDetails, markCount);

        // 设置动态字体大小（与tooltip保持一致的逻辑）
        const bodyPFontSize = this.getBodyPFontSize();
        const tooltipFontSize = bodyPFontSize; // tooltip字体大小
        const wordFontSize = tooltipFontSize * 1.6; // word字体大小为tooltip的2倍

        // 获取关键元素
        const toolpopupWord = this.currentToolpopup.querySelector('.lucid-toolpopup-word') as HTMLElement;
        const definitionTexts = this.currentToolpopup.querySelectorAll('.lucid-toolpopup-definition-text-chinese') as NodeListOf<HTMLElement>;

        // 设置word元素字体大小（tooltip的2倍）
        if (toolpopupWord) {
            toolpopupWord.style.fontSize = `${wordFontSize}px`;
            toolpopupWord.style.lineHeight = `${wordFontSize * 1.2}px`;
        }

        // 设置definition文本字体大小（与tooltip相同）
        definitionTexts.forEach(element => {
            element.style.fontSize = `${tooltipFontSize}px`;
            element.style.lineHeight = `${tooltipFontSize * 1.2}px`;
        });

        // 标准显示动画（简化过渡逻辑，避免重叠问题）
        document.body.appendChild(this.currentToolpopup);

        // Position after it's added to DOM and rendered to get correct dimensions
        requestAnimationFrame(() => {
            if (this.currentToolpopup) {
                this.positionToolpopup(this.currentToolpopup, referenceElement);

                // 添加进入动画
                this.currentToolpopup.style.animation = 'lucid-toolpopup-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

                // 同时添加visible类以确保最终状态正确
                setTimeout(() => {
                    if (this.currentToolpopup) {
                        this.currentToolpopup.classList.add('lucid-toolpopup-visible');
                        this.currentToolpopup.style.animation = ''; // 清除动画，使用CSS transition接管
                    }
                }, 300);
            }
        });
    }

    /**
     * 执行从小型tooltip到大型弹窗的平滑过渡动画
     */
    private performSmoothTransition(fromTooltip: HTMLElement, toToolpopup: HTMLElement, referenceElement: HTMLElement): void {
        console.log('[ToolpopupManager] Performing smooth transition from tooltip to toolpopup');

        // 获取tooltip的位置和尺寸
        const tooltipRect = fromTooltip.getBoundingClientRect();

        // 设置toolpopup的初始状态（与tooltip相同的位置和尺寸）
        toToolpopup.style.position = 'fixed';
        toToolpopup.style.left = `${tooltipRect.left}px`;
        toToolpopup.style.top = `${tooltipRect.top}px`;
        toToolpopup.style.width = `${tooltipRect.width}px`;
        toToolpopup.style.height = `${tooltipRect.height}px`;
        toToolpopup.style.opacity = '1';
        toToolpopup.style.transform = 'scale(1)';
        toToolpopup.style.overflow = 'hidden';

        // 添加到DOM
        document.body.appendChild(toToolpopup);

        // 隐藏原tooltip（立即）
        fromTooltip.style.opacity = '0';
        fromTooltip.style.pointerEvents = 'none';

        // 强制重排以确保初始状态生效
        toToolpopup.offsetHeight;

        // 计算最终位置
        const finalPosition = this.calculateOptimalPosition(toToolpopup, referenceElement);

        // 开始过渡动画
        requestAnimationFrame(() => {
            if (this.currentToolpopup) {
                // 设置过渡动画
                this.currentToolpopup.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

                // 过渡到最终状态
                this.currentToolpopup.style.left = `${finalPosition.left}px`;
                this.currentToolpopup.style.top = `${finalPosition.top}px`;
                this.currentToolpopup.style.setProperty('width', this.getToolpopupWidth(), 'important'); // toolpopup的标准宽度（从CSS变量获取）
                this.currentToolpopup.style.height = 'auto';
                this.currentToolpopup.style.overflow = 'visible';

                // 动画完成后清理
                setTimeout(() => {
                    if (this.currentToolpopup) {
                        this.currentToolpopup.style.position = 'absolute';
                        this.currentToolpopup.style.transition = '';
                        this.currentToolpopup.classList.add('lucid-toolpopup-visible');
                        console.log('[ToolpopupManager] Smooth transition completed');
                    }
                }, 400);
            }
        });
    }

    /**
     * 计算toolpopup的最佳位置 - 与tooltip定位逻辑保持一致
     */
    private calculateOptimalPosition(toolpopupEl: HTMLElement, referenceEl: HTMLElement): { left: number; top: number } {
        const targetRect = referenceEl.getBoundingClientRect();
        const toolpopupRect = toolpopupEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 使用与tooltip相同的定位逻辑
        let left = targetRect.left;
        let top = targetRect.bottom + 4; // 与tooltip相同的间距

        // 水平边界检查 - 与tooltip相同的逻辑
        if (left < 8) {
            left = 8;
        } else if (left + toolpopupRect.width > viewportWidth - 8) {
            left = viewportWidth - toolpopupRect.width - 8;
        }

        // 垂直边界检查 - 与tooltip相同的逻辑
        if (top + toolpopupRect.height > viewportHeight - 8) {
            top = targetRect.top - toolpopupRect.height - 4;
        }

        return {
            left: left + window.scrollX,
            top: top + window.scrollY
        };
    }

    /**
     * Hides the currently visible toolpopup.
     */
    public hideToolpopup(): void {
        if (this.currentToolpopup) {
            // 添加退出动画
            this.currentToolpopup.style.animation = 'lucid-toolpopup-exit 0.2s ease-in forwards';

            // 移除visible类
            this.currentToolpopup.classList.remove('lucid-toolpopup-visible');

            setTimeout(() => {
                if (this.currentToolpopup) {
                    this.currentToolpopup.remove();
                    this.currentToolpopup = null;
                }
            }, 200); // 匹配动画时间
        }
    }
}

// Example usage (for testing directly in console or another script):
// ToolpopupManager.getInstance().showToolpopup("Project");
// setTimeout(() => ToolpopupManager.getInstance().hideToolpopup(), 5000);
