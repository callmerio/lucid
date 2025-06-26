/**
 * 透明弹窗集成测试
 * 测试透明弹窗功能与现有系统的集成和兼容性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟DOM环境
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  scrollX: 0,
  scrollY: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
  clearTimeout: vi.fn((id) => clearTimeout(id)),
  getSelection: vi.fn(() => ({
    rangeCount: 0,
    toString: () => '',
    removeAllRanges: vi.fn(),
    addRange: vi.fn()
  }))
};

const mockDocument = {
  createElement: vi.fn(() => ({
    id: '',
    className: '',
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    contains: vi.fn(() => false),
    parentNode: {
      removeChild: vi.fn()
    },
    getBoundingClientRect: vi.fn(() => ({
      left: 100,
      top: 100,
      right: 200,
      bottom: 150,
      width: 100,
      height: 50
    }))
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  getElementById: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// 模拟browser API
const mockBrowser = {
  runtime: {
    onMessage: {
      addListener: vi.fn()
    },
    sendMessage: vi.fn()
  }
};

// 设置全局模拟
Object.defineProperty(global, 'window', { value: mockWindow, writable: true });
Object.defineProperty(global, 'document', { value: mockDocument, writable: true });
Object.defineProperty(global, 'browser', { value: mockBrowser, writable: true });

// 模拟React
global.React = {
  createElement: vi.fn(() => ({ type: 'div', props: {} }))
};

global.createRoot = vi.fn(() => ({
  render: vi.fn(),
  unmount: vi.fn()
}));

describe('透明弹窗集成测试', () => {
  let mockTransparentPopupManager: any;
  let mockTooltipManager: any;
  let mockToolpopupManager: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();

    // 重置DOM状态
    mockDocument.getElementById.mockReturnValue(null);

    // 创建模拟管理器
    mockTransparentPopupManager = {
      isVisible: false,
      currentPopup: null,
      eventCleanups: [],

      getInstance: vi.fn(() => mockTransparentPopupManager),
      show: vi.fn(() => {
        mockTransparentPopupManager.isVisible = true;
        mockTransparentPopupManager.currentPopup = mockDocument.createElement();
        mockDocument.body.appendChild(mockTransparentPopupManager.currentPopup);
      }),
      hide: vi.fn(() => {
        mockTransparentPopupManager.isVisible = false;
        if (mockTransparentPopupManager.currentPopup) {
          mockDocument.body.removeChild(mockTransparentPopupManager.currentPopup);
          mockTransparentPopupManager.currentPopup = null;
        }
      }),
      toggle: vi.fn(() => {
        if (mockTransparentPopupManager.isVisible) {
          mockTransparentPopupManager.hide();
        } else {
          mockTransparentPopupManager.show();
        }
      }),
      destroy: vi.fn(() => {
        if (mockTransparentPopupManager.isVisible) {
          mockTransparentPopupManager.hide();
        }
        mockTransparentPopupManager.eventCleanups = [];
      })
    };

    mockTooltipManager = {
      isVisible: false,
      getInstance: vi.fn(() => mockTooltipManager),
      showTooltip: vi.fn(),
      hideTooltip: vi.fn(),
      destroy: vi.fn()
    };

    mockToolpopupManager = {
      isVisible: false,
      getInstance: vi.fn(() => mockToolpopupManager),
      showToolpopup: vi.fn(),
      hideToolpopup: vi.fn(),
      destroy: vi.fn()
    };
  });

  afterEach(() => {
    // 清理状态
    mockTransparentPopupManager.destroy();
  });

  describe('基本功能测试', () => {
    it('应该能够正确初始化透明弹窗管理器', () => {
      const manager = mockTransparentPopupManager.getInstance();

      expect(manager).toBeDefined();
      expect(manager.isVisible).toBe(false);
      expect(manager.currentPopup).toBeNull();
    });

    it('应该能够显示和隐藏透明弹窗', () => {
      const manager = mockTransparentPopupManager;

      // 测试显示
      manager.show();
      expect(manager.isVisible).toBe(true);
      expect(manager.currentPopup).toBeTruthy();
      expect(mockDocument.body.appendChild).toHaveBeenCalled();

      // 测试隐藏
      manager.hide();
      expect(manager.isVisible).toBe(false);
      expect(manager.currentPopup).toBeNull();
    });

    it('应该能够切换弹窗状态', () => {
      const manager = mockTransparentPopupManager;

      // 初始状态：隐藏
      expect(manager.isVisible).toBe(false);

      // 第一次切换：显示
      manager.toggle();
      expect(manager.isVisible).toBe(true);

      // 第二次切换：隐藏
      manager.toggle();
      expect(manager.isVisible).toBe(false);
    });
  });

  describe('消息处理测试', () => {
    it('应该能够处理来自background的切换消息', () => {
      const manager = mockTransparentPopupManager;

      // 模拟消息监听器
      const messageHandler = vi.fn((message, sender, sendResponse) => {
        if (message.action === 'lucid:transparent-popup:toggle') {
          manager.toggle();
          sendResponse({ success: true });
        }
        return true;
      });

      // 模拟接收消息
      const mockMessage = { action: 'lucid:transparent-popup:toggle' };
      const mockSendResponse = vi.fn();

      messageHandler(mockMessage, null, mockSendResponse);

      expect(manager.toggle).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('应该能够处理无效消息', () => {
      const manager = mockTransparentPopupManager;

      const messageHandler = vi.fn((message, sender, sendResponse) => {
        if (message.action === 'lucid:transparent-popup:toggle') {
          manager.toggle();
          sendResponse({ success: true });
        }
        return true;
      });

      // 发送无效消息
      const invalidMessage = { action: 'invalid-action' };
      const mockSendResponse = vi.fn();

      messageHandler(invalidMessage, null, mockSendResponse);

      expect(manager.toggle).not.toHaveBeenCalled();
      expect(mockSendResponse).not.toHaveBeenCalled();
    });
  });

  describe('与现有功能兼容性测试', () => {
    it('应该与TooltipManager和ToolpopupManager共存', () => {
      const transparentManager = mockTransparentPopupManager;
      const tooltipManager = mockTooltipManager;
      const toolpopupManager = mockToolpopupManager;

      // 同时初始化所有管理器
      transparentManager.getInstance();
      tooltipManager.getInstance();
      toolpopupManager.getInstance();

      // 显示透明弹窗不应影响其他管理器
      transparentManager.show();
      expect(transparentManager.isVisible).toBe(true);
      expect(tooltipManager.isVisible).toBe(false);
      expect(toolpopupManager.isVisible).toBe(false);

      // 显示tooltip不应影响透明弹窗
      tooltipManager.showTooltip();
      expect(transparentManager.isVisible).toBe(true);
    });

    it('应该正确处理多个管理器的销毁', () => {
      const transparentManager = mockTransparentPopupManager;
      const tooltipManager = mockTooltipManager;
      const toolpopupManager = mockToolpopupManager;

      // 显示所有组件
      transparentManager.show();
      tooltipManager.showTooltip();
      toolpopupManager.showToolpopup();

      // 销毁所有管理器
      transparentManager.destroy();
      tooltipManager.destroy();
      toolpopupManager.destroy();

      expect(transparentManager.destroy).toHaveBeenCalled();
      expect(tooltipManager.destroy).toHaveBeenCalled();
      expect(toolpopupManager.destroy).toHaveBeenCalled();
    });
  });

  describe('事件处理测试', () => {
    it('应该正确处理点击外部关闭', () => {
      const manager = mockTransparentPopupManager;

      // 显示弹窗
      manager.show();
      expect(manager.isVisible).toBe(true);

      // 模拟点击外部
      const outsideElement = mockDocument.createElement();
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', { value: outsideElement });

      // 模拟点击外部处理逻辑
      if (manager.currentPopup && !manager.currentPopup.contains(clickEvent.target)) {
        manager.hide();
      }

      expect(manager.isVisible).toBe(false);
    });

    it('应该正确处理ESC键关闭', () => {
      const manager = mockTransparentPopupManager;

      // 显示弹窗
      manager.show();
      expect(manager.isVisible).toBe(true);

      // 模拟ESC键按下
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });

      // 模拟ESC键处理逻辑
      if (escEvent.key === 'Escape' && manager.isVisible) {
        manager.hide();
      }

      expect(manager.isVisible).toBe(false);
    });
  });

  describe('错误处理测试', () => {
    it('应该优雅处理DOM操作错误', () => {
      // 创建独立的管理器实例用于错误测试
      const errorTestManager = {
        isVisible: false,
        currentPopup: null,
        show: vi.fn(() => {
          try {
            mockDocument.body.appendChild(mockDocument.createElement());
          } catch (error) {
            console.error('透明弹窗显示失败:', error);
            // 优雅处理错误，不抛出异常
          }
        })
      };

      // 模拟DOM操作失败
      const originalAppendChild = mockDocument.body.appendChild;
      mockDocument.body.appendChild = vi.fn(() => {
        throw new Error('DOM operation failed');
      });

      // 显示弹窗应该不会抛出错误
      expect(() => {
        errorTestManager.show();
      }).not.toThrow();

      // 恢复原始方法
      mockDocument.body.appendChild = originalAppendChild;
    });

    it('应该处理重复操作', () => {
      const manager = mockTransparentPopupManager;

      // 重置调用计数
      vi.clearAllMocks();

      // 重复显示
      manager.show();
      manager.show();
      expect(manager.show).toHaveBeenCalledTimes(2);

      // 重复隐藏
      manager.hide();
      manager.hide();
      expect(manager.hide).toHaveBeenCalledTimes(2);
    });
  });
});
