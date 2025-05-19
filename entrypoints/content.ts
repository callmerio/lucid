import { debounce } from 'lodash-es';
import '../assets/css/main.css'; // 引入 Tailwind CSS
import { expandSelectionToFullWord } from '../utils/selectionUtils.ts';

/* ------------------------------------------------------------------
 *  内容脚本入口
 * ------------------------------------------------------------------*/
interface ExtensionMessage {
  action: string;
  [key: string]: any;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    /* ---------------- iframe‑context guard ---------------- */
    try {
      if (window.top !== window) {
        // Attempt to access top.location; throws if cross‑origin.
        void window.top.location.href;
      }
    } catch {
      // Cross‑origin iframe: abort early to avoid DOMException.
      console.warn('Lucid: skipping cross‑origin iframe (no same‑origin access)');
      return () => {};
    }
    console.log('Lucid 扩展：内容脚本已加载');
    const handleTextExpansion = (range: Range) => expandSelectionToFullWord(range);
    const debouncedKeyUp = debounce((e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          console.log(`[DEBUG][SELECTION] current raw selection: "${sel.toString()}"`);
          const r = sel.getRangeAt(0).cloneRange();
          console.log(`[DEBUG][SELECTION] original range text: "${r.toString()}"`);
          const nr = handleTextExpansion(r);
          console.log(`[DEBUG][SELECTION] expanded range text: "${nr.toString()}"`);
          sel.removeAllRanges();
          sel.addRange(nr);
        }
      }
    }, 250);
    document.addEventListener('keyup', debouncedKeyUp);
    browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.action === 'logSelectionFromContextMenu') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          console.log(`[DEBUG][SELECTION] current raw selection: "${sel.toString()}"`);
          const r = sel.getRangeAt(0).cloneRange();
          console.log(`[DEBUG][SELECTION] original range text: "${r.toString()}"`);
          const nr = handleTextExpansion(r);
          console.log(`[DEBUG][SELECTION] expanded range text: "${nr.toString()}"`);
          sel.removeAllRanges();
          sel.addRange(nr);
        }
      }
    });
    return () => {
      document.removeEventListener('keyup', debouncedKeyUp);
    };
  }
});
