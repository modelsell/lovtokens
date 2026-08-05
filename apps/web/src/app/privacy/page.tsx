import { PageHero } from "@/components/page-hero";
import { t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";

export const generateMetadata = () => localizedMetadata({
  path: "/privacy",
  title: "Collector Privacy Contract",
  zhTitle: "采集器隐私约定",
  description: "Exactly what LovTokens reads, sends, stores, and never collects.",
  zhDescription: "明确说明 LovTokens 会读取、发送、存储以及绝不会采集的内容。",
});

const uploadSource = `const payload = makePayload(
  config.deviceId || "00000000-0000-4000-8000-000000000000",
  data.buckets,
);
await fetch(\`\${config.serverUrl}/api/sync/v1\`, {
  method: "POST",
  headers: {
    authorization: \`Bearer \${config.deviceToken}\`,
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});

function makePayload(
  deviceId: string,
  buckets: Awaited<ReturnType<typeof scanAll>>["buckets"],
) {
  return syncPayloadV2Schema.parse({
    schemaVersion: 2,
    collectorVersion,
    deviceId,
    generatedAt: new Date().toISOString(),
    buckets,
  });
}`;

const uploadSchemaSource = `export const usageBucketV2Schema = z.object({
  schemaVersion: z.literal(TOKEN_SCHEMA_VERSION),
  source: tokenSourceSchema,
  utcDate: z.iso.date(),
  utcHour: z.number().int().min(0).max(23),
  model: z.string().trim().min(1).max(120),
  sessionFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  inputTokensTotal: safeTokenCount,
  freshInputTokens: safeTokenCount,
  cacheReadTokens: safeTokenCount,
  cacheWriteTokens: safeTokenCount,
  outputTokensTotal: safeTokenCount,
  reasoningOutputTokens: safeTokenCount,
  requestCount: z.number().int().min(0).max(10_000_000),
  firstEventAt: z.iso.datetime({ offset: true }),
  lastEventAt: z.iso.datetime({ offset: true }),
  parserVersion: z.string().trim().min(1).max(40),
  coverage: coverageSchema,
}).strict(); // Cross-field consistency checks follow in source.

export const syncPayloadV2Schema = z.object({
  schemaVersion: z.literal(TOKEN_SCHEMA_VERSION),
  collectorVersion: z.string().min(1).max(40),
  deviceId: z.string().uuid(),
  generatedAt: z.iso.datetime({ offset: true }),
  buckets: z.array(usageBucketV2Schema).max(20_000),
}).strict();`;

export default async function PrivacyPage() {
  const locale = await getLocale();
  return <>
    <PageHero
      eyebrow={t(locale, "Privacy contract")}
      title={t(locale, "Aggregate the count. Leave the work.")}
      description={t(locale, "LovTokens has a deliberately narrow data boundary that can be inspected before every sync.")}
    />
    <article className="shell prose-shell">
      <h2>{t(locale, "Known directories only")}</h2>
      <p>{locale === "zh" ? <>采集器只读取 <code>$CODEX_HOME/sessions</code> 和 <code>archived_sessions</code> 下的 Codex 会话、已知配置目录中的 Claude Code 项目日志，以及 <code>$WORKBUDDY_HOME/projects</code> 下的 WorkBuddy 会话。它不会递归搜索主目录，也不会跟随指向这些根目录之外的符号链接。</> : <>The collector reads Codex sessions under <code>$CODEX_HOME/sessions</code> and <code>archived_sessions</code>, Claude Code project logs under known configuration directories, and WorkBuddy sessions under <code>$WORKBUDDY_HOME/projects</code>. It does not recursively search the home directory and does not follow symlinks outside those roots.</>}</p>
      <h2>{t(locale, "Uploaded fields")}</h2>
      <p>{locale === "zh" ? "数据源、UTC 日期与小时、模型、单向会话指纹、Token 组成、请求数、首次/末次事件时间戳、解析器版本和覆盖率。设备认证与使用量数据相互独立。" : "Source, UTC date and hour, model, a one-way session fingerprint, token components, request count, first/last event timestamps, parser version, and coverage. Device authentication is separate from usage."}</p>
      <h2 id="inspect-upload">{t(locale, "Inspect before upload")}</h2>
      <pre><code>npx lovtokens@latest show-data</code></pre>
      <p>{t(locale, "This prints the complete JSON payload. It contains schema version, collector version, a random device ID, timestamps, and aggregate usage buckets.")}</p>
      <div className="callout open-source-callout">
        <strong>{locale === "zh" ? "采集器与上传逻辑已经开源" : "The collector and upload path are open source"}</strong>
        <p>{locale === "zh" ? "show-data 与正式同步调用同一个 payload 构造函数；命令输出的 JSON 就是同步请求发送的内容。你可以在连接或同步前先检查它。" : "show-data and the real sync use the same payload builder. The JSON printed by the command is the body sent by the sync request, so you can inspect it before connecting or syncing."}</p>
      </div>
      <h3>{locale === "zh" ? "实际上传代码" : "The actual upload code"}</h3>
      <p>{locale === "zh" ? "以下片段来自开源 CLI。payload 先通过公开 Schema 校验，随后才会被序列化为同步请求体。" : "This excerpt comes from the open-source CLI. The payload is validated against the public schema before it is serialized as the sync request body."}</p>
      <pre className="source-code"><code>{uploadSource}</code></pre>
      <h3>{locale === "zh" ? "上传字段 Schema" : "Upload field schema"}</h3>
      <p>{locale === "zh" ? "下面是开源 Schema 的字段定义片段；strict() 会拒绝额外字段。会话标识是单向 SHA-256 指纹，不是原始会话 ID；字段间一致性校验请查看下方完整源码。" : "Below is the field-definition excerpt from the open-source schema; strict() rejects additional fields. The session identifier is a one-way SHA-256 fingerprint, not a raw session ID. See the complete source below for cross-field consistency checks."}</p>
      <pre className="source-code"><code>{uploadSchemaSource}</code></pre>
      <p className="source-links"><a href="https://github.com/modelsell/lovtokens/blob/main/packages/collector/src/index.ts" rel="noreferrer" target="_blank">{locale === "zh" ? "查看完整上传实现" : "View the complete upload implementation"}</a><a href="https://github.com/modelsell/lovtokens/blob/main/packages/token-schema/src/index.ts" rel="noreferrer" target="_blank">{locale === "zh" ? "查看上传字段 Schema" : "View the upload field schema"}</a><a href="https://github.com/modelsell/lovtokens" rel="noreferrer" target="_blank">{locale === "zh" ? "访问 LovTokens 开源项目" : "Open the LovTokens repository"}</a></p>
      <h2>{t(locale, "Never uploaded")}</h2>
      <ul>{locale === "zh" ? <><li>提示词、助手回复、工具输出或代码</li><li>文件路径、项目名称、仓库名称或 Git 远程地址</li><li>API Key、服务商 Cookie 或私有服务商端点</li><li>原始日志文件或稳定的设备标识符</li></> : <><li>Prompts, assistant replies, tool output, or code</li><li>File paths, project names, repository names, or Git remotes</li><li>API keys, provider cookies, or private provider endpoints</li><li>Raw log files or stable machine identifiers</li></>}</ul>
      <h2>{t(locale, "Public by choice")}</h2>
      <p>{locale === "zh" ? "新档案默认私密。精确总量、排名、头像、模型和费用均可独立控制。隐藏字段会在服务端从 HTML、JSON-LD、API 结果和生成图片中移除。" : "New profiles are private. Exact totals, rank, avatar, models and cost each have independent controls. Hidden fields are removed on the server from HTML, JSON-LD, API results and generated images."}</p>
      <h2>{locale === "zh" ? "社交平台授权" : "Social publishing authorization"}</h2>
      <p>{locale === "zh" ? "只有在用户主动连接 X 并确认发布时，LovTokens 才会上传所选分享图片并代表该 X 账号创建帖子。X 访问令牌和刷新令牌使用独立密钥加密存储；导出数据不包含令牌，断开连接或删除账号会删除本地保存的授权。" : "LovTokens uploads a selected share image and creates a Post only after the user explicitly connects X and chooses to publish. X access and refresh tokens are encrypted with a separate key; exports exclude tokens, and disconnecting or deleting the account removes the locally stored authorization."}</p>
      <h2>{t(locale, "Control")}</h2>
      <p>{locale === "zh" ? <>用户可以使用 <code>lovtokens show-data</code> 检查上传内容、撤销设备、导出汇总数据、隐藏档案或删除账号。已删除证书仅保留不含身份信息的撤销证明。</> : <>Users can inspect an upload with <code>lovtokens show-data</code>, revoke devices, export aggregate data, hide a profile, or delete the account. Deleted certificates retain only a revoked proof without identity.</>}</p>
    </article>
  </>;
}
