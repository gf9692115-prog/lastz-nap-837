# NAP WATCH // Last Z Server 837

837 服 NAP 违规自动检测站。上传赏金任务记录、矿区争夺或贸易货车战报截图，DeepSeek `deepseek-flash` 负责视觉提取，服务端规则引擎负责最终判定，违规记录自动计入联盟排行榜并公开证据截图。

> 当前阶段只支持 3 类战报，只对 **837 本服玩家** 的进攻行为计分。外服玩家（如 `#838`）的跨服行为合法，仅留档、不计分。

## 技术栈

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS 3.4
- Supabase Postgres + Storage
- DeepSeek `deepseek-flash` 多模态视觉（OpenAI 兼容 Chat Completions + JSON Output）
- Vitest 规则单元测试

## 判定规则（服务端硬编码，绝不交给 AI 自行定性）

| 类型 | 界面识别 | 违规方唯一来源 | 计分条件 |
| --- | --- | --- | --- |
| `BOUNTY_PLUNDER` | 任务记录 / `Görev Kaydı` / Mission Record 列表卡片，无 VS | 卡片上的掠夺者 `bountyOffender` | 该玩家属于 837 |
| `RESOURCE_TILE` | 矿区争夺 / Resource Tile / Mine 的左右 VS 战报 | **右侧**玩家 `rightPlayer` | 右侧玩家属于 837 |
| `TRUCK_PLUNDER` | 贸易货车 / Trade Truck 的左右 VS 战报 | **右侧**玩家 `rightPlayer` | 右侧玩家属于 837 |

关键约束：

1. **左侧上传者永远是受害者，永不作为违规方。** 代码在 VS 类型中只读取 `rightPlayer`；即使左侧玩家有更高战力、胜利或 837 联盟，也不会被计入。
2. **赏金类型只读卡片里的掠夺者**，不会读 `leftPlayer` / `rightPlayer`。
3. 服务器编号来自违规方名字前的 `#XXX` 前缀；无前缀、或明确 `#837`，判定为 837 本服。
4. 若原始名字完全没有 `#外服号`，但模型声称看到了外服号，系统仅在“外服”方向接受该兜底。这样只会少计，不会把外服玩家误算成 837。
5. 战报时间缺少年份时补当前 UTC 年份，秒数截断到分钟，统一按 `UTC` 存储。示例：`11-20 13:22` → `2026-11-20T13:22:00.000Z`。
6. 同一 `(report_type, offending_alliance, offending_player, battle_timestamp)` 只允许一条记录，重复上传返回“该战报已记录过，请勿重复提交”。
7. 未识别到联盟标签时，记录写入 `UNKNOWN`，并显示为“未知联盟”，不会丢弃违规证据。

**一张截图按一条战报处理**。如果赏金记录中同时出现多张卡片，请在截图中保留最上方、最完整的一条，或先裁剪；后续阶段可扩展为一次提取多条记录。

## 目录结构

```text
.
├─ app/
│  ├─ api/upload/route.ts       # 上传、DeepSeek 解析、规则判定、入库、去重
│  ├─ globals.css               # 深色电竞主题与动效
│  ├─ icon.svg                  # favicon
│  ├─ layout.tsx                # 元数据、viewport、基础布局
│  └─ page.tsx                  # 服务端页面，读取排行榜与证据流
├─ components/
│  ├─ dashboard.tsx             # Hero、数据状态、整体页面结构
│  ├─ upload-section.tsx        # 上传区 + 规则说明
│  ├─ upload-zone.tsx           # 拖拽/相册、压缩、上传阶段、结果卡片
│  ├─ result-card.tsx           # 违规/外服/重复/失败判定反馈
│  ├─ leaderboard.tsx           # 联盟违规排行榜
│  ├─ report-feed.tsx           # 最新违规战报公示流
│  ├─ evidence-modal.tsx        # 点击查看原图与判定说明
│  ├─ site-header.tsx
│  ├─ section-heading.tsx
│  └─ logo.tsx
├─ lib/
│  ├─ client/prepare-image.ts   # 浏览器端大图压缩（Canvas）
│  ├─ server/image-file.ts      # 服务端魔法字节校验
│  ├─ supabase/admin.ts         # 仅服务端的 service-role Supabase client
│  ├─ deepseek.ts               # DeepSeek Flash 视觉提取 + System Prompt + JSON 校验
│  ├─ deepseek.test.ts          # 请求格式、JSON 解析、错误处理的适配器测试
│  ├─ violation-rules.ts        # 纯函数：玩家/服务器/时间归一化与 NAP 判定
│  ├─ violation-rules.test.ts   # 16 条规则测试（含防算反、外服、时间、特殊字符）
│  ├─ dashboard-data.ts         # 排行榜/证据流查询
│  ├─ constants.ts
│  ├─ format.ts
│  └─ types.ts
├─ supabase/schema.sql          # 表、联合唯一索引、视图、RLS、Storage bucket
├─ .github/workflows/ci.yml     # GitHub Actions：测试 + 类型检查 + 生产构建
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
├─ pnpm-workspace.yaml          # pnpm 11 构建脚本白名单
└─ README.md
```

## 快速开始

### 1. 创建 Supabase 项目并执行 SQL

1. 在 [Supabase](https://supabase.com/) 新建项目。
2. 打开 **SQL Editor**，完整执行 [`supabase/schema.sql`](supabase/schema.sql)。如果之前运行过旧版 schema，也要重跑一次，以更新 bucket 的 MIME 白名单。
3. 确认 **Storage** 中已出现公开 bucket `reports`。
4. 在 **Project Settings → API** 取得 Project URL 和 `service_role` key。
5. 在 [DeepSeek 开放平台](https://platform.deepseek.com/) 创建 API key；视觉识别使用支持图像输入的 `deepseek-flash`。

`schema.sql` 已完成：

- `violations` 表和 `report_type` enum
- 联合唯一索引（分钟级去重）
- `alliance_leaderboard` 视图（仅统计 `is_violation = true`，次数降序）
- RLS：匿名只能读取已确认违规；外服 rejected 记录保留在表中但不可公开读
- `reports` bucket 与公开读取策略（上传只能由服务端 service role 执行）

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | **只放服务端**，绝不能加 `NEXT_PUBLIC_` 前缀 |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek 开放平台 API key |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-flash`，必须使用支持视觉的模型 |
| `SUPABASE_REPORTS_BUCKET` | 否 | 默认 `reports` |
| `NEXT_PUBLIC_SITE_URL` | 否 | 生产域名，用于 metadata |

### 3. 安装与运行

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。手机在同一局域网内用电脑 IP 访问即可测试拖拽/相册上传。

### 4. 验证

```bash
pnpm test        # 21 个测试：DeepSeek 适配器 + NAP 规则
pnpm typecheck   # TypeScript
pnpm build       # 生产构建
```

DeepSeek 适配器测试会 mock 网络响应，验证请求确实使用 `deepseek-flash`、多模态 `image_url`、JSON Output，并验证 HEIC 拒绝、空/非法 JSON 和上游 HTTP 错误的处理；不需要真实 API key。真实识别请在配置 key 后用几张战报截图跑通一次。

## 上传接口

`POST /api/upload`，`multipart/form-data`，字段名 `image`。

成功（新建本服违规，HTTP 201）：

```json
{
  "ok": true,
  "code": "VIOLATION_RECORDED",
  "message": "违规已记录：计入 [RAON] 1 次违规",
  "record": {
    "reportType": "BOUNTY_PLUNDER",
    "offendingAlliance": "RAON",
    "offendingPlayer": "[RAON]TrippleHopped",
    "offendingServer": "837",
    "victimPlayer": null,
    "battleTimestamp": "2026-11-20T13:22:00.000Z",
    "isViolation": true,
    "reason": "...",
    "imageUrl": "https://..."
  }
}
```

常见状态：

| HTTP | code | 说明 |
| --- | --- | --- |
| 201 | `VIOLATION_RECORDED` | 本服违规，已入库；前端随后刷新榜单 |
| 201 | `EXTERNAL_SERVER` | 外服行为，已入库 `is_violation=false`，不计分 |
| 409 | `DUPLICATE` | 联合唯一索引冲突，重复战报 |
| 422 | `UNSUPPORTED_REPORT` | 不是 3 类战报之一 |
| 422 | `INVALID_REPORT` | 关键字段/时间不清晰，拒绝猜测 |
| 400/413/415 | `INVALID_IMAGE` | 文件为空、过大或格式不支持 |
| 502 | `AI_ERROR` / `STORAGE_ERROR` | 上游 AI 或 Storage 失败 |
| 503 | `CONFIGURATION_ERROR` | 环境变量缺失 |
| 500 | `DATABASE_ERROR` / `INTERNAL_ERROR` | 数据库或未知错误 |

服务端只信任图片魔法字节，不信任文件扩展名或浏览器 MIME。DeepSeek 视觉接受的最终格式为 JPG / PNG / WebP，单次请求上限 8MB；前端会把大于 3.5MB 的原图压到最长边 2200px 的 JPEG，并尝试把手机 HEIC/HEIF 转成 JPEG 后再上传。浏览器无法解码 HEIC 时会提示先在相册转存 JPG。

## 设计取舍与已知边界

- **无登录/无频率限制**：当前是社区开放上传。公开部署前强烈建议加登录口令、Cloudflare Turnstile 或按 IP/用户限流，否则 AI 费用和 Storage 可能被滥用。当前只靠图片校验、单张上限和数据库去重做基础防护。
- **AI 仍可能误读**：规则层会拒绝低置信度结果，但所有自动判定仍建议由联盟管理抽查。发现误判时，直接在 Supabase 中删除对应 `violations` 行即可（同时可从 Storage 删除对应对象）。
- **时间为游戏界面显示值**：Last Z 截图不带时区，本实现按业务要求将其视为 UTC 并标注 `UTC`。如果你们确认游戏时区为其他时区，需要同步调整 `normalizeBattleTimestamp` 与展示逻辑。
- **分钟级去重**：同一玩家、同一联盟、同一类型在同一分钟内的两条不同战报会被唯一索引判为重复，这是当前产品要求的去重粒度。唯一索引未包含 `offending_server`，也与需求指定的字段一致。
- **外服记录可见性**：外服 `is_violation=false` 行不进入榜单和证据流；RLS 禁止匿名通过 Data API 直接读取该表的外服行，service role 仍可用于后台审计。由于证据 bucket 是公开的，外部截图对象本身仅在知道随机对象路径时可被访问，不要把它当作隐私存储。
- **公开证据**：`reports` bucket 的公开读取是“证据可点击预览”的前提。若后续需要私密证据，应改为短期 signed URL，并同步调整前端。
- **一次只处理一张截图、一条战报**：多卡片列表请先裁剪，详见上文规则说明。
- **DeepSeek 输出约束**：DeepSeek JSON Output 只保证返回合法 JSON，不是 OpenAI/Google 式 JSON Schema。代码把完整字段契约写入 System Prompt，并用 `isExtractionLike` 和 `evaluateExtraction` 做二次校验；模型字段不完整时直接拒绝，不靠猜测入库。模型默认 `deepseek-flash`，可通过 `DEEPSEEK_MODEL` 覆盖，但不要换成不支持视觉的模型。官方接口参考：[Vision](https://api-docs.deepseek.com/guides/vision) / [JSON Output](https://api-docs.deepseek.com/guides/json_mode)。

## GitHub 仓库与部署

### 方案 A（推荐）：GitHub 仓库 + Vercel

这个项目包含 `/api/upload` 服务端接口，必须持有 Supabase service-role key 和 DeepSeek API key，不能把密钥放进静态前端。因此推荐用 GitHub 管理源码、Vercel 托管运行时：

1. 在 GitHub 新建仓库并推送本项目（截至生成时工作区未安装 Git CLI，也没有远端仓库）；`.github/workflows/ci.yml` 会在 push/PR 时自动跑 21 个测试、类型检查和生产构建。
2. Vercel → Add New Project → Import Git Repository，选择该仓库。
3. 在 Vercel 配置 `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`DEEPSEEK_API_KEY`（其余可选）。
4. 在生产 Supabase 再执行一次最新 `supabase/schema.sql`（至少确保 `reports` bucket 的 MIME 列表已更新）。
5. Deploy。上传 route 设置了 `maxDuration = 60`、Node.js runtime；前端会先压缩，避免平台请求体上限和手机慢网问题。

### 方案 B：GitHub Pages 不适用于当前架构

GitHub Pages 只能托管静态文件，无法运行 `/api/upload`、执行 Supabase service-role 写入或安全保存 DeepSeek 密钥。直接静态导出会让密钥暴露给浏览器，不能用于公开站点。

如果必须使用 GitHub Pages，需要额外把上传与 AI 判定搬到 Supabase Edge Function（或 Cloudflare Workers 等），前端改为静态导出；这是一次独立的架构改造，实施前请确认。

### 自托管

保持 Node.js 20.9+，并注意反向代理的请求体上限（建议 ≥ 8MB）。API 路由需要 Node.js runtime。

---

仅用于 Server 837 社区 NAP 记录，与游戏发行商无关。
