// 基础类型定义
export interface HighlightData {
  id: string;
  text: string;
  color: string;
  count: number;
  timestamp: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  highlightColor: string;
  enableShortcuts: boolean;
}
