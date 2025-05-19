# Lucid 浏览器扩展 - “智能高亮”与“查词方案”功能深化详细计划

**目标：** 显著提升 Lucid 浏览器扩展的核心功能——文本高亮和查词的智能化程度与用户体验。

---

**项目结构设计 (基于 WXT + React)**

本项目遵循 WXT (Web Extension Toolkit) 的推荐项目结构，并结合 React 进行 UI 开发。主要目录和文件说明如下：

*   **`entrypoints/`**: 浏览器扩展的入口文件。
    *   `content.ts`: 内容脚本，用于与网页 DOM 交互，实现核心的智能高亮功能。
    *   `background.ts`: 后台脚本，处理长期运行的任务、事件监听、状态管理以及与后端 API 的通信。
    *   `popup/`: Popup 页面的相关文件。
        *   `index.html`: Popup 页面的 HTML 骨架。
        *   `main.tsx`: Popup 页面的 React 应用入口。
        *   `App.tsx`: Popup 页面的主 React 组件。
        *   `App.css`, `style.css`: Popup 页面的样式文件。
    *   *(未来可能包括)* `options/`: 扩展选项页面的相关文件。

*   **`components/`**: (建议新增) 通用的 React UI 组件，可在 Popup、Options 页面或其他 React 驱动的 UI 中复用。

*   **`hooks/`**: (建议新增) 自定义的 React Hooks，用于封装可复用的逻辑。

*   **`utils/`**: (建议新增) 通用的工具函数模块，例如 DOM 操作、数据处理、API 请求等，可被 Content Script, Background Script, Popup 等多处引用。

*   **`assets/`**: 项目中使用的静态资源，如图片 (`react.svg`)。这些资源会被 WXT 处理和优化。

*   **`public/`**: 不需要构建处理，直接复制到最终扩展包根目录的静态文件。
    *   `icon/`: 包含不同尺寸的扩展图标 (`16.png`, `32.png`, `48.png`, `96.png`, `128.png`)。
    *   `wxt.svg`: WXT 的示例 SVG。
    *   *(WXT 会自动管理 `manifest.json` 的生成)*

*   **`doc/`**: 项目文档。
    *   `plan.md`: 本开发计划文档。
    *   `dev_progress.md`: 开发进度记录。

*   **`wxt.config.ts`**: WXT 的配置文件，用于定义扩展的 manifest 内容、入口点、构建选项等。

*   **`package.json`**: Node.js 项目配置文件，包含项目依赖 (如 React, WXT, lodash-es) 和脚本命令 (如 `dev`, `build`, `zip`)。

*   **`tsconfig.json`**: TypeScript 配置文件。

*   **`.gitignore`**: Git 版本控制忽略文件列表。

*   **`README.md`**: 项目说明文件。

参考链接：[WXT Project Structure](https://wxt.dev/guide/essentials/project-structure.html)

---

**核心模块：**

1.  **智能高亮 (Smart Highlighting)**
2.  **查词方案 (Word Lookup Scheme)**

---

**模块一：智能高亮功能深化**

*   **1.1. 精准的“完整单词扩展” (Core Implementation)**
    *   **用户故事：** 当用户在网页上选择部分文本时，系统应能自动将选区扩展到包含所选内容的完整单词，以便用户快速准确地高亮目标。
    *   **功能描述：**
        *   实时捕获用户通过鼠标或触摸进行的文本选择。
        *   基于选区，向前后两个方向扩展，直到遇到明确的单词边界。
        *   单词边界定义：空格、标点符号 (.,;:?!'"()[]{}等)、换行符、HTML标签边界。需考虑多语言环境下的边界字符（如中文、日文的标点）。
        *   特殊情况处理：
            *   连字符单词 (e.g., "state-of-the-art" 应视为一个整体)。
            *   包含撇号的单词 (e.g., "can't", "it's")。
            *   数字与单位 (e.g., "100kg")。
            *   网址和邮箱地址。
        *   更新高亮显示，确保视觉上准确反映扩展后的选区。
    *   **技术实现要点：**
        *   前端 JavaScript：使用 `window.getSelection()` API 获取 `Selection` 对象和 `Range` 对象。
        *   DOM遍历与文本分析：操作 `Range` 对象的 `startContainer`, `startOffset`, `endContainer`, `endOffset` 属性。
        *   正则表达式与 Unicode 字符属性：辅助判断单词边界和特殊字符。
        *   性能优化：避免在用户快速选择时造成卡顿，可考虑使用 `debounce` 或 `throttle`。

*   **1.2. 探索“基于语义上下文的智能边界判断” (Advanced Enhancement - Research Spike)**
    *   **用户故事：** 在某些情况下，用户可能希望高亮的是一个有意义的短语或概念，而不仅仅是单个单词。系统应能尝试这种意图，提供更智能的边界建议。
    *   **功能描述：**
        *   在“完整单词扩展”的基础上，分析高亮单词及其周围的上下文。
        *   尝试识别常见的短语模式，如名词短语 (e.g., "artificial intelligence")、固定搭配等。
        *   提供选项或建议，让用户决定是否采纳更广的语义边界。
    *   **技术探索方向：**
        *   **方向一 (轻量级)：结合查词返回的词性信息。**
            *   依赖查词服务返回的词性。
            *   规则引擎：例如，如果高亮了形容词，检查其后是否紧跟名词，并建议一起高亮。
        *   **方向二 (中量级)：客户端 NLP 库。**
            *   调研如 `Compromise.cool` 等轻量级客户端 NLP 库。
            *   进行词性标注 (POS Tagging)、名词短语识别 (Noun Phrase Chunking)。
            *   评估库的体积、性能、准确性以及在浏览器扩展环境中的集成复杂度。
        *   **方向三 (重量级 - 可能不适合纯前端)：调用后端 NLP 服务。**
            *   如果需要更复杂的语义分析，可能需要后端支持。
    *   **产出：**
        *   技术调研报告，对比不同方案的优缺点。
        *   原型验证（针对选定的1-2个方向）。
        *   明确此高级功能在当前阶段的可行性和实现优先级。

---

**模块二：查词方案细化 (采用后端缓存策略)**

*   **2.1. 后端：统一 AI 查词与核心信息提取**
    *   **用户故事：** 用户高亮并触发查词后，系统应能通过后端服务，从权威的 AI 词典服务获取单词的准确词性、基本释义和标准发音。
    *   **功能描述：**
        *   后端服务作为插件与第三方 AI 词典服务之间的代理和处理器。
        *   后端负责调用选定的第三方 AI 词典 API (如 Free Dictionary API, Merriam-Webster API, Wordnik API, 或配置通用 LLM API 如 OpenAI, Gemini 等)。
        *   后端解析第三方 API 的响应，提取核心信息：
            *   单词原文
            *   词性 (e.g., noun, verb, adjective)
            *   基本释义 (可包含多条，每条对应一个词性)
            *   发音信息 (IPA音标、音频文件URL)
        *   将提取的信息构造成统一、标准化的 JSON 格式，供插件端使用。
    *   **技术实现要点 (后端)：**
        *   选择合适的后端语言和框架 (e.g., Node.js/Express, Python/Flask/Django, Go)。
        *   HTTP 客户端库，用于调用第三方 API。
        *   健壮的错误处理和重试机制。
        *   API 密钥管理。

*   **2.2. 后端：查词结果的持久化与中心化缓存**
    *   **用户故事：** 为了提高查词效率并减少对第三方 API 的依赖和费用，后端服务应缓存已查询过的单词信息。
    *   **功能描述：**
        *   后端将从第三方 AI 服务获取并处理好的单词信息（标准化 JSON）存储在自己的数据库中。
        *   当收到插件的查词请求时，后端首先查询自己的数据库缓存。
        *   如果缓存命中且数据有效（未过期），则直接返回缓存数据。
        *   如果缓存未命中或数据已过期，则调用第三方 AI 服务，获取新数据，存入后端数据库（更新缓存），然后返回给插件。
    *   **技术实现要点 (后端)：**
        *   数据库选型：
            *   关系型数据库 (e.g., PostgreSQL, MySQL) 适合结构化数据。
            *   NoSQL数据库 (e.g., MongoDB) 适合存储 JSON 文档。
        *   缓存服务 (可选，用于热点数据)：Redis, Memcached。
        *   缓存策略：
            *   TTL (Time-To-Live)：为缓存数据设置有效期。
            *   数据版本控制：当词典信息更新时，如何更新缓存。
            *   LRU/LFU (Least Recently Used / Least Frequently Used)：如果缓存空间有限。

*   **2.3. 插件端：与后端查词 API 交互**
    *   **用户故事：** 插件应能安全、高效地向后端查词 API 发送请求，并处理返回的单词信息。
    *   **功能描述：**
        *   插件在用户触发查词时，向后端定义的 API 端点发送 HTTP GET 请求，参数为待查询的单词。
        *   接收后端返回的 JSON 数据。
        *   解析 JSON 数据，并在用户界面 (如 Popup 或侧边栏) 中展示单词的词性、释义和发音按钮。
    *   **技术实现要点 (插件前端)：**
        *   使用 `fetch` API 或 `axios` 等库发送 HTTP 请求。
        *   处理网络错误、API 错误。
        *   用户认证与授权（如果后端 API 需要）。

*   **2.4. 插件端：可选的轻量级前端缓存 (进一步优化体验)**
    *   **用户故事：** 对于用户最近或频繁查询的少量单词，插件可以在本地进行极轻量级的缓存，以实现更快的即时响应，并减少不必要的后端请求。
    *   **功能描述：**
        *   在调用后端 API 前，先检查插件本地的轻量级缓存。
        *   缓存内容：仅单词原文、词性、基本文本释义（不含音频等大文件信息，避免占用过多本地存储）。
        *   缓存策略：
            *   存储位置：`localStorage` 或 `sessionStorage` (前者持久，后者会话结束清除)。
            *   容量限制：例如，只缓存最近查询的 20-50 个单词。
            *   过期机制：简单的 TTL (e.g., 1小时或当前会话)。
    *   **技术实现要点 (插件前端)：**
        *   封装本地存储的读写操作。
        *   实现简单的缓存管理逻辑 (增、删、查、过期判断)。

*   **2.5. 插件端：发音功能实现**
    *   **用户故事：** 用户在查看查词结果时，可以点击发音按钮，听到单词的标准发音。
    *   **功能描述：**
        *   在查词结果展示区域，为每个单词提供一个可点击的发音图标。
        *   点击后播放发音。
    *   **技术实现要点 (插件前端)：**
        *   **方案一 (首选)：使用后端提供的音频链接。**
            *   如果后端 API 返回了音频文件的 URL (e.g., `.mp3`)，使用 HTML5 `<audio>` 元素播放。
            *   `<audio id="wordAudioPlayer" src=""></audio>`
            *   `document.getElementById('wordAudioPlayer').src = audioUrl; document.getElementById('wordAudioPlayer').play();`
        *   **方案二 (备选/补充)：客户端文本转语音 (TTS)。**
            *   使用浏览器内置的 `SpeechSynthesis API` (`window.speechSynthesis` 和 `SpeechSynthesisUtterance`)。
            *   `const utterance = new SpeechSynthesisUtterance('word_to_speak'); window.speechSynthesis.speak(utterance);`
            *   优点：无需额外请求，浏览器原生支持。
            *   缺点：发音质量和支持的语言可能因浏览器和操作系统而异。可根据后端返回的单词文本或 IPA 音标进行发音。

---

**三、整体交互流程示意图 (后端缓存版)**

```mermaid
graph TD
    subgraph 用户操作与前端交互
        A[用户在网页选择文本] --> B{智能高亮模块};
        B -- 扩展至完整单词 --> C[更新高亮区域];
        B -- (可选)语义边界判断 --> C;
        C --> D{用户触发查词操作<br>(如点击高亮/快捷键)};
        D -- 提取高亮文本中的单词 --> E[插件查词控制模块];
    end

    subgraph 插件与后端交互
        E --> F{查询插件端轻量缓存 (可选)};
        F -- 轻量缓存命中 --> G[从轻量缓存获取数据];
        F -- 轻量缓存未命中或无此机制 --> H[调用后端查词API<br>GET /api/v1/dictionary/lookup];
    end

    subgraph 后端处理与AI服务
        H --> I{后端服务接收请求};
        I --> J{查询后端中心化缓存 (DB/Redis)};
        J -- 后端缓存命中 --> K[从后端缓存获取数据];
        J -- 后端缓存未命中 --> L[调用第三方AI查词服务];
        L --> M[获取词性/释义/发音数据];
        M --> N[更新/存入后端中心化缓存];
        N --> K;
    end

    subgraph 数据返回与前端展示
        K --> O[后端API返回查词结果给插件];
        O --> P{插件接收数据};
        P -- (可选)更新插件端轻量缓存 --> G;
        G --> Q[在UI(Popup/侧边栏)展示查词结果];
        Q -- 用户点击发音按钮 --> R{发音模块};
        R -- 有音频链接 (来自后端) --> S[播放音频 (HTML5 Audio)];
        R -- 无音频链接/使用TTS --> T[调用TTS API发音];
    end
```

---

**四、下一步行动建议**

1.  **评估后端资源与可行性 (您当前正在进行)：**
    *   评估团队是否有后端开发能力和资源。
    *   如果需要新建后端服务，预估开发时间和成本。
    *   如果已有后端服务，评估集成查词功能的复杂度。
    *   **决策点：** 是否继续采用后端缓存方案？如果不可行，我们需要回到纯前端缓存方案（如计划V1），并接受其局限性（插件体积、API密钥暴露风险等）。

2.  **技术选型细化：**
    *   **AI 查词服务：** 详细调研并选择1-2个主要的第三方词典 API。比较其价格、调用限制、数据质量、API 易用性。
    *   **后端技术栈 (如果采用后端方案)：** 确定语言、框架、数据库。
    *   **客户端 NLP 库 (如果探索高级智能高亮)：** 选定1-2个进行原型测试。

3.  **原型开发与验证：**
    *   **智能高亮 - 完整单词扩展：** 优先实现核心的完整单词扩展逻辑。
    *   **查词方案 - 核心流程：**
        *   如果采用后端方案：搭建最小可用的后端 API 端点，能调用一个第三方词典 API 并返回数据。插件端能调用此 API 并展示。
        *   如果采用纯前端方案：实现插件直接调用第三方 API 并展示。
    *   验证关键技术点的可行性。

4.  **迭代开发与测试：**
    *   根据原型验证结果，逐步完善各个功能模块。
    *   进行单元测试和集成测试。
    *   用户体验测试。


---
## 1.1 智能高亮 - 完整单词扩展

### 代码设计思路 (Content Script - `entrypoints/content.ts`)
1.  **事件监听器**:
    *   在 `content.ts` 中，当页面加载完成后，监听 `document` 上的 `mouseup` 事件。这是因为文本选择通常在鼠标按键抬起时完成。
    *   考虑性能，可以使用 `debounce` 函数包装事件处理回调，以避免在用户快速、连续选择时频繁触发扩展逻辑。

2.  **获取当前选区**:
    *   在 `mouseup` 事件回调中，使用 `const selection = window.getSelection();` 获取 `Selection` 对象。
    *   检查 `selection.rangeCount > 0` 并且 `!selection.isCollapsed` (确保有选区且不是一个空点)。

3.  **获取 Range 对象**:
    *   `const range = selection.getRangeAt(0);`

4.  **配置管理与存储 (Configuration Management and Storage)**:
    *   使用 `browser.storage.local` API 存储用户配置和单词标记信息。
    *   **存储项**:
        *   `settings.highlightBaseColor`: 字符串，用户选择的基础高亮颜色名 (e.g., "orange", "blue", "green")。默认为 "orange"。
        *   `wordMarkings`: 对象，键为单词文本，值为该单词的标记次数 (e.g., `{"example": 1, "lucid": 3}`).
    *   配置的修改通常通过扩展的 Popup 或 Options 页面进行。

5.  **网页主题检测 (Webpage Theme Detection)**:
    *   使用 `window.matchMedia('(prefers-color-scheme: dark)')` 查询当前页面的颜色主题。
    *   `const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');`
    *   监听主题变化事件: `prefersDark.addEventListener('change', (e) => { /* update styles if needed */ });` 以便动态调整已存在高亮的样式（可选高级功能）。

6.  **定义单词边界和特殊模式的正则表达式**:
    *   **单词边界 (Word Boundaries):**
        *   `const WORD_BOUNDARY_REGEX = /[\s\p{P}\p{Z}<>]/u;` (空格、Unicode标点、Unicode分隔符、HTML标签括号)。
        *   需要测试并完善以覆盖更多语言的标点，例如中文的 `，。？！；：“”‘’（）《》` 等。可以考虑一个更全面的 Unicode 标点属性 `\p{P}`。
    *   **特殊模式 (Special Patterns to keep together):**
        *   连字符单词: `/\b[\w]+(?:-[\w]+)+\b/` (e.g., "state-of-the-art")
        *   撇号单词: `/\b\w+'\w+\b/` (e.g., "can't", "it's")
        *   数字与单位: `/\b\d+[\w%]+\b/` (e.g., "100kg", "50%")
        *   网址/邮箱: (可以使用更复杂的现有正则表达式库或简化版)
            *   URL: `/\b(?:https?:\/\/|www\.)\S+\b/i`
            *   Email: `/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i`
        *   **合并策略**: 优先匹配特殊模式。如果选区部分或全部在特殊模式内，则扩展到整个特殊模式。

5.  **扩展选区逻辑**:
    *   `expandSelectionToFullWord(range: Range): Range` 函数。
    *   **获取选区文本内容**:
        *   `const selectedText = range.toString().trim();` (用于记录和查询标记次数)
        *   `startNode = range.startContainer`, `endNode = range.endContainer`
        *   `startOffset = range.startOffset`, `endOffset = range.endOffset`
    *   **向前扩展 (调整 `startOffset` 或 `startContainer`)**:
        *   从 `range.startContainer` 的 `startOffset` 位置开始，向前检查字符。
        *   如果当前字符是单词边界字符，则停止。
        *   如果遇到文本节点开头，需要移动到前一个文本节点（`previousSibling` 或 `parentNode.previousSibling` 然后深入到最后一个文本节点）。
        *   需要处理跨越多个HTML元素的情况。
        *   **特殊模式检查**: 在扩展时，检查当前位置是否是特殊模式的一部分，如果是，则将边界扩展到该特殊模式的开始。
    *   **向后扩展 (调整 `endOffset` 或 `endContainer`)**:
        *   从 `range.endContainer` 的 `endOffset` 位置开始，向后检查字符。
        *   如果当前字符是单词边界字符，则停止。
        *   如果遇到文本节点末尾，需要移动到后一个文本节点。
        *   **特殊模式检查**: 同样检查特殊模式。
    *   **边界情况处理**:
        *   选区开始或结束于 HTML 标签内部。
        *   选区跨越多个不同类型的节点。
        *   选区在 `<iframe>` 内 (需要注意，content script 默认只作用于顶层文档，除非配置了 `allFrames: true`)。

6.  **应用高亮样式与更新选区 (Apply Highlight Style and Update Selection)**:
    *   在 `expandSelectionToFullWord` 函数成功扩展选区后，执行以下操作：
    *   **a. 获取单词和标记次数**:
        *   从扩展后的 `range` 对象获取规范化的单词文本 (e.g., `const word = newRange.toString().trim().toLowerCase();`).
        *   从 `browser.storage.local.get(['wordMarkings', 'settings'])` 获取当前单词的标记次数和用户配置。
        *   如果单词首次标记，次数为 1；否则，次数增加 (例如，上限为5次，对应5个颜色梯度)。
        *   将更新后的 `wordMarkings` 保存回 `browser.storage.local.set({ wordMarkings })`。
    *   **b. 计算高亮样式**:
        *   获取用户配置的基础颜色 `baseColor` (e.g., "orange", 来自 `settings.highlightBaseColor`)。
        *   获取当前页面主题 `isDarkMode` (来自第5点的检测)。
        *   根据 `baseColor`, `markCount`, `isDarkMode` 计算 Tailwind CSS 类名。
            *   定义颜色阶梯映射：
                *   `lightModeShades = {1: 500, 2: 600, 3: 700, 4: 800, 5: 900}`
                *   `darkModeShades = {1: 500, 2: 400, 3: 300, 4: 200, 5: 100}` (注意：Tailwind中数字越小颜色越浅)
            *   `shade = isDarkMode ? darkModeShades[markCount] : lightModeShades[markCount];`
            *   `className = \`bg-\${baseColor}-\${shade}\`;` (例如 `bg-orange-600`).
            *   可能还需要一个基础高亮标记类，如 `lucid-highlight`。
    *   **c. 应用高亮**:
        *   **检查是否已高亮**: 如果该范围或单词已被高亮，可能需要先移除旧的高亮或仅更新其 class。这需要为高亮元素设置特定属性或类以便识别。
        *   创建一个 `<span>` 或 `<mark>` 元素 (e.g., `const highlightElement = document.createElement('mark');`).
        *   设置其 class: `highlightElement.className = \`lucid-highlight \${className}\`;`
        *   将单词的标记次数等信息存储到 `highlightElement.dataset` 中，方便后续操作或调试。
        *   使用 `newRange.surroundContents(highlightElement);` 包裹选区。
            *   **注意**: `surroundContents` 对跨多个块级元素或复杂结构的选区可能失败。备选方案：
                1.  使用 CSS Custom Properties 动态设置颜色，而不是完整的 Tailwind 类。
                2.  更复杂的 DOM 操作：遍历选区内的文本节点，分别包裹它们。这需要确保高亮在视觉上是连续的。
                3.  考虑使用成熟的库（如 `rangy`)进行更可靠的 Range 操作和高亮，但会增加依赖。
    *   **d. 更新原始选区对象 (可选，取决于是否希望浏览器保持选择状态)**:
        *   `selection.removeAllRanges();`
        *   `selection.addRange(newRange);` (如果希望在应用自定义高亮后，浏览器自身的选择行为消失，则可以不清空或重新设置一个空选区)。

7.  **Tailwind CSS JIT 注意事项**:
    *   为确保动态生成的 Tailwind 类 (如 `bg-orange-500`, `bg-blue-400`) 被正确编译，需要在 `tailwind.config.js` 中配置：
        *   `content`: 确保包含 `entrypoints/content.ts` 或其他生成这些类的文件。
        *   `safelist`: 或者，将所有可能的颜色和阶梯组合添加到安全列表。例如：
            ```javascript
            // tailwind.config.js
            const colors = ['orange', 'blue', 'green', /* ... other configurable colors */];
            const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900];
            const safelist = [];
            colors.forEach(color => {
              shades.forEach(shade => {
                safelist.push(`bg-${color}-${shade}`);
              });
            });
            module.exports = {
              // ...
              safelist,
              // ...
            };
            ```
    *   如果颜色名 (如 "Origin") 不是 Tailwind 的标准颜色名，需要在 Tailwind 配置中定义该颜色及其所有阶梯。

8.  **辅助函数**:
    *   `isWordBoundaryChar(char: string): boolean`
    *   `isInsideSpecialPattern(text: string, offset: number): { pattern: RegExp, match: RegExpExecArray } | null`
    *   DOM遍历辅助函数 (获取前一个/后一个文本字符，处理节点边界)。

8.  **示例代码结构 (`entrypoints/content.ts` 或相关模块):**
    *   示例代码应扩展，以包含：
        *   与 `browser.storage.local` 交互以获取和设置配置/标记次数。
        *   主题检测逻辑。
        *   动态计算 Tailwind CSS 类名的函数。
        *   修改 `expandSelectionToFullWord` 或新增高亮应用函数，以实现新的高亮逻辑。
    ```typescript
    import { debounce } from 'lodash-es'; // 假设使用 lodash
    // import { storage } from 'wxt/storage'; // WXT 提供的 storage 封装

    // --- Configuration (假设从 storage 加载) ---
    let highlightBaseColor = 'orange'; // Default, should be loaded from storage
    let wordMarkings = {}; // Should be loaded from storage

    const WORD_BOUNDARY_REGEX = /[\s\p{P}\p{Z}<>"'“”‘’「」『』.,;:?!()[\]{}]/u;
    const SPECIAL_PATTERNS = [
        /\b[\w]+(?:-[\w]+)+\b/u, // state-of-the-art
        /\b\w+'\w+\b/u,         // can't
        /\b\d+[\w%]+\b/u,       // 100kg
        /\b(?:https?:\/\/|www\.)\S+\b/iu,
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
    ];

    // --- Theme Detection ---
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    let isDarkMode = prefersDark.matches;
    prefersDark.addEventListener('change', (e) => {
        isDarkMode = e.matches;
        // TODO: Optionally re-style existing highlights if theme changes
    });

    // --- Storage Interaction (Example stubs) ---
    async function loadConfiguration() {
        // Using browser.storage.local directly or wxt/storage
        const result = await browser.storage.local.get(['settings', 'wordMarkings']);
        if (result.settings && result.settings.highlightBaseColor) {
            highlightBaseColor = result.settings.highlightBaseColor;
        }
        if (result.wordMarkings) {
            wordMarkings = result.wordMarkings;
        }
    }

    async function saveWordMarking(word, count) {
        wordMarkings[word] = count;
        await browser.storage.local.set({ wordMarkings });
    }
    
    // Load config on script start
    loadConfiguration();

    // --- Highlighting Logic ---
    function getHighlightClassName(baseColor, markCount, isDark) {
        const lightModeShades = {1: 500, 2: 600, 3: 700, 4: 800, 5: 900};
        const darkModeShades = {1: 500, 2: 400, 3: 300, 4: 200, 5: 100};
        const count = Math.min(Math.max(1, markCount), 5); // Clamp count between 1 and 5

        const shade = isDark ? darkModeShades[count] : lightModeShades[count];
        return `lucid-highlight bg-${baseColor}-${shade}`; // Assumes 'lucid-highlight' is a base class
    }


    function isWordBoundaryChar(char: string): boolean {
        if (!char) return true; // 空字符视为边界
        return WORD_BOUNDARY_REGEX.test(char);
    }

    function getCharAtIndex(node: Node, offset: number): string | null {
        if (node.nodeType === Node.TEXT_NODE && node.textContent && offset < node.textContent.length) {
            return node.textContent[offset];
        }
        return null;
    }
    
    function getTextContent(node: Node): string {
        return node.textContent || "";
    }

    function expandSelectionToFullWord() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return;
        }

        const range = selection.getRangeAt(0).cloneRange(); // 克隆以避免修改原始选区对象

        let startNode = range.startContainer;
        let startOffset = range.startOffset;
        let endNode = range.endContainer;
        let endOffset = range.endOffset;

                // Helper to check if current selection is part of a special pattern
                // This is a simplified check, a more robust one would check around the selection
                function checkSpecialPatterns(node: Node, offset: number, direction: 'backward' | 'forward'): { newOffset: number, patternMatched: boolean } {
                    const text = getTextContent(node);
                    for (const pattern of SPECIAL_PATTERNS) {
                        // Reset lastIndex for global regexes
                        pattern.lastIndex = 0;
                        let match;
                        while((match = pattern.exec(text)) !== null) {
                            const matchStart = match.index;
                            const matchEnd = match.index + match[0].length;
                            if (direction === 'backward' && offset > matchStart && offset <= matchEnd) {
                                return { newOffset: matchStart, patternMatched: true };
                            }
                            if (direction === 'forward' && offset >= matchStart && offset < matchEnd) {
                                return { newOffset: matchEnd, patternMatched: true };
                            }
                        }
                    }
                    return { newOffset: offset, patternMatched: false };
                }

                // Expand backward
                // First, check if the start of selection is within a special pattern
                let specialPatternCheck = checkSpecialPatterns(startNode, startOffset, 'backward');
                if (specialPatternCheck.patternMatched) {
                    startOffset = specialPatternCheck.newOffset;
                } else {
                    while (startOffset > 0) {
                        const char = getTextContent(startNode)[startOffset - 1];
                        if (isWordBoundaryChar(char)) break;
                        startOffset--;
                    }
                    // TODO: Handle moving to previous sibling if startOffset reaches 0
                }
                range.setStart(startNode, startOffset);

                // Expand forward
                // First, check if the end of selection is within a special pattern
                specialPatternCheck = checkSpecialPatterns(endNode, endOffset, 'forward');
                if (specialPatternCheck.patternMatched) {
                    endOffset = specialPatternCheck.newOffset;
                } else {
                    const textLength = getTextContent(endNode).length;
                    while (endOffset < textLength) {
                        const char = getTextContent(endNode)[endOffset];
                        if (isWordBoundaryChar(char)) break;
                        endOffset++;
                    }
                    // TODO: Handle moving to next sibling if endOffset reaches textLength
                }
                range.setEnd(endNode, endOffset);

                // --- Apply Highlight ---
                const wordToMark = range.toString().trim().toLowerCase();
                if (wordToMark) {
                    let currentMarkCount = (wordMarkings[wordToMark] || 0) + 1;
                    currentMarkCount = Math.min(currentMarkCount, 5); // Cap at 5
                    saveWordMarking(wordToMark, currentMarkCount); // Async, but can proceed

                    const className = getHighlightClassName(highlightBaseColor, currentMarkCount, isDarkMode);
                    
                    // Remove previous highlight if any for this exact range or word instance
                    // This part needs careful implementation to avoid issues.
                    // For simplicity, this example assumes new highlights don't overlap perfectly with old ones
                    // or that we are okay with multiple wrappers if selection is done repeatedly on same text.
                    // A more robust solution would be to find and update/remove existing highlight spans.

                    const highlightElement = document.createElement('mark');
                    highlightElement.className = className;
                    highlightElement.dataset.word = wordToMark;
                    highlightElement.dataset.markCount = String(currentMarkCount);

                    try {
                        // Note: If range spans multiple block elements, surroundContents will fail.
                        // A more robust highlighting mechanism might be needed for complex selections.
                        range.surroundContents(highlightElement);
                        selection.removeAllRanges(); // Clear selection after highlighting
                    } catch (e) {
                        console.error("Lucid: Error surrounding contents", e);
                        // Fallback or error handling - perhaps revert selection or notify user
                        // For now, just re-add the original range if surroundContents fails
                        selection.removeAllRanges();
                        selection.addRange(range.cloneRange()); // Keep original selection
                    }
                } else {
                     // If no text to mark, just update selection if needed
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }

            const debouncedExpandSelection = debounce(expandSelectionToFullWord, 250); // Adjusted debounce time

            // Attach listener
    // Ensure this runs after the document is ready, or for dynamic content, use event delegation if appropriate.
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        document.addEventListener('mouseup', debouncedExpandSelection);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.addEventListener('mouseup', debouncedExpandSelection);
        });
    }

    // TODO: Add logic for cleaning up the event listener when the content script is unloaded,
    // especially in SPAs or if the extension can be disabled/enabled dynamically.
    // WXT might provide lifecycle hooks for this.
    ```
9.  **考虑 React/UI 交互 (如果需要)**:
    *   当前设计主要集中在 Content Script 直接操作 DOM。
    *   如果需要在 Popup UI (React) 或其他 React 组件中反映高亮状态或触发查词，可以通过 `browser.runtime.sendMessage` 从 Content Script 发送消息到 Background Script，再由 Background Script 转发到 Popup，或者 Popup 直接向 Content Script 发送消息请求当前高亮文本。
