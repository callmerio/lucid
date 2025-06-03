# Tooltip Mock Data

这个目录包含用于tooltip组件的mock JSON数据文件。

## 文件说明

### `tooltip-mock-data.json`

基于 `docs/api/api-response-examples.md` 中的API响应格式创建的**通用mock数据文件**。

**重要特性**：无论查询任何单词，都返回同样的固定数据结构，用作tooltip组件的数据源。

## 数据结构

数据文件采用标准API响应格式，包含完整的数据结构：

```json
{
  "words": [...],           // 主要词汇数据
  "wordCount": 1,           // 词汇数量
  "wordList": [...],        // 词汇列表
  "wordRelationships": [...], // 词形关系信息
  "queryMetadata": {...},   // 查询元数据
  "relatedSuggestions": [...] // 相关建议
}
```

## Mock数据内容

固定返回 **escalade** 的完整词汇信息：
- **词性**：名词/动词
- **中文释义**：攀登
- **音标**：US `/ˌɛskəˈleɪd/`，UK `/ˈɛskəleɪd/`
- **词形变化**：包含原型、第三人称单数、过去式、过去分词、现在分词

## 与tooltip组件的兼容性

数据结构与 `toolpopup.html` 中的tooltip组件完全兼容，包含以下必需字段：

- `word`: 单词本身（用于音节分割显示）
- `phonetic`: 音标信息（US和UK）
- `explain`: 词性和定义数组
  - `pos`: 词性
  - `definitions`: 定义数组
    - `definition`: 英文定义
    - `chinese`: 中文解释
    - `chinese_short`: 中文简短解释
- `wordFormats`: 词形变化信息

## 使用方法

### 基本用法

```javascript
// 加载mock数据 - 无论查询什么单词都返回相同数据
fetch('./mock-data/tooltip-mock-data.json')
  .then(response => response.json())
  .then(data => {
    // 直接使用返回的数据，无需根据单词查找
    updateTooltip(data);
  });
```

### 模拟API调用

```javascript
// 模拟API查询函数
async function mockWordQuery(word) {
  // 无论传入什么单词，都返回相同的mock数据
  const response = await fetch('./mock-data/tooltip-mock-data.json');
  const data = await response.json();

  console.log(`查询单词: ${word}`);
  console.log('返回固定mock数据:', data);

  return data;
}

// 使用示例
mockWordQuery('apple').then(data => updateTooltip(data));
mockWordQuery('computer').then(data => updateTooltip(data));
mockWordQuery('任何单词').then(data => updateTooltip(data));
// 以上所有查询都会返回相同的escalade数据
```

### 与现有tooltip组件集成

```javascript
// 直接替换现有的API调用
function queryWord(word) {
  // 原来的API调用：
  // return fetch(`/api/word/${word}`).then(r => r.json());

  // 现在使用mock数据：
  return fetch('./mock-data/tooltip-mock-data.json').then(r => r.json());
}
```

## 使用场景

1. **开发阶段**：在API未完成时，使用固定数据测试tooltip组件功能
2. **演示展示**：确保演示时tooltip始终显示完整、美观的数据
3. **UI测试**：测试tooltip组件在标准数据格式下的显示效果
4. **离线开发**：无需网络连接即可开发和测试tooltip功能

## 扩展说明

如需修改mock数据内容，直接编辑 `tooltip-mock-data.json` 文件中的数据即可。所有查询都会返回修改后的数据。
