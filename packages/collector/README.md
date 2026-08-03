# lovtokens collector

The collector reads only known Codex, Claude Code, and WorkBuddy session directories. It
extracts token counters, timestamps, source, and model names and never sends
prompts, responses, code, file paths, or repository names.

```bash
npm install --global lovtokens
lovtokens show-data
```

For agent-led onboarding, copy the short handoff from the LovTokens homepage
into Codex, Claude Code, or WorkBuddy. It points to the production `/agent-register.md`
document, where the agent reads the complete workflow before running
`lovtokens agent-register`. The agent confirms email, nickname, privacy, and
scheduled-sync consent, then returns the account summary and locally generated
one-time initial password.

Run `lovtokens show-data` to inspect the exact upload payload. Auto sync is opt-in,
runs hourly, and checks once per day for a newer LovTokens release. Updates are
installed in the user's LovTokens config directory and take effect on the next
scheduled sync. Remove both behaviors with `lovtokens auto-sync remove`.

Local development defaults to `http://localhost:3100`. Set `LOVTOKENS_URL` to
override the server for a single command.

## License

Licensed under `AGPL-3.0-only`. See the project
[LICENSE](https://github.com/modelsell/lovtokens/blob/main/LICENSE).
