import { debounce } from 'lodash-es';
import '../assets/css/main.css'; // 引入 Tailwind CSS
import { expandSelectionToFullWord } from '../utils/selectionUtils.ts';
import { applyWordHighlight } from '../utils/highlightUtils.ts'; // 引入高亮工具函数

/* ------------------------------------------------------------------
 *  内容脚本入口
 * ------------------------------------------------------------------*/
interface ExtensionMessage {
  action: string;
  [key: string]: any;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  matchAboutBlank: true,
  main() {
    /* ---------------- iframe‑context guard ---------------- */
    try {
      if (window.top && window.top !== window) {
        // Attempt to access top.location; throws if cross‑origin.
        void window.top.location.href;
      }
    } catch {
      // Cross‑origin iframe: abort early to avoid DOMException.
      console.warn('Lucid: skipping cross‑origin iframe (no same‑origin access)');
      return () => { };
    }
    console.log('Lucid 扩展：内容脚本已加载');

    const handleSelectionAndHighlight = async () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const originalRange = sel.getRangeAt(0).cloneRange();
        if (originalRange.collapsed && sel.toString().trim() === '') {
          // 如果选区是折叠的，并且没有实际选择文本（例如只是一个光标），则不处理
          // 这可以避免在没有实际选择时，仅按下Shift键就触发高亮
          console.log('[Lucid] Selection is collapsed and empty, skipping highlight.');
          return;
        }

        console.log(`[DEBUG][SELECTION] current raw selection: "${sel.toString()}"`);
        console.log(`[DEBUG][SELECTION] original range text: "${originalRange.toString()}"`);

        const expandedRange = expandSelectionToFullWord(originalRange.cloneRange()); // 确保传递克隆的 range
        console.log(`[DEBUG][SELECTION] expanded range text: "${expandedRange.toString()}"`);

        if (expandedRange && !expandedRange.collapsed) {
          const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          await applyWordHighlight(expandedRange, isDarkMode);
          // applyWordHighlight 内部会处理 sel.removeAllRanges()
        } else {
          // 如果扩展后范围无效或折叠，则恢复原始选择（或清除）
          // sel.removeAllRanges();
          // sel.addRange(originalRange); // 或者不恢复，让选择消失
          console.log('[Lucid] Expanded range is invalid or collapsed, skipping highlight application.');
        }
      }
    };

    const debouncedKeyUp = debounce(async (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        // Shift 释放时，如果当前有选区，则尝试扩展并高亮
        // 这里的逻辑是：用户可能先选择文本，然后释放Shift键来确认并高亮
        // 或者用户按住Shift进行选择，释放Shift时触发
        await handleSelectionAndHighlight();
      }
    }, 250);

    document.addEventListener('keyup', debouncedKeyUp);

    // 监听鼠标抬起事件，用于处理拖拽选择后立即高亮（如果需要）
    // 注意：这可能会与Shift+KeyUp冲突或重复，需要仔细测试交互
    // document.addEventListener('mouseup', async () => {
    //   // 延迟一小段时间确保选区已更新
    //   setTimeout(async () => {
    //     await handleSelectionAndHighlight();
    //   }, 50);
    // });

    browser.runtime.onMessage.addListener(async (message: ExtensionMessage) => {
      if (message.action === 'logSelectionFromContextMenu' || message.action === 'highlightSelectionFromContextMenu') {
        // 假设右键菜单触发高亮也使用此逻辑
        await handleSelectionAndHighlight();
      }
    });
    return () => {
      document.removeEventListener('keyup', debouncedKeyUp);
    };
  }
});
