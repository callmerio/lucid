import { debounce } from "lodash-es";
// import { storage } from 'wxt/storage'; // 再次注释掉，以避免 TS 错误，依赖 browser.storage

export default defineContentScript({
  matches: ["<all_urls>"], // 在所有页面上激活
  main() {
    // --- Configuration (假设从 storage 加载) ---
    let highlightBaseColor = "orange"; // 默认值, 应该从 storage 加载
    let wordMarkings: { [key: string]: number } = {}; // 应该从 storage 加载

    // 更全面的边界字符，特别是中文标点
    const WORD_BOUNDARY_REGEX = /[\s\p{P}\p{Z}<>"'“”‘’「」『』.,;:?!()[\]{}]/u;
    const SPECIAL_PATTERNS = [
      /\b[\w]+(?:-[\w]+)+\b/u, // 连字符单词 e.g., state-of-the-art
      /\b\w+'\w+\b/u, // 撇号单词 e.g., can't
      /\b\d+[\w%]+\b/u, // 数字与单位 e.g., 100kg, 50%
      /\b(?:https?:\/\/|www\.)\S+\b/iu, // 网址
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu, // 邮箱
    ];

    // --- Theme Detection ---
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    let isDarkText = prefersDark.matches;
    prefersDark.addEventListener("change", (e) => {
      isDarkText = e.matches;
      // TODO: 可选: 如果主题更改，重新设置现有高亮的样式
      console.log("Lucid: Theme changed, isDarkText:", isDarkText);
    });

    // --- Storage Interaction ---
    async function loadConfiguration() {
      try {
        let settingsData: any = null;
        let wordMarkingsData: { [key: string]: number } | null = null;

        // 尝试使用 browser.storage.local，因为 wxt/storage 导入被注释
        if (
          typeof browser !== "undefined" &&
          browser.storage &&
          browser.storage.local
        ) {
          console.log("Lucid: Using browser.storage.local for loading.");
          const result = await browser.storage.local.get([
            "settings",
            "wordMarkings",
          ]);
          settingsData = result.settings;
          // 类型断言，因为 browser.storage.local.get 返回的是 any
          wordMarkingsData =
            (result.wordMarkings as { [key: string]: number } | undefined) ||
            null;
        } else {
          // @ts-ignore storage is not defined here due to commented import
          if (typeof storage !== "undefined" && storage.getItem) {
            // 这个分支理论上不应该执行，除非 storage 变量通过其他方式被定义
            console.warn(
              "Lucid: Attempting to use wxt/storage as a fallback (unexpected).",
            );
            // @ts-ignore
            settingsData = await storage.getItem<any>("local:settings");
            // @ts-ignore
            wordMarkingsData = await storage.getItem<{ [key: string]: number }>(
              "local:wordMarkings",
            );
          } else {
            console.error(
              "Lucid: Storage API (browser.storage.local or wxt/storage) is not available.",
            );
            return;
          }
        }

        if (settingsData && settingsData.highlightBaseColor) {
          highlightBaseColor = settingsData.highlightBaseColor;
        }
        if (wordMarkingsData) {
          wordMarkings = wordMarkingsData;
        }
        console.log("Lucid: Configuration loaded", {
          highlightBaseColor,
          wordMarkings,
        });
      } catch (error) {
        console.error("Lucid: Error loading configuration", error);
      }
    }

    async function saveWordMarking(word: string, count: number) {
      wordMarkings[word] = count;
      try {
        // 尝试使用 browser.storage.local
        if (
          typeof browser !== "undefined" &&
          browser.storage &&
          browser.storage.local
        ) {
          console.log("Lucid: Using browser.storage.local for saving.");
          await browser.storage.local.set({ wordMarkings });
        } else {
          // @ts-ignore storage is not defined here due to commented import
          if (typeof storage !== "undefined" && storage.setItem) {
            // 这个分支理论上不应该执行
            console.warn(
              "Lucid: Attempting to use wxt/storage for saving as a fallback (unexpected).",
            );
            // @ts-ignore
            await storage.setItem("local:wordMarkings", wordMarkings);
          } else {
            console.error(
              "Lucid: Storage API (browser.storage.local or wxt/storage) is not available for saving.",
            );
            return;
          }
        }
        console.log("Lucid: Word marking saved", { word, count });
      } catch (error) {
        console.error("Lucid: Error saving word marking", error);
      }
    }

    // 脚本启动时加载配置
    loadConfiguration();

    // --- Highlighting Logic ---
    function getHighlightClassName(
      baseColor: string,
      markCount: number,
      isDark: boolean,
    ): string {
      const lightModeShades: { [key: number]: number } = {
        1: 500,
        2: 600,
        3: 700,
        4: 800,
        5: 900,
      };
      const darkModeShades: { [key: number]: number } = {
        1: 500,
        2: 400,
        3: 300,
        4: 200,
        5: 100,
      };
      const count = Math.min(Math.max(1, markCount), 5);

      const shade = isDark ? darkModeShades[count] : lightModeShades[count];
      return `lucid-highlight bg-${baseColor}-${shade}`;
    }

    function isWordBoundaryChar(char: string | null | undefined): boolean {
      if (!char) return true;
      return WORD_BOUNDARY_REGEX.test(char);
    }

    function getTextContent(node: Node): string {
      return node.textContent || "";
    }

    function expandSelectionToFullWord() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        console.log("Lucid: No selection or selection is collapsed.");
        return;
      }

      const range = selection.getRangeAt(0).cloneRange();

      let startNode = range.startContainer;
      let startOffset = range.startOffset;
      let endNode = range.endContainer;
      let endOffset = range.endOffset;

      function checkSpecialPatterns(
        node: Node,
        offset: number,
        direction: "backward" | "forward",
      ): { newOffset: number; patternMatched: boolean } {
        const text = getTextContent(node);
        if (!text) return { newOffset: offset, patternMatched: false };
        for (const pattern of SPECIAL_PATTERNS) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            if (
              direction === "backward" &&
              offset > matchStart &&
              offset <= matchEnd
            ) {
              return { newOffset: matchStart, patternMatched: true };
            }
            if (
              direction === "forward" &&
              offset >= matchStart &&
              offset < matchEnd
            ) {
              return { newOffset: matchEnd, patternMatched: true };
            }
          }
        }
        return { newOffset: offset, patternMatched: false };
      }

      let specialPatternCheckStart = checkSpecialPatterns(
        startNode,
        startOffset,
        "backward",
      );
      if (specialPatternCheckStart.patternMatched) {
        startOffset = specialPatternCheckStart.newOffset;
      } else {
        while (startOffset > 0) {
          const char = getTextContent(startNode)[startOffset - 1];
          if (isWordBoundaryChar(char)) break;
          startOffset--;
        }
      }
      try {
        range.setStart(startNode, startOffset);
      } catch (e) {
        console.error("Lucid: Error setting start of range", e, {
          startNode,
          startOffset,
        });
        return;
      }

      let specialPatternCheckEnd = checkSpecialPatterns(
        endNode,
        endOffset,
        "forward",
      );
      if (specialPatternCheckEnd.patternMatched) {
        endOffset = specialPatternCheckEnd.newOffset;
      } else {
        const textLength = getTextContent(endNode).length;
        while (endOffset < textLength) {
          const char = getTextContent(endNode)[endOffset];
          if (isWordBoundaryChar(char)) break;
          endOffset++;
        }
      }
      try {
        range.setEnd(endNode, endOffset);
      } catch (e) {
        console.error("Lucid: Error setting end of range", e, {
          endNode,
          endOffset,
        });
        return;
      }

      const wordToMark = range.toString().trim().toLowerCase();
      if (wordToMark) {
        let currentMarkCount = (wordMarkings[wordToMark] || 0) + 1;
        currentMarkCount = Math.min(currentMarkCount, 5);
        saveWordMarking(wordToMark, currentMarkCount);

        const className = getHighlightClassName(
          highlightBaseColor,
          currentMarkCount,
          isDarkText,
        );

        const highlightElement = document.createElement("mark");
        highlightElement.className = className;
        highlightElement.dataset.word = wordToMark;
        highlightElement.dataset.markCount = String(currentMarkCount);
        highlightElement.dataset.lucidHighlight = "true";

        try {
          range.surroundContents(highlightElement);
          selection.removeAllRanges();
          console.log(
            "Lucid: Highlight applied for word:",
            wordToMark,
            "Class:",
            className,
          );
        } catch (e) {
          console.error(
            "Lucid: Error surrounding contents with highlight element",
            e,
          );
        }
      } else {
        console.log("Lucid: No word to mark after expansion.");
      }
    }

    const debouncedExpandSelection = debounce(expandSelectionToFullWord, 250);

    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      document.addEventListener("mouseup", debouncedExpandSelection);
      console.log("Lucid: Mouseup listener added.");
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.addEventListener("mouseup", debouncedExpandSelection);
        console.log("Lucid: Mouseup listener added after DOMContentLoaded.");
      });
    }
    console.log("Lucid: Content script main function executed.");
  },
});
