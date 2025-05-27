下面给出一份「Next .js-15 单仓库 = 官网 + 用户管理 + 查词 API」的落地方案。你可以先把 API 开发完，再逐步接入前端页面，而无需额外拆仓。全文按 目录结构 → API 编写方式 → 数据层 → 缓存层 → Docker 部署 → 逐步演进 展开。

⸻

1. 项目目录（最小可运行骨架）

my-dict-app/
├─ prisma/
│ └─ schema.prisma
├─ src/
│ ├─ app/
│ │ ├─ api/
│ │ │ ├─ auth/[...nextauth]/route.ts # (可选) NextAuth
│ │ │ ├─ dictionary/
│ │ │ │ ├─ [lang]/
│ │ │ │ │ └─ [word]/route.ts # GET/PATCH 等
│ │ │ └─ stats/[word]/route.ts # POST: 记录次数
│ │ ├─ layout.tsx / page.tsx # 官网/仪表盘
│ │ └─ (auth)/... # 受保护页面
│ └─ lib/
│ ├─ prisma.ts # 单例
│ ├─ redis.ts # ioredis 客户端
│ ├─ providers/ # 第三方词典适配层
│ └─ cache.ts # TTL/LRU 工具函数
├─ .env (.env.development)
├─ next.config.js
├─ Dockerfile
└─ package.json

为什么用 Route Handlers 而非 pages/api

Next .js 15 的 Route Handlers（app/api/.../route.ts）即“新一代 API Routes”，原生支持 Web Request/Response 对象，享受 App Router 的文件系统路由、边缘运行时与渐进式静态缓存等特性，可直接返回 Response  ￼。

⸻

2. API 实现要点

// src/app/api/dictionary/[lang]/[word]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { lookupWord } from '@/lib/lookup';

export async function GET(
req: NextRequest,
{ params }: { params: { lang: string; word: string } },
) {
const force = req.nextUrl.searchParams.get('fresh') === 'true';
const result = await lookupWord(params.word, params.lang, force);
if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json(result, {
// 内部缓存 24 h，前端可复用
headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
});
}

    •	长耗时第三方调用：仍跑在 Node Runtime；若想边缘部署，在文件顶部加 export const runtime = 'edge'，注意第三方 SDK 是否兼容 Edge Worker。
    •	写操作（计数、用户词汇本）可：
    •	用 Server Actions（"use server"）直接在 React 组件里调用，省一次 HTTP 跳转；
    •	或保持 REST 风格，继续用 POST /api/stats:{word}。二者可并存。  ￼ ￼

⸻

3. 数据层：Prisma + PostgreSQL

prisma/schema.prisma

model User {
id Int @id @default(autoincrement())
email String @unique
queries Query[]
vocabularies Vocabulary[]
}

model Query {
id Int @id @default(autoincrement())
word String
lang String @default("en")
count Int @default(1)
user User? @relation(fields: [userId], references: [id])
userId Int?
@@unique([word, lang, userId])
}

model Vocabulary {
id Int @id @default(autoincrement())
word String
lang String @default("en")
user User @relation(fields: [userId], references: [id])
userId Int
}

    •	查词次数：Query.count 自增。
    •	生词本：用户自行添加进 Vocabulary 表。
    •	标准化词典数据可放 Redis 或 WordInfo 表 (jsonb)。查词时先查缓存，再查 DB，如上蓝本。

⸻

4. 缓存策略：Redis + fetch() 内建缓存

// lib/lookup.ts
import { redis } from '@/lib/redis';
import { db } from '@/lib/prisma';
import { fetchFromProvider } from '@/lib/providers';

export async function lookupWord(word: string, lang: string, force = false) {
const key = `${lang}:${word}`;

if (!force) {
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
}

// 查询持久库
const row = await db.wordInfo.findUnique({ where: { key } });
if (row && Date.now() - row.updatedAt.getTime() < 24 _ 3600 _ 1e3) {
await redis.set(key, JSON.stringify(row.data), 'EX', 86400);
return row.data;
}

// 第三方词典
const fresh = await fetchFromProvider(word, lang);
await db.wordInfo.upsert({ ... });
redis.set(key, JSON.stringify(fresh), 'EX', 86400);
return fresh;
}

⸻

5. Docker 多阶段镜像

# ---------- builder ----------

FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME=/root/.pnpm
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
RUN pnpm build # next build && prisma generate

# ---------- runner ----------

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]

next build 会自动生成 .next/standalone，包含最小运行时，镜像最终 < 180 MB。

⸻

6. 环境变量与安全

# .env

DATABASE_URL="postgresql://user:pass@db:5432/dictionary"
REDIS_URL="redis://cache:6379"
DICTIONARY_API_KEY="..."
JWT_SECRET="..."
NEXTAUTH_SECRET="..." # 若用 NextAuth

    •	在 Vercel：使用环境变量仪表盘。
    •	在 Docker Compose：用 secrets: 或 .env。

⸻

7. 逐步演进路线

阶段 目标 重点
MVP 路由 /api/dictionary/{word} / /stats，Prisma + Postgres，本地 Docker 跑通 数据模型、缓存、第三方 Provider
📈 接入 NextAuth.js 或自研 JWT，支持「个人生词本」 中间件鉴权、关系表
🌍 把官网首页、仪表盘页面放进 app/，用 React Server Components 拉数据 Server Actions、渐进式渲染
⚡️ 热词预取 Cron、Redis LRU、监控 Prometheus observability
☁️ 部署到 Vercel / Render / 自管 K8s，配备镜像 CI GitHub Actions、自动推送

⸻

小结
• Next.js 既当 API server 又当官网，在项目早期最省心；未来若 QPS 很高，可把 /api 路由拆去独立 Fastify 服务，域名保持向后兼容。
• 遵循 Route Handlers = 纯 REST，Server Actions = 组件内 mutate 的二分法，既现代又不冲突。
• 使用 Prisma + Redis + 多阶段 Dockerfile，既结构化又轻量，符合“先后端、后官网”迭代顺序。

需要 完整示例仓库、CI/CD yaml 或 监控仪表盘模板？告诉我，我再帮你补齐！
