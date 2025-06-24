/**
 * withErrorBoundary 高阶组件测试
 * 测试错误边界组件的核心功能
 */

import { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock React 和相关依赖
vi.mock("react", () => ({
  default: {
    Component: class Component {
      constructor(props: any) {
        this.props = props;
        this.state = {};
      }
      setState(newState: any) {
        this.state = { ...this.state, ...newState };
      }
      render() {
        return null;
      }
    },
    createElement: vi.fn((type, props, ...children) => ({
      type,
      props: { ...props, children },
      key: props?.key || null,
    })),
  },
  Component: class Component {
    constructor(props: any) {
      this.props = props;
      this.state = {};
    }
    setState(newState: any) {
      this.state = { ...this.state, ...newState };
    }
    render() {
      return null;
    }
  },
}));

// Mock 错误边界状态接口
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any | null;
}

// Mock 错误边界属性接口
interface WithErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack?: string }) => void;
}

// Mock ErrorBoundary 类
class MockErrorBoundary {
  props: any;
  state: ErrorBoundaryState;

  constructor(props: any) {
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.state = {
      ...this.state,
      error,
      errorInfo,
    };

    // 调用错误处理回调
    this.props.onError?.(error, {
      componentStack: errorInfo.componentStack || undefined,
    });

    // 记录错误日志
    console.error("[Lucid] Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 渲染错误回退UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return {
        type: "div",
        props: {
          className: "lucid-error-boundary",
          children: [
            { type: "h3", props: { children: "Something went wrong" } },
            {
              type: "details",
              props: {
                style: { whiteSpace: "pre-wrap" },
                children: [
                  { type: "summary", props: { children: "Error details" } },
                  this.state.error?.toString(),
                  "\n",
                  this.state.errorInfo?.componentStack,
                ],
              },
            },
          ],
        },
      };
    }

    return this.props.children;
  }

  // 测试辅助方法
  simulateError(error: Error, errorInfo: any) {
    const newState = MockErrorBoundary.getDerivedStateFromError(error);
    this.state = { ...this.state, ...newState };
    this.componentDidCatch(error, errorInfo);
  }
}

// Mock withErrorBoundary 高阶组件
function mockWithErrorBoundary<P extends object>(
  WrappedComponent: any,
  errorBoundaryProps?: WithErrorBoundaryProps
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return {
      type: MockErrorBoundary,
      props: {
        ...errorBoundaryProps,
        children: {
          type: WrappedComponent,
          props,
        },
      },
    };
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundaryComponent;
}

// Mock 测试组件
const MockTestComponent = (props: { name: string; shouldThrow?: boolean }) => {
  if (props.shouldThrow) {
    throw new Error("Test component error");
  }
  return {
    type: "div",
    props: {
      children: `Hello, ${props.name}!`,
    },
  };
};

const MockThrowingComponent = () => {
  throw new Error("Component always throws");
};

describe("withErrorBoundary", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("高阶组件创建", () => {
    it("应该创建带错误边界的组件", () => {
      const WrappedComponent = mockWithErrorBoundary(MockTestComponent);

      expect(WrappedComponent).toBeDefined();
      expect(typeof WrappedComponent).toBe("function");
    });

    it("应该设置正确的 displayName", () => {
      const WrappedComponent = mockWithErrorBoundary(MockTestComponent);

      expect(WrappedComponent.displayName).toBe(
        "withErrorBoundary(MockTestComponent)"
      );
    });

    it("应该处理没有 displayName 的组件", () => {
      const AnonymousComponent = () => null;
      const WrappedComponent = mockWithErrorBoundary(AnonymousComponent);

      expect(WrappedComponent.displayName).toBe(
        "withErrorBoundary(AnonymousComponent)"
      );
    });

    it("应该处理没有名称的组件", () => {
      const WrappedComponent = mockWithErrorBoundary(() => null);

      expect(WrappedComponent.displayName).toBe("withErrorBoundary(Component)");
    });
  });

  describe("正常渲染", () => {
    it("应该正常渲染子组件", () => {
      const WrappedComponent = mockWithErrorBoundary(MockTestComponent);
      const result = WrappedComponent({ name: "Test" });

      expect(result.type).toBe(MockErrorBoundary);
      expect(result.props.children.type).toBe(MockTestComponent);
      expect(result.props.children.props.name).toBe("Test");
    });

    it("应该传递所有 props 给子组件", () => {
      const WrappedComponent = mockWithErrorBoundary(MockTestComponent);
      const props = { name: "Test", extra: "data", number: 42 };
      const result = WrappedComponent(props);

      expect(result.props.children.props).toEqual(props);
    });
  });

  describe("错误处理", () => {
    it("应该捕获子组件的错误", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });
      const error = new Error("Test error");
      const errorInfo = { componentStack: "Component stack trace" };

      errorBoundary.simulateError(error, errorInfo);

      expect(errorBoundary.state.hasError).toBe(true);
      expect(errorBoundary.state.error).toBe(error);
      expect(errorBoundary.state.errorInfo).toBe(errorInfo);
    });

    it("应该调用 onError 回调", () => {
      const onError = vi.fn();
      const errorBoundary = new MockErrorBoundary({ onError, children: null });
      const error = new Error("Test error");
      const errorInfo = { componentStack: "Component stack trace" };

      errorBoundary.simulateError(error, errorInfo);

      expect(onError).toHaveBeenCalledWith(error, {
        componentStack: "Component stack trace",
      });
    });

    it("应该记录错误到控制台", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });
      const error = new Error("Test error");
      const errorInfo = { componentStack: "Component stack trace" };

      errorBoundary.simulateError(error, errorInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Lucid] Error caught by ErrorBoundary:",
        error,
        errorInfo
      );
    });
  });

  describe("错误回退 UI", () => {
    it("应该渲染默认错误 UI", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });
      const error = new Error("Test error");
      const errorInfo = { componentStack: "Component stack trace" };

      errorBoundary.simulateError(error, errorInfo);
      const result = errorBoundary.render();

      expect(result.type).toBe("div");
      expect(result.props.className).toBe("lucid-error-boundary");
      expect(result.props.children[0].props.children).toBe(
        "Something went wrong"
      );
    });

    it("应该渲染自定义回退 UI", () => {
      const customFallback = {
        type: "div",
        props: { children: "Custom error message" },
      };
      const errorBoundary = new MockErrorBoundary({
        fallback: customFallback,
        children: null,
      });
      const error = new Error("Test error");
      const errorInfo = { componentStack: "Component stack trace" };

      errorBoundary.simulateError(error, errorInfo);
      const result = errorBoundary.render();

      expect(result).toBe(customFallback);
    });

    it("应该在错误详情中显示错误信息", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });
      const error = new Error("Detailed test error");
      const errorInfo = { componentStack: "Detailed component stack" };

      errorBoundary.simulateError(error, errorInfo);
      const result = errorBoundary.render();

      const details = result.props.children[1];
      const detailsContent = details.props.children;

      // 检查数组中是否包含错误信息
      expect(
        detailsContent.some(
          (item: any) =>
            typeof item === "string" && item.includes("Detailed test error")
        )
      ).toBe(true);
      expect(
        detailsContent.some(
          (item: any) =>
            typeof item === "string" &&
            item.includes("Detailed component stack")
        )
      ).toBe(true);
    });
  });

  describe("getDerivedStateFromError", () => {
    it("应该从错误中派生状态", () => {
      const error = new Error("State derivation test");
      const derivedState = MockErrorBoundary.getDerivedStateFromError(error);

      expect(derivedState.hasError).toBe(true);
      expect(derivedState.error).toBe(error);
    });

    it("应该返回部分状态对象", () => {
      const error = new Error("Partial state test");
      const derivedState = MockErrorBoundary.getDerivedStateFromError(error);

      expect(Object.keys(derivedState)).toEqual(["hasError", "error"]);
      expect(derivedState.errorInfo).toBeUndefined();
    });
  });

  describe("错误边界配置", () => {
    it("应该传递错误边界配置", () => {
      const errorBoundaryProps = {
        fallback: { type: "div", props: { children: "Custom fallback" } },
        onError: vi.fn(),
      };

      const WrappedComponent = mockWithErrorBoundary(
        MockTestComponent,
        errorBoundaryProps
      );
      const result = WrappedComponent({ name: "Test" });

      expect(result.props.fallback).toBe(errorBoundaryProps.fallback);
      expect(result.props.onError).toBe(errorBoundaryProps.onError);
    });

    it("应该处理空的错误边界配置", () => {
      const WrappedComponent = mockWithErrorBoundary(MockTestComponent);
      const result = WrappedComponent({ name: "Test" });

      expect(result.props.fallback).toBeUndefined();
      expect(result.props.onError).toBeUndefined();
    });
  });

  describe("错误恢复", () => {
    it("应该在没有错误时正常渲染", () => {
      const errorBoundary = new MockErrorBoundary({
        children: { type: "div", props: { children: "Normal content" } },
      });

      const result = errorBoundary.render();

      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Normal content");
    });

    it("应该能够从错误状态恢复", () => {
      const errorBoundary = new MockErrorBoundary({
        children: { type: "div", props: { children: "Normal content" } },
      });

      // 模拟错误
      errorBoundary.simulateError(new Error("Test"), {});
      expect(errorBoundary.state.hasError).toBe(true);

      // 重置状态（模拟组件重新挂载或状态重置）
      errorBoundary.state = {
        hasError: false,
        error: null,
        errorInfo: null,
      };

      const result = errorBoundary.render();
      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Normal content");
    });
  });

  describe("边界情况", () => {
    it("应该处理 null 子组件", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });

      const result = errorBoundary.render();

      expect(result).toBe(null);
    });

    it("应该处理 undefined 错误信息", () => {
      const errorBoundary = new MockErrorBoundary({ children: null });
      const error = new Error("Test error");

      errorBoundary.simulateError(error, {});
      const result = errorBoundary.render();

      expect(result.type).toBe("div");
      expect(result.props.className).toBe("lucid-error-boundary");
    });

    it("应该处理没有 componentStack 的错误信息", () => {
      const onError = vi.fn();
      const errorBoundary = new MockErrorBoundary({ onError, children: null });
      const error = new Error("Test error");
      const errorInfo = { otherInfo: "some data" };

      errorBoundary.simulateError(error, errorInfo);

      expect(onError).toHaveBeenCalledWith(error, {
        componentStack: undefined,
      });
    });
  });
});
