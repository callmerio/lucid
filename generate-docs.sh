#!/bin/bash

echo "🚀 开始生成 Lucid 扩展项目文档..."

# 创建输出目录
mkdir -p docs-output

# 1. 生成完整项目文档
echo "📄 生成完整项目文档..."
code2prompt . \
  --include="*.ts,*.tsx,*.js,*.jsx,*.css,*.md,*.json" \
  --exclude="node_modules/**,dist/**,.wxt/**,*.log,pnpm-lock.yaml,**/*.test.ts" \
  --output-file=docs-output/lucid-full.md \
  --line-numbers \
  --tokens=format \
  --full-directory-tree

# 2. 生成核心源码文档
echo "💻 生成核心源码文档..."
code2prompt . \
  --include="src/**,entrypoints/**,utils/**" \
  --exclude="**/*.test.ts,**/*.spec.ts" \
  --output-file=docs-output/lucid-source.md \
  --line-numbers \
  --tokens=format

# 3. 生成配置文档
echo "⚙️ 生成配置文档..."
code2prompt . \
  --include="package.json,tsconfig.json,wxt.config.ts,vitest.config.ts,eslint.config.js,web-ext.config.ts" \
  --output-file=docs-output/lucid-config.md

# 4. 生成文档集合
echo "📚 生成文档集合..."
code2prompt docs/ \
  --include="*.md" \
  --output-file=docs-output/lucid-docs.md

# 5. 生成 JSON 格式（便于程序处理）
echo "🔧 生成 JSON 格式..."
code2prompt . \
  --include="src/**,utils/**,entrypoints/**" \
  --exclude="**/*.test.ts" \
  --output-format=json \
  --output-file=docs-output/lucid-source.json \
  --tokens=format

echo "✅ 文档生成完成！输出目录：docs-output/"
echo "📊 文件列表："
ls -la docs-output/
