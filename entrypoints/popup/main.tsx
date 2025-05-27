import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import DevToolbar from "../../src/components/DevToolbar";

// 渲染主应用
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {/* DevToolbar组件会自行判断是否为开发环境并相应地渲染 */}
    <DevToolbar />
  </React.StrictMode>,
);
