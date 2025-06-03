# API响应格式示例

## 1. 基础查询响应（查询"cat"）

```json
{
  "words": [
    {
      "word": "cat",
      "explain": [
        {
          "pos": "noun",
          "definitions": [
            {
              "definition": "A small domesticated carnivorous mammal",
              "chinese": "猫，一种小型家养食肉哺乳动物",
              "chinese_short": "猫"
            }
          ]
        }
      ],
      "wordFormats": [
        {
          "name": "原型",
          "form": "cat"
        },
        {
          "name": "复数",
          "form": "cats"
        }
      ],
      "phonetic": {
        "us": "/kæt/",
        "uk": "/kæt/"
      }
    }
  ],
  "wordCount": 1,
  "wordList": ["cat"],
  "wordRelationships": [
    {
      "baseForm": "cat",
      "baseFormId": 123,
      "allForms": [
        {
          "id": 123,
          "name": "原型",
          "form": "cat",
          "isMainForm": true
        },
        {
          "id": 124,
          "name": "复数",
          "form": "cats",
          "isMainForm": false
        }
      ],
      "totalFormsCount": 2
    }
  ],
  "queryMetadata": {
    "searchTerm": "cat",
    "matchedForm": "cat",
    "searchStrategy": "exact_vocabulary",
    "isBaseFormQuery": true,
    "processingTimeMs": 45
  },
  "relatedSuggestions": ["kitten", "feline", "pet"]
}
```

## 2. 派生形式查询响应（查询"cats"）

```json
{
  "words": [
    {
      "word": "cat",
      "explain": [
        {
          "pos": "noun",
          "definitions": [
            {
              "definition": "A small domesticated carnivorous mammal",
              "chinese": "猫，一种小型家养食肉哺乳动物",
              "chinese_short": "猫"
            }
          ]
        }
      ],
      "wordFormats": [
        {
          "name": "原型",
          "form": "cat"
        },
        {
          "name": "复数",
          "form": "cats"
        }
      ],
      "phonetic": {
        "us": "/kæt/",
        "uk": "/kæt/"
      }
    }
  ],
  "wordCount": 1,
  "wordList": ["cat"],
  "wordRelationships": [
    {
      "baseForm": "cat",
      "baseFormId": 123,
      "allForms": [
        {
          "id": 123,
          "name": "原型",
          "form": "cat",
          "isMainForm": true
        },
        {
          "id": 124,
          "name": "复数",
          "form": "cats",
          "isMainForm": false
        }
      ],
      "totalFormsCount": 2
    }
  ],
  "queryMetadata": {
    "searchTerm": "cats",
    "matchedForm": "cats",
    "searchStrategy": "derived_wordformat",
    "isBaseFormQuery": false,
    "processingTimeMs": 67
  },
  "relatedSuggestions": ["cat", "kitten", "feline"]
}
```

## 3. 复杂动词查询响应（查询"running"）

```json
{
  "words": [
    {
      "word": "run",
      "explain": [
        {
          "pos": "verb",
          "definitions": [
            {
              "definition": "Move at a speed faster than a walk",
              "chinese": "跑，以比走路更快的速度移动",
              "chinese_short": "跑"
            }
          ]
        }
      ],
      "wordFormats": [
        {
          "name": "原型",
          "form": "run"
        },
        {
          "name": "第三人称单数",
          "form": "runs"
        },
        {
          "name": "过去式",
          "form": "ran"
        },
        {
          "name": "过去分词",
          "form": "run"
        },
        {
          "name": "现在分词",
          "form": "running"
        }
      ],
      "phonetic": {
        "us": "/rʌn/",
        "uk": "/rʌn/"
      }
    }
  ],
  "wordCount": 1,
  "wordList": ["run"],
  "wordRelationships": [
    {
      "baseForm": "run",
      "baseFormId": 456,
      "allForms": [
        {
          "id": 456,
          "name": "原型",
          "form": "run",
          "isMainForm": true
        },
        {
          "id": 457,
          "name": "第三人称单数",
          "form": "runs",
          "isMainForm": false
        },
        {
          "id": 458,
          "name": "过去式",
          "form": "ran",
          "isMainForm": false
        },
        {
          "id": 459,
          "name": "过去分词",
          "form": "run",
          "isMainForm": false
        },
        {
          "id": 460,
          "name": "现在分词",
          "form": "running",
          "isMainForm": false
        }
      ],
      "totalFormsCount": 5
    }
  ],
  "queryMetadata": {
    "searchTerm": "running",
    "matchedForm": "running",
    "searchStrategy": "derived_wordformat",
    "isBaseFormQuery": false,
    "processingTimeMs": 89
  },
  "relatedSuggestions": ["run", "jog", "sprint", "race"]
}
```

## 4. 未找到词汇的响应

```json
{
  "words": [],
  "illegalWords": ["xyz123"],
  "wordCount": 0,
  "wordList": [],
  "queryMetadata": {
    "searchTerm": "xyz123",
    "matchedForm": "",
    "searchStrategy": "not_found",
    "isBaseFormQuery": false,
    "processingTimeMs": 23
  },
  "relatedSuggestions": []
}
```

## 5. 响应格式说明

### 核心字段

- `words`: 主要词汇数据，保持与现有格式兼容
- `wordCount` & `wordList`: 统计信息
- `wordRelationships`: **新增**，词形关系信息
- `queryMetadata`: **新增**，查询元数据
- `relatedSuggestions`: **新增**，相关建议

### 查询策略类型

- `exact_vocabulary`: 直接匹配vocabulary表
- `main_wordformat`: 通过主WordFormat匹配
- `derived_wordformat`: 通过派生WordFormat匹配
- `not_found`: 未找到匹配

### 前端处理建议

1. 优先显示`words[0]`的主要信息
2. 使用`wordRelationships`展示词形变化
3. 根据`queryMetadata.searchStrategy`提供不同的UI提示
4. 利用`relatedSuggestions`提供搜索建议
