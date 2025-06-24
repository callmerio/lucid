import { defineBackground } from 'wxt/utils/define-background';

const CONTEXT_MENU_ID = "lucid-log-selected-text";

export default defineBackground(() => {
  console.log("Lucid Extension: Background script loaded.");

  // Create context menu item on installation or update
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Log Selected Text (Lucid)", // 右键菜单显示的文本
      contexts: ["selection"], // 只在选中文本时显示
    });
    console.log("Lucid Extension: Context menu created.");
  });

  // Listen for context menu clicks
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
      // Send a message to the content script in the active tab
      browser.tabs
        .sendMessage(tab.id, {
          action: "logSelectionFromContextMenu",
        })
        .catch((err) => {
          // Handle errors, e.g., if the content script isn't ready or doesn't exist on the page
          console.error(
            "Lucid Extension: Error sending message to content script",
            err,
          );
        });
    }
  });
});
