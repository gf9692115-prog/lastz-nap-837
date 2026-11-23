# NAP WATCH // Last Z Server 837

837 服 NAP 违规自动检测站。上传赏金任务记录、矿区争夺或贸易货车战报截图，DeepSeek 视觉模型负责读取，服务端规则引擎负责定性，违规记录自动进入联盟排行榜并公开证据截图。

> 当前架构：**GitHub Pages 静态前端 + Supabase Edge Function 上传代理**。不使用 Vercel，不需要任何服务器长期运行。

## 技术栈

- Next.js 15 App Router + React 19 + TypeScript，`output: "export"` 静态导出
- Tailwind CSS 3.4
- Supabase Postgres + Storage + Edge Functions (Deno)
- DeepSeek `deepseek-flash` 多模态视觉（OpenAI 兼容 Chat Completions + JSON Output）
- GitHub Actions：CI、GitHub Pages 部署、可选 Edge Function 部署
- Vitest：NAP 规则与 DeepSeek 请求适配器

## 架构

```text
GitHub Pages (static HTML/JS/CSS)
  ├─ reads  -> Supabase PostgREST (public anon/publishable key, RLS)
  └─ upload -> Supabase Edge Function: upload-report
                 ├─ service-role key -> Storage(reports) + violations table
                 └─ DeepSeek API     -> structured extraction
```

安全边界：

- 浏览器只拿到 Supabase **公开 anon / publishable key**，没有 service-role key。
- DeepSeek key 和 service-role key 只存在于 Edge Function 的 Secrets。
- `reports` 截图 bucket 公开，用于证据预览；外服 rejected 行不进入公共查询。
- 上传函数是公开的（`verify_jwt=false`），当前无登录/限流，和第一阶段的开放上传模型一致。

## 判定规则（服务端硬编码，不交给 AI 定性）

| 类型 | 界面识别 | 违规方唯一来源 | 计分条件 |
| --- | --- | --- | --- |
| `BOUNTY_PLUNDER` | 任务记录 / `Görev Kaydı` / Mission Records 列表，无 VS | 每个完整记录行上的掠夺者 | 该玩家属于 837 |
| `RESOURCE_TILE` | 矿区争夺 / Resource Tile / Mine 的左右 VS 战报 | **右侧**玩家 | 右侧玩家属于 837 |
| `TRUCK_PLUNDER` | 贸易货车 / Trade Truck 的左右 VS 战报，或详情/防守日志（Ticaret Muhafızları / Savaş günlüğü） | VS 右侧玩家，或战斗日志行中的进攻玩家 | 该攻击者属于 837 |

1. 左侧上传者永远是受害者，**永不作为违规方**。VS 类型只读取 `rightPlayer`。
2. 赏金类型读取每条完整任务记录行里的掠夺者，不读任一 VS 侧；同一张列表截图可以生成多条记录。
3. 贸易货车“详情”界面中，只读取「战斗记录 / Savaş günlüğü」行里的进攻玩家，并选取最新时间的一条；顶部弹窗、系统通知和其他玩家名字一律忽略，避免把别的 #838 通知误当成这次进攻。
4. 违规方名字前的 `#XXX` 决定服务器；无前缀或明确 `#837` 视为 837 本服。
5. 若原始名字完全没有外服号，但模型声称看到了外服号，系统只在“外服”方向接受兜底，只会少计，不会误把外服算成本服。
6. 战报缺年份时补当前 UTC 年份，秒数截断到分钟，按 UTC 存储。例如 `11-20 13:22` → `2026-11-20T13:22:00.000Z`。
7. 唯一索引 `(report_type, offending_alliance, offending_player, battle_timestamp)` 防重复计分。
8. 未识别到联盟时记入 `UNKNOWN`，前端显示“未知联盟”。

赏金任务记录列表会一次提取所有完整可见行，并逐条入库；被截断或时间不可读的行会跳过。其他类型仍按一张截图一条战报处理。贸易货车详情日志如果显示多条记录，当前版本只取时间最新的一条；后续可复用赏金的多行机制。

## 目录结构

```text
.
├─ app/
│  ├─ globals.css               # 深色电竞主题与动效
│  ├─ icon.svg
│  ├─ layout.tsx
│  └─ page.tsx                  # 静态 shell，客户端读取 Supabase
├─ components/                  # 上传区、排行榜、证据流、证据弹窗
├─ lib/
│  ├─ client/
│  │  ├─ config.ts              # 浏览器可见的 Supabase / Function URL
│  │  ├─ dashboard-data.ts      # 通过 RLS 读取公开榜单
│  │  └─ prepare-image.ts       # 手机端压缩、HEIC→JPEG
│  ├─ supabase/browser.ts       # anon/publishable browser client
│  ├─ constants.ts
│  ├─ format.ts
│  └─ types.ts
├─ supabase/
│  ├─ schema.sql                # 表、唯一索引、视图、RLS、Storage bucket
│  ├─ config.toml               # upload-report verify_jwt=false
│  └─ functions/
│     ├─ .env.example           # Edge Function 本地/服务端 Secrets 模板
│     ├─ upload-report/index.ts # 上传、Storage、DeepSeek、规则、入库、去重
│     └─ _shared/
│        ├─ constants.ts
│        ├─ types.ts
│        ├─ rules.ts            # 玩家/服务器/时间归一化与 NAP 判定
│        ├─ deepseek.ts         # DeepSeek 视觉适配器 + Prompt + JSON 校验
│        ├─ image.ts            # 文件魔法字节校验
│        └─ cors.ts
├─ tests/
│  ├─ rules.test.ts             # 16 条规则测试（含防算反、外服、时间、特殊字符）
│  ├─ deepseek.test.ts          # 5 条 DeepSeek 请求/解析/错误测试
│  └─ image.test.ts             # 5 条图片签名/扩展名检测
├─ .github/workflows/
│  ├─ ci.yml
│  ├─ pages.yml                 # GitHub Pages 静态部署
│  └─ deploy-supabase-function.yml
├─ scripts/serve-out.mjs        # 本地静态预览
├─ public/.nojekyll
├─ .env.example
├─ next.config.ts               # output: export + basePath
├─ tailwind.config.ts
├─ pnpm-workspace.yaml
└─ README.md
```

## 一、Supabase 准备

### 1. 建表与 Storage

1. 在 [Supabase](https://supabase.com/) 新建项目。
2. 打开 **SQL Editor**，完整执行 [`supabase/schema.sql`](supabase/schema.sql)。
3. 确认 Storage 中出现公开 bucket `reports`。

如果之前执行过旧版 schema，请重新执行一次；它会更新 bucket 的 MIME 白名单。浏览器只直接读取 `is_violation=true` 的行，外服 rejected 记录保留在表中，由 service role 审计。

### 2. 配置 Edge Function Secrets

在 **Supabase Dashboard → Edge Functions → Secrets** 添加：

| Secret | 必填 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek 开放平台 API key |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-flash`，必须支持视觉 |
| `SUPABASE_REPORTS_BUCKET` | 否 | 默认 `reports` |
| `ADMIN_DELETE_TOKEN` | 使用管理面板时必填 | 管理员删除口令，至少 16 字符；建议使用 32 位以上随机字符串。只存在服务端，不能写进 `NEXT_PUBLIC_*` |

`SUPABASE_URL`、`SUPABASE_SECRET_KEYS`（或 legacy service-role key）由 Supabase 注入，不需要手动写进浏览器变量。

### 3. 部署 Edge Functions

任选一种：

**Dashboard / CLI（手动）**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy upload-report --no-verify-jwt
npx supabase functions deploy admin-reports --no-verify-jwt
```

**GitHub Actions（推荐）**

在仓库配置：

- Repository variable `SUPABASE_PROJECT_REF`
- Repository secret `SUPABASE_ACCESS_TOKEN`

然后手动运行 **Deploy Supabase Upload Function** workflow。该 workflow 会同时部署上传函数和管理函数。

函数地址为：

```text
https://<project-ref>.supabase.co/functions/v1/upload-report
https://<project-ref>.supabase.co/functions/v1/admin-reports
```

前端未显式配置 `NEXT_PUBLIC_UPLOAD_FUNCTION_URL` 时会自动推导出这个地址。

## 二、GitHub Pages 部署

### 1. 创建仓库并推送

在 GitHub 新建一个空仓库，然后在项目目录执行：

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

当前工作区已经初始化了本地 Git 仓库并提交；首次 push 时 Git Credential Manager 会引导你完成 GitHub 登录。

### 2. 配置仓库 Variables

GitHub → Settings → Secrets and variables → Actions → **Variables**：

| Variable | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 二选一 | legacy anon key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 二选一 | 新版 publishable key |
| `NEXT_PUBLIC_UPLOAD_FUNCTION_URL` | 否 | 覆盖自动推导的函数 URL |

这些值会进入静态 JS，本身不是秘密。**不要**把 service-role / DeepSeek key 放进来。

### 3. 开启 Pages

GitHub 仓库 → Settings → Pages → Source 选择 **GitHub Actions**。

推送 `main` 后，`.github/workflows/pages.yml` 会自动：

1. 计算项目页 basePath：`/<repo-name>`（`<user>.github.io` 仓库为空）
2. 注入 Supabase 公共变量
3. `next build` 静态导出到 `out/`
4. 发布到 GitHub Pages

站点地址通常是：

```text
https://<github-user>.github.io/<repo-name>/
```

如果使用自定义域名，GitHub Pages 的 basePath 可能需要改成空字符串；请按实际站点路径调整 `pages.yml` 中 computed basePath。

## 三、本地开发

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

`.env.local` 填公开变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# 或新版
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# NEXT_PUBLIC_UPLOAD_FUNCTION_URL 可留空，自动从 URL 推导
```

上传函数必须已经部署到 Supabase，或本地用 Supabase CLI + Docker 启动。浏览器端不再有 Next API Route。

生产静态预览：

```bash
pnpm build
pnpm start
```

打开 <http://localhost:3000>。手机在同一局域网内用电脑 IP 访问即可测试上传。

## 四、测试

```bash
pnpm test        # 28 个测试
pnpm typecheck   # TypeScript（Edge entry 由 Supabase 部署时校验）
pnpm build       # 静态导出
```

`tests/rules.test.ts` 覆盖真实战报的关键路径：赏金本服/外服、赏金列表多行批量判定、矿区防算反、货车 `#838` 豁免、`[d00m]RAKK` 本服计分、特殊字符和 UTC 时间。

`tests/deepseek.test.ts` 用 mock fetch 验证：多模态 `image_url`、JSON Output、`thinking=disabled`、HEIC 拒绝、空/非法 JSON 和上游 HTTP 错误；不需要真实 API key。`tests/image.test.ts` 覆盖 JPEG/PNG/WebP 签名和 HEIC 拒绝。

## 上传 API（Supabase Edge Function）

`POST https://<project-ref>.supabase.co/functions/v1/upload-report`

`multipart/form-data`，字段名 `image`。返回结构与旧版一致：

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

| HTTP | code | 说明 |
| --- | --- | --- |
| 201 | `VIOLATION_RECORDED` | 本服违规，已入库 |
| 201 | `EXTERNAL_SERVER` | 外服行为，`is_violation=false`，不计分 |
| 409 | `DUPLICATE` | 联合唯一索引冲突 |
| 422 | `UNSUPPORTED_REPORT` | 不是 3 类战报之一 |
| 422 | `INVALID_REPORT` | 关键字段/时间不清晰，拒绝猜测 |
| 400/413/415 | `INVALID_IMAGE` | 文件为空、过大或格式不支持 |
| 502 | `AI_ERROR` / `STORAGE_ERROR` | DeepSeek 或 Storage 失败 |
| 503 | `CONFIGURATION_ERROR` | Edge Function Secrets 缺失 |
| 500 | `DATABASE_ERROR` / `INTERNAL_ERROR` | 数据库或未知错误 |

浏览器上传前会压缩到最长边 2200px 的 JPEG；最终只发送 JPG / PNG / WebP，手机 HEIC/HEIF 会先尝试转 JPEG。

## 管理员删除

1. 在 Supabase **Edge Functions → Secrets** 添加 `ADMIN_DELETE_TOKEN`，值使用 32 位以上随机字符串。
2. 打开网站，点击证据区标题旁的 **Admin** 或页脚 **Admin**。
3. 输入同一个口令。口令只在当前标签页内存中保存，不写入 localStorage / cookie。
4. 管理面板会列出所有记录（包括不公开的外服审计记录）。点击 **Delete** 并确认后，服务端会删除记录行、证据图片，并让联盟排行榜自动重算。

管理接口：

```text
POST https://<project-ref>.supabase.co/functions/v1/admin-reports
Header: x-admin-token: <ADMIN_DELETE_TOKEN>
Body:   {"action":"list"}
        {"action":"delete","id":"<record-uuid>"}
```

安全说明：这是**单一共享管理员口令**，不是多账号系统；任何拿到口令的人都能删除记录。接口有 300ms 失败延迟、限制允许的站点 Origin，但不做分布式暴力破解限流，因此口令必须足够长。轮换口令只需更新 Supabase Secret，网页端无需重新构建。

## 设计边界

- **公开匿名上传**：函数 `verify_jwt=false` 且未做登录/频率限制。公开站点上线前强烈建议增加 Cloudflare Turnstile、访问口令或按 IP/用户的限流；否则 DeepSeek 和 Storage 费用可能被滥用。管理删除函数同样 `verify_jwt=false`，但必须携带服务端口令，不能匿名调用。
- **赏金多行记录共享一张证据图**：同一张列表截图产生的多条记录共用同一个 Storage 对象。管理员删除单条记录时，会先确认没有其他记录引用该图片，再删除图片，避免误删其他行的证据。
- **AI 仍可能误读**：低置信度/字段不全会拒绝入库，但自动判定仍建议由联盟管理抽查。误判时可通过站点管理面板同时删除记录、证据图片和榜单计数，也可直接在 Supabase 中删除对应行和 Storage 对象。
- **时间为游戏界面显示值**：截图不带时区，本实现按业务要求将其视为 UTC。如果游戏实际时区不同，需要同时调整 `_shared/rules.ts` 的归一化和前端展示。
- **分钟级去重**：同一联盟、玩家、类型在同一分钟的重复战报会判为重复；唯一索引字段与产品要求一致。
- **外服记录可见性**：外服行不会进入公共 Data API 查询；公开 bucket 的截图对象仍可能在知道随机路径时被访问，不要把它当隐私存储。
- **公开证据**：`reports` bucket 的公开读取是“点击预览原图”的前提。若改为私密证据，需要改成 signed URL。
- **一次只处理一张截图、一条战报**：多卡片请先裁剪。
- **DeepSeek 输出约束**：DeepSeek JSON Output 只保证合法 JSON，不是 JSON Schema。完整字段协议写在 System Prompt 中，边缘函数再做归一化和业务校验；字段不完整时拒绝，不靠猜测入库。
- **Edge Function 入口不参与 Next 类型检查**：根 `tsconfig` 排除了 `supabase/functions/upload-report`（Deno 运行时 + `npm:` import）。部署时 Supabase CLI 会进行 Deno 打包校验。

## DeepSeek 参考

- [Vision](https://api-docs.deepseek.com/guides/vision)
- [JSON Output](https://api-docs.deepseek.com/guides/json_mode)

---

仅用于 Server 837 社区 NAP 记录，与游戏发行商无关。
