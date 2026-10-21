# Slothful

A calm, local-first productivity companion. Your life, a little less overwhelming.

## Run locally

```sh
bun install
bun run dev
```

React 19, TypeScript, TanStack Start, Tailwind CSS, Lucide, Zod, and Sonner. Run tests with `bun run test`. Copy `.env.example` to `.env` if your hosting requires environment configuration; no API keys are required.

## Local AI

The default **demo mode** is deterministic, rule-based, and explicitly labeled. The app remains usable without Ollama.

For real local inference:

1. Install Ollama from https://ollama.com.
2. Run `ollama pull llama3.2`.
3. Start Ollama with `OLLAMA_ORIGINS` set to the exact origin where you open Slothful (for example, `http://localhost:8080`). Restart Ollama after changing its environment.
4. In Settings, choose Ollama, enter the endpoint (default `http://localhost:11434`) and model name, then test the connection.

Browser network/security policies may block HTTP localhost requests from an HTTPS site or require local-network permission. Prefer running Slothful locally for local inference. Never expose an unprotected Ollama server publicly. The app shows readable errors and offers demo mode; it does not secretly switch providers.

Brain Dump, Make it easier, and Quiet Inbox send only the submitted text to your configured endpoint. Responses are non-streaming JSON validated with Zod, with configurable timeouts and cancellation. The daily planner uses transparent deterministic energy-aware ranking, not model inference.

## Privacy and persistence

Tasks, plans, reflections, settings, and snippets are stored in this browser under `slothful:v1`. There is no cloud sync or account. Use Settings to export JSON, restore a validated backup, or clear local data with confirmation. Export before clearing browser storage or switching devices. Quiet Inbox accepts .txt, .md, and .csv files up to 1 MB; backups are limited to 10 MB.

Demo sample tasks appear on first use. Proposed brain-dump tasks must be reviewed and saved; dates are suggested only if stated. Plans leave breathing room and remain suggestions until accepted.

Fonts load from Google Fonts; a full offline installation has not been verified. No private note content is sent to third-party AI services by default.

## Tests

`bunx vitest run` covers task creation/completion, filtering, planning time limits, explicit dates, structured AI parsing, backup validation, and text-file limits.
