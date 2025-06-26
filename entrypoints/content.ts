import "@styles/global/essential.css";
import "@styles/global/main.css"; // 引入 Tailwind CSS
import { applyWordHighlight } from "@utils/highlight/highlightUtils";
import { expandSelectionToFullWord } from "@utils/text/selection";
import { debounce } from "lodash-es";
import { defineContentScript } from 'wxt/utils/define-content-script';

/* ------------------------------------------------------------------
 *  内容脚本入口
 * ------------------------------------------------------------------*/
interface ExtensionMessage {
  action: string;
  [key: string]: any;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  matchAboutBlank: true,
  async main() {
    /* ---------------- iframe‑context guard ---------------- */
    try {
      if (window.top && window.top !== window) {
        // Attempt to access top.location; throws if cross‑origin.
        void window.top.location.href;
      }
    } catch {
      // Cross‑origin iframe: abort early to avoid DOMException.
      // 这是正常的安全限制，不是错误
      console.debug(
        "Lucid: skipping cross‑origin iframe (no same‑origin access) - 这是正常的浏览器安全限制",
      );
      return () => { };
    }
    console.log("Lucid 扩展：内容脚本已加载");

    // 先初始化现有管理器
    let tooltipManager: any, toolpopupManager: any, transparentPopupManager: any;

    try {
      const { TooltipManager } = await import("@utils/dom/managers/tooltip/TooltipManager.tsx");
      const { ToolpopupManager } = await import("@utils/dom/managers/popup/ToolpopupManager.tsx");

      tooltipManager = TooltipManager.getInstance();
      toolpopupManager = ToolpopupManager.getInstance();

      console.log("[Lucid] TooltipManager 和 ToolpopupManager 已初始化");
    } catch (error) {
      console.error("[Lucid] 初始化现有管理器失败:", error);
    }

    // 尝试初始化透明弹窗管理器
    try {
      const { TransparentPopupManager } = await import("@utils/dom/managers/popup/TransparentPopupManager");
      transparentPopupManager = TransparentPopupManager.getInstance();
      console.log("[Lucid] TransparentPopupManager 已初始化");
    } catch (error) {
      console.error("[Lucid] 初始化透明弹窗管理器失败:", error);
    }

    // 添加全局错误处理，特别是postMessage错误
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('postMessage')) {
        // 将postMessage错误降级为警告，因为这通常是第三方工具的跨域通信问题
        console.warn('[Lucid] PostMessage 跨域通信警告 (可忽略):', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };



    const handleSelectionAndHighlight = async () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const originalRange = sel.getRangeAt(0).cloneRange();
        if (originalRange.collapsed && sel.toString().trim() === "") {
          // 如果选区是折叠的，并且没有实际选择文本（例如只是一个光标），则不处理
          // 这可以避免在没有实际选择时，仅按下Shift键就触发高亮
          console.log(
            "[Lucid] Selection is collapsed and empty, skipping highlight.",
          );
          return;
        }

        console.log(
          `[DEBUG][SELECTION] current raw selection: "${sel.toString()}"`,
        );
        console.log(
          `[DEBUG][SELECTION] original range text: "${originalRange.toString()}"`,
        );

        const expandedRange = expandSelectionToFullWord(
          originalRange.cloneRange(),
        ); // 确保传递克隆的 range
        console.log(
          `[DEBUG][SELECTION] expanded range text: "${expandedRange.toString()}"`,
        );

        // isDarkText 判断
        if (expandedRange && !expandedRange.collapsed) {
          // Determine if the selection's text color is dark by computing brightness
          let container: Element | null =
            expandedRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
              ? (expandedRange.commonAncestorContainer as Element)
              : (expandedRange.commonAncestorContainer
                .parentElement as Element);
          // If inside an existing highlight mark, use its parent for color sampling
          const existingMark = container.closest("mark.lucid-highlight");
          if (existingMark) {
            container = existingMark.parentElement;
          }
          const computedColor = container
            ? window.getComputedStyle(container).color
            : window.getComputedStyle(document.body).color;
          // Parse "rgb(r, g, b)" and compute brightness
          const [r, g, b] = computedColor.match(/\d+/g)!.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const isDarkText = brightness < 128;
          console.log(
            `[DEBUG][SELECTION] computed color: ${computedColor}, brightness: ${brightness}, isDarkText: ${isDarkText}`,
          );
          await applyWordHighlight(expandedRange, isDarkText);
          // applyWordHighlight 内部会处理 sel.removeAllRanges()
        } else {
          // 如果扩展后范围无效或折叠，则恢复原始选择（或清除）
          // sel.removeAllRanges();
          // sel.addRange(originalRange); // 或者不恢复，让选择消失
          console.log(
            "[Lucid] Expanded range is invalid or collapsed, skipping highlight application.",
          );
        }
      }
    };

    const debouncedKeyUp = debounce(async (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        // Shift 释放时，如果当前有选区，则尝试扩展并高亮
        // 这里的逻辑是：用户可能先选择文本，然后释放Shift键来确认并高亮
        // 或者用户按住Shift进行选择，释放Shift时触发
        await handleSelectionAndHighlight();
      }
    }, 250);

    document.addEventListener("keyup", debouncedKeyUp);

    // 监听鼠标抬起事件，用于处理拖拽选择后立即高亮（如果需要）
    // 注意：这可能会与Shift+KeyUp冲突或重复，需要仔细测试交互
    // document.addEventListener('mouseup', async () => {
    //   // 延迟一小段时间确保选区已更新
    //   setTimeout(async () => {
    //     await handleSelectionAndHighlight();
    //   }, 50);
    // });

    browser.runtime.onMessage.addListener(async (message: ExtensionMessage, _sender, sendResponse) => {
      if (
        message.action === "logSelectionFromContextMenu" ||
        message.action === "highlightSelectionFromContextMenu"
      ) {
        // 假设右键菜单触发高亮也使用此逻辑
        await handleSelectionAndHighlight();
      } else if (message.action === 'lucid:transparent-popup:toggle') {
        // 处理透明弹窗切换消息
        console.log('[Lucid] 收到透明弹窗切换消息，消息详情:', message);
        console.log('[Lucid] 透明弹窗管理器实例:', transparentPopupManager);
        console.log('[Lucid] 当前页面URL:', window.location.href);

        if (!transparentPopupManager) {
          console.error('[Lucid] 透明弹窗管理器未初始化');
          sendResponse({ success: false, error: '透明弹窗管理器未初始化' });
          return;
        }

        try {
          transparentPopupManager.toggle();
          console.log('[Lucid] 透明弹窗切换成功');
          sendResponse({ success: true });
        } catch (error) {
          console.error('[Lucid] 透明弹窗切换失败:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      return true; // 保持消息通道开放以支持异步响应
    });
    return () => {
      document.removeEventListener("keyup", debouncedKeyUp);

      // 清理管理器
      tooltipManager.destroy();
      toolpopupManager.destroy();
      transparentPopupManager.destroy();

      console.log("[Lucid] 内容脚本清理完成");
    };
  },
});
