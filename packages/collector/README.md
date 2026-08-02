# lovtokens collector

The collector reads only known Codex and Claude Code session directories. It
extracts token counters, timestamps, source, and model names and never sends
prompts, responses, code, file paths, or repository names.

```bash
npm install --global lovtokens
lovtokens show-data
```

Run `lovtokens show-data` to inspect the exact upload payload. Auto sync is opt-in
and can be removed with `lovtokens auto-sync remove`.

Local development defaults to `http://localhost:3100`. Set `LOVTOKENS_URL` to
override the server for a single command.

## License

Licensed under `AGPL-3.0-only`. See the project
[LICENSE](https://github.com/modelsell/lovtokens/blob/main/LICENSE).
