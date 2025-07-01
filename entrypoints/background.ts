import { defineBackground } from 'wxt/utils/define-background';

const CONTEXT_MENU_ID = "lucid-log-selected-text";

export default defineBackground(() => {
  console.log("Lucid Extension: Background script loaded.");
  console.log("Lucid Extension: Available APIs:", {
    action: !!browser.action,
    tabs: !!browser.tabs,
    contextMenus: !!browser.contextMenus,
    runtime: !!browser.runtime
  });

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

  // Listen for extension icon clicks (action button)
  if (browser.action && browser.action.onClicked) {
    browser.action.onClicked.addListener(async (tab) => {
      console.log("Lucid Extension: Action button clicked");

      if (tab?.id) {
        try {
          // Send message to content script to toggle transparent popup
          await browser.tabs.sendMessage(tab.id, {
            action: 'lucid:transparent-popup:toggle',
            source: 'background',
            timestamp: Date.now()
          });
          console.log("Lucid Extension: Transparent popup toggle message sent successfully");
        } catch (error) {
          console.error("Lucid Extension: Failed to send transparent popup toggle message:", error);
        }
      } else {
        console.warn("Lucid Extension: No active tab found for action button click");
      }
    });
    console.log("Lucid Extension: Action button listener registered");
  } else {
    console.error("Lucid Extension: browser.action API not available");
  }

  // Listen for global keyboard commands
  if (browser.commands && browser.commands.onCommand) {
    browser.commands.onCommand.addListener(async (command) => {
      console.log("Lucid Extension: Command received:", command);
      
      // Get the current active tab
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab?.id) {
        console.warn("Lucid Extension: No active tab found for command:", command);
        return;
      }

      try {
        switch (command) {
          case "toggle-transparent-popup":
            await browser.tabs.sendMessage(activeTab.id, {
              action: 'lucid:transparent-popup:toggle',
              source: 'keyboard-shortcut',
              command: command,
              timestamp: Date.now()
            });
            console.log("Lucid Extension: Transparent popup toggle command sent");
            break;
            
          case "highlight-selection":
            await browser.tabs.sendMessage(activeTab.id, {
              action: 'lucid:highlight-selection',
              source: 'keyboard-shortcut', 
              command: command,
              timestamp: Date.now()
            });
            console.log("Lucid Extension: Highlight selection command sent");
            break;
            
          default:
            console.warn("Lucid Extension: Unknown command:", command);
        }
      } catch (error) {
        console.error("Lucid Extension: Failed to send command message:", error);
      }
    });
    console.log("Lucid Extension: Command listeners registered");
  } else {
    console.error("Lucid Extension: browser.commands API not available");
  }
});
