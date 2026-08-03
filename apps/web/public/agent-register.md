# LovTokens Agent 注册任务

> 本文档供 Codex、Claude Code 等可操作本机终端的 Agent 使用。请完整阅读后再开始，不要跳过用户确认。

## 开场介绍

开始对话时，先用简洁、自然的语言向用户介绍 LovTokens：

> LovTokens 是一个面向 Codex 和 Claude Code 用户的个人 Token 数据看板。它会在本机读取已知的会话记录，只上传按天汇总后的 Token 用量、模型、时间、覆盖率和不可逆会话指纹，帮助你查看使用趋势、生成个人主页并参与排行榜；不会上传对话内容、代码、文件路径、仓库名称或 API Key。

介绍后，告诉用户接下来只需一次性提供邮箱和昵称即可完成注册；隐私级别和自动同步均有默认值，用户无需额外选择。

## 目标

在当前电脑上为用户完成 LovTokens 注册、隐私设置、首次 Token 汇总同步和可选的定时采集，并把最终注册信息返回给用户。

开始前先识别当前操作系统。LovTokens 支持 macOS、Linux 和 Windows，命令会自动使用对应系统的本机凭据存储与定时任务方式，不需要用户手动选择平台命令。

本文档的服务地址是当前 Markdown URL 去掉 `/agent-register.md` 后的 origin。例如本文来自 `https://lovtokens.example/agent-register.md`，服务地址就是 `https://lovtokens.example`。执行命令时必须使用实际 origin，不要照抄示例域名。

## 数据边界

LovTokens 只读取 Codex 与 Claude Code 的已知本地会话目录，只上传按天汇总的 Token、模型、时间、覆盖率和不可逆会话指纹。

绝不上传：

- 提示词、回复或工具输出；
- 代码、原始日志或对话内容；
- 文件路径、仓库名称；
- API Key 或服务商凭据。

用户可先运行 `npx lovtokens@latest show-data` 查看完整待上传数据。注册默认使用 `public` 模式，公开用户的精确 Token 统计、排名和模型分布；如果用户不希望公开，应在注册资料中改选 `summary` 或 `private`。

## 对话流程

不要逐项追问，也不要从 Git、系统账号或历史消息猜测答案。完成项目介绍后，一次性请用户提供以下两项必填资料：

1. 接收账号验证与找回邮件的邮箱；
2. 对外显示的昵称。

以下两项为选填配置，不需要主动询问用户：

1. 隐私级别：
   - `public`（默认）：公开昵称、排名、精确 Token 统计和模型分布；
   - `summary`：公开昵称、排名和区间，不公开精确 Token 与模型；
   - `private`：所有数据保持私密；
2. 是否安装每 30 分钟运行一次的本机定时采集任务：默认为 `是`。

只有当用户主动提供不同选择时，才覆盖对应默认值。用户没有提及这两项时，不得追问，直接使用 `public` 和“自动同步：是”。

使用下面的格式发起一次性询问，并允许用户直接复制后填写：

```text
请一次性提供以下注册资料：
- 邮箱：
- 昵称：

默认会使用 public 隐私级别，公开你的精确 Token 统计、排名和模型分布，并安装每 30 分钟运行一次的自动同步。如果你希望修改其中任一设置，也可以在本次回复中一并说明。
```

邮箱或昵称缺失、无效或含义不明确时，只补问缺失的必填项。不得因用户未提供隐私级别或自动同步选择而追问。收集完成后，一次性复述邮箱、昵称、最终隐私级别和定时采集设置。只有得到用户明确确认后才能继续。

## 执行注册

确认 Node.js 版本不低于 20.9，然后运行下面的命令，将 `{LOVTOKENS_ORIGIN}` 替换为本文档 URL 的实际 origin：

```bash
npx lovtokens@latest agent-register --server {LOVTOKENS_ORIGIN}
```

按照终端提示填写已经确认的信息。填写隐私级别时必须显式输入最终值；使用默认设置时输入 `public`（或 `3`），不要直接回车采用 CLI 的空值回退。填写自动同步时，默认输入 `yes`（或 `y`）。不要把邮箱、初始密码或设备令牌写入仓库、脚本或额外文件。

命令将执行：

1. 在本机生成高强度初始密码；
2. 创建 LovTokens 账号、隐私配置和当前设备；
3. 将设备令牌保存到操作系统凭据存储，无法使用时回退到权限为 `0600` 的配置文件；
4. 执行首次隐私安全同步；
5. 按用户选择安装或跳过 30 分钟定时采集任务。

## 完成标准

只有命令明确输出 `Registration complete.` 后才能报告注册成功。向用户返回：

- 注册邮箱；
- 昵称和 `@handle`；
- 隐私级别；
- 首次同步结果；
- 定时采集状态；
- 登录地址；
- 公开主页地址（仅在用户选择公开时）；
- 命令生成的初始密码，仅发送一次。

提醒用户完成邮箱验证，并在首次登录后修改初始密码。不要展示设备令牌。

如果任何步骤失败，说明失败发生在哪一步，并使用命令输出提供的安全重试方式。不得在部分完成时声称注册成功。

---

## English agent note

Read this entire document before acting. Begin with a short explanation that LovTokens is a personal Codex and Claude Code token dashboard that uploads only privacy-safe daily aggregates, never conversations, code, paths, repository names, or credentials. Ask for only the two required registration details in one message: email and nickname. Privacy and scheduled sync are optional preferences: unless the user proactively overrides them, use `public` and install the local 30-minute sync task. Do not ask follow-up questions for either optional preference. The default `public` setting publishes the user's exact token statistics, rank, and model breakdown. Ask afterward only for a missing or invalid email or nickname. Repeat the complete resolved settings and obtain explicit confirmation. Derive the LovTokens origin from this document URL, run `npx lovtokens@latest agent-register --server {LOVTOKENS_ORIGIN}`, explicitly enter `public` and `yes` when using the defaults, follow the remaining prompts, and report success only after it prints `Registration complete.` Never upload content, expose the device token, or claim success after a partial failure.
