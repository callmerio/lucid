import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import DevToolbar from "../../src/components/DevToolbar";
import { StagewiseToolbar } from "@stagewise/toolbar-react";

// Stagewise Toolbar Configuration
const stagewiseConfig = {
  plugins: []
};

// 渲染主应用
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
      {/* DevToolbar组件会自行判断是否为开发环境并相应地渲染 */}
      <DevToolbar />
    </React.StrictMode>,
  );
}

// Conditionally render Stagewise Toolbar in development mode and in a separate root
if (import.meta.env.DEV) {
  const stagewiseRootElement = document.getElementById("stagewise-toolbar-root");
  if (stagewiseRootElement) {
    const stagewiseRoot = ReactDOM.createRoot(stagewiseRootElement);
    stagewiseRoot.render(
      <React.StrictMode>
        <StagewiseToolbar config={stagewiseConfig} />
      </React.StrictMode>
    );
  } // No console.error here to avoid lint issue, or add // eslint-disable-next-line no-console
}
