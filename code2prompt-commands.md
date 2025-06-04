# Code2Prompt 修正命令集合

## 🔧 修正后的基础命令

### 1. 完整项目文档（修正版）
```bash
code2prompt . \
  --include="*.ts,*.tsx,*.js,*.jsx,*.css,*.md,*.json" \
  --exclude="node_modules/**,dist/**,.wxt/**,*.log,pnpm-lock.yaml,**/*.test.ts" \
  --output-file=lucid-full.md \
  --line-numbers \
  --tokens=format \
  --full-directory-tree
```

### 2. 核心源码文档（修正版）
```bash
code2prompt . \
  --include="src/**,entrypoints/**,utils/**" \
  --exclude="**/*.test.ts,**/*.spec.ts" \
  --output-file=lucid-source.md \
  --line-numbers \
  --tokens=format
```

### 3. 配置文件文档
```bash
code2prompt . \
  --include="package.json,tsconfig.json,wxt.config.ts,vitest.config.ts,eslint.config.js" \
  --output-file=lucid-config.md \
  --tokens=format
```

### 4. JSON 格式输出（修正版）
```bash
code2prompt . \
  --include="src/**,utils/**,entrypoints/**" \
  --exclude="**/*.test.ts" \
  --output-format=json \
  --output-file=lucid-source.json \
  --tokens=format
```

## 🚀 简化版本（推荐新手使用）

### 基础转换（遵循 .gitignore）
```bash
# 最简单的方式，自动遵循 .gitignore
code2prompt . --output-file=lucid-basic.md --tokens=format

# 添加行号
code2prompt . --output-file=lucid-with-lines.md --line-numbers --tokens=format
```

### 只转换源码
```bash
# 只包含源码目录
code2prompt src/ --output-file=lucid-src-only.md --tokens=format

# 包含多个核心目录
code2prompt . \
  --include="src/**,entrypoints/**,utils/**" \
  --output-file=lucid-core.md \
  --tokens=format
```

## 📊 Token 格式说明

`--tokens` 参数支持两种格式：
- `--tokens=format`：人类可读格式（推荐）
- `--tokens=raw`：机器可读格式

## ⚠️ 常见错误修正

1. **错误**：`--tokens` 缺少值
   **修正**：使用 `--tokens=format` 或 `--tokens=raw`

2. **错误**：输出文件过大
   **修正**：使用更严格的 `--exclude` 规则

3. **错误**：包含敏感信息
   **修正**：排除配置文件或使用 `--exclude="**/.*,**/*.env"`

## 🎯 推荐工作流

1. **测试阶段**：先用简化命令测试
```bash
code2prompt src/ --output-file=test.md --tokens=format
```

2. **生产阶段**：使用完整的过滤规则
```bash
code2prompt . \
  --include="src/**,entrypoints/**,utils/**,docs/**,*.md" \
  --exclude="node_modules/**,**/*.test.ts,dist/**" \
  --output-file=production.md \
  --line-numbers \
  --tokens=format
```

3. **分析阶段**：生成 JSON 格式便于程序处理
```bash
code2prompt . \
  --include="src/**" \
  --output-format=json \
  --output-file=analysis.json \
  --tokens=format
```
