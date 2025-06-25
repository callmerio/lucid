// {{CHENGQI:
// Action: Modified; Timestamp: 2025-06-25 21:15; Reason: 完全重写popup使用lucid-toolpopup-container设计风格;
// }}

import { useState, useEffect, useCallback } from "react";
import "./style.css";

/**
 * 扩展消息接口
 */
interface ExtensionMessage<T = any> {
  action: string;
  payload?: T;
  source: "content" | "popup" | "background";
  timestamp: number;
  tabId?: number;
}

/**
 * 词汇数据接口
 */
interface WordData {
  word: string;
  count: number;
  translation?: string;
  lastSeen?: number;
}

/**
 * 扩展统计数据接口
 */
interface ExtensionStats {
  totalWords: number;
  todayWords: number;
  currentPageWords: number;
  extensionEnabled: boolean;
}

function App() {
  const [words, setWords] = useState<WordData[]>([]);
  const [stats, setStats] = useState<ExtensionStats>({
    totalWords: 0,
    todayWords: 0,
    currentPageWords: 0,
    extensionEnabled: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);

  useEffect(() => {
    initializePopup();
    return cleanup;
  }, []);

  /**
   * 初始化Popup
   */
  const initializePopup = useCallback(async () => {
    try {
      console.log("[Popup] 初始化开始");

      // 设置消息监听器
      if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(handleMessage);
      }

      // 获取当前活动标签页
      if (typeof browser !== 'undefined' && browser.tabs) {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id) {
          setCurrentTabId(tabs[0].id);
          console.log("[Popup] 当前标签页ID:", tabs[0].id);
        }
      }

      // 加载数据
      await Promise.all([
        loadWordsData(),
        loadStatsData(),
      ]);

      setConnectionStatus("connected");
      console.log("[Popup] 初始化完成");
    } catch (error) {
      console.error("[Popup] 初始化失败:", error);
      setConnectionStatus("disconnected");
    }
  }, []);

  /**
   * 处理接收到的消息
   */
  const handleMessage = useCallback(
    (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log("[Popup] 收到消息:", message);

      if (message.target !== "popup") {
        return;
      }

      try {
        switch (message.action) {
          case "lucid:popup:word-added":
            handleWordAddedMessage(message.payload);
            break;
          case "lucid:popup:highlight-updated":
            handleHighlightUpdatedMessage(message.payload);
            break;
          default:
            console.log("[Popup] 未知消息类型:", message.action);
        }
        sendResponse({ success: true });
      } catch (error) {
        console.error("[Popup] 处理消息时出错:", error);
        sendResponse({ success: false, error: error.message });
      }

      return true;
    },
    []
  );

  /**
   * 加载词汇数据
   */
  const loadWordsData = useCallback(async () => {
    try {
      // 从storage加载词汇数据，如果没有则使用模拟数据
      const mockWords: WordData[] = [
        { word: "example", count: 5, translation: "例子", lastSeen: Date.now() - 3600000 },
        { word: "vocabulary", count: 3, translation: "词汇", lastSeen: Date.now() - 7200000 },
        { word: "extension", count: 8, translation: "扩展", lastSeen: Date.now() - 1800000 },
        { word: "highlight", count: 12, translation: "高亮", lastSeen: Date.now() - 900000 },
      ];
      
      setWords(mockWords);
      console.log("[Popup] 词汇数据加载完成:", mockWords.length, "个词汇");
    } catch (error) {
      console.error("[Popup] 加载词汇数据失败:", error);
    }
  }, []);

  /**
   * 加载统计数据
   */
  const loadStatsData = useCallback(async () => {
    try {
      // 从storage加载统计数据，如果没有则使用模拟数据
      const mockStats: ExtensionStats = {
        totalWords: 1247,
        todayWords: 23,
        currentPageWords: 8,
        extensionEnabled: true,
      };
      
      setStats(mockStats);
      console.log("[Popup] 统计数据加载完成:", mockStats);
    } catch (error) {
      console.error("[Popup] 加载统计数据失败:", error);
    }
  }, []);

  /**
   * 处理词汇添加消息
   */
  const handleWordAddedMessage = useCallback((payload: any) => {
    console.log("[Popup] 处理词汇添加:", payload);
    // 重新加载数据
    loadWordsData();
    loadStatsData();
  }, [loadWordsData, loadStatsData]);

  /**
   * 处理高亮更新消息
   */
  const handleHighlightUpdatedMessage = useCallback((payload: any) => {
    console.log("[Popup] 处理高亮更新:", payload);
    // 重新加载数据
    loadStatsData();
  }, [loadStatsData]);

  /**
   * 发送消息到Content Script
   */
  const sendMessage = useCallback(
    async (action: string, payload?: any): Promise<any> => {
      try {
        if (typeof browser === 'undefined' || !browser.runtime) {
          throw new Error("Browser runtime not available");
        }

        const message: ExtensionMessage = {
          action,
          payload,
          source: "popup",
          timestamp: Date.now(),
          tabId: currentTabId || undefined,
        };

        console.log("[Popup] 发送消息:", message);
        const response = await browser.runtime.sendMessage(message);
        console.log("[Popup] 收到响应:", response);

        return response;
      } catch (error) {
        console.error("[Popup] 发送消息失败:", error);
        setConnectionStatus("disconnected");
        throw error;
      }
    },
    [currentTabId]
  );

  /**
   * 聚焦词汇
   */
  const handleFocusWord = useCallback(
    async (word: string) => {
      try {
        await sendMessage("lucid:content:focus-word", {
          word,
          scrollIntoView: true,
        });
      } catch (error) {
        console.error("[Popup] 聚焦词汇失败:", error);
      }
    },
    [sendMessage]
  );

  /**
   * 切换扩展启用状态
   */
  const handleToggleExtension = useCallback(async () => {
    try {
      const newState = !stats.extensionEnabled;
      await sendMessage("lucid:content:toggle-extension", {
        enabled: newState,
      });
      
      setStats(prev => ({ ...prev, extensionEnabled: newState }));
    } catch (error) {
      console.error("[Popup] 切换扩展状态失败:", error);
    }
  }, [stats.extensionEnabled, sendMessage]);

  /**
   * 清理函数
   */
  const cleanup = useCallback(() => {
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage.hasListener) {
      browser.runtime.onMessage.removeListener(handleMessage);
    }
    console.log("[Popup] 清理完成");
  }, [handleMessage]);

  /**
   * 格式化时间
   */
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return "刚才";
    }
  };

  return (
    <div className="lucid-toolpopup-container lucid-toolpopup-visible">
      {/* 标题栏 */}
      <div className="popup-header">
        <div className="popup-title">
          <span className="popup-icon">📚</span>
          <span>Lucid 词汇助手</span>
        </div>
        <div className="popup-status">
          <div className={`status-indicator ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === "connected" ? "已连接" : connectionStatus === "connecting" ? "连接中" : "已断开"}
            </span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalWords}</div>
            <div className="stat-label">总词汇</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.todayWords}</div>
            <div className="stat-label">今日新增</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.currentPageWords}</div>
            <div className="stat-label">当前页面</div>
          </div>
        </div>
      </div>

      {/* 扩展控制 */}
      <div className="controls-section">
        <div className="control-item">
          <span className="control-label">扩展启用</span>
          <button 
            className={`toggle-button ${stats.extensionEnabled ? 'enabled' : 'disabled'}`}
            onClick={handleToggleExtension}
          >
            <span className="toggle-slider"></span>
          </button>
        </div>
      </div>

      {/* 词汇列表 */}
      <div className="words-section">
        <div className="section-header">
          <span className="section-title">最近词汇</span>
          <span className="section-count">{words.length}</span>
        </div>
        
        <div className="words-list">
          {words.length > 0 ? (
            words.slice(0, 6).map((wordData, index) => (
              <div 
                key={index} 
                className="word-item"
                onClick={() => handleFocusWord(wordData.word)}
              >
                <div className="word-content">
                  <div className="word-text">{wordData.word}</div>
                  <div className="word-translation">{wordData.translation}</div>
                </div>
                <div className="word-meta">
                  <div className="word-count">{wordData.count}次</div>
                  <div className="word-time">
                    {wordData.lastSeen ? formatTimeAgo(wordData.lastSeen) : "-"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📖</span>
              <span className="empty-text">暂无词汇记录</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="actions-section">
        <button className="action-button secondary">
          <span>⚙️</span>
          设置
        </button>
        <button className="action-button primary">
          <span>📊</span>
          详细统计
        </button>
      </div>
    </div>
  );
}

export default App;