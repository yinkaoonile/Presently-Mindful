# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI (via Replit AI Integrations) — gpt-5.2 for reflections & quotes

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── presently/          # Presently React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # OpenAI server-side integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Presently App

Mental health & connection app for millennials.

### Features
- Daily mood check-in (emoji scale 1-5 + freeform journal)
- AI reflection engine using GPT-5.2 — personalized, empathetic responses
- Shareable quote card generated after each check-in
- 12-day streak tracker + weekly mood bar chart
- Anonymous community feed with hugs & likes
- Pro tier teaser ($9/mo) for 30-day trends, therapist matching, guided programs

### Pages
- `/` — Home: daily mood check-in
- `/insights` — Streak, weekly mood chart, avg mood, Pro teaser
- `/community` — Anonymous community feed
- `/share` — After check-in: AI reflection + shareable quote card

### DB Tables
- `checkins` — mood, journal, AI reflection, quote text, session ID, shared flag
- `community_posts` — anonymous snippets, mood, hugs, likes

### API Routes
- `GET/POST /api/checkins` — list or create check-ins
- `GET /api/checkins/streak` — streak stats & weekly moods
- `GET /api/checkins/:id/quote` — get quote card
- `GET /api/community` — community feed
- `POST /api/community/:id/hug` — send hug
- `POST /api/community/:id/like` — send like

### Session Handling
Session ID is passed via `x-session-id` request header from the frontend (stored in localStorage). This is a simple per-device identifier.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists lib packages as project references.

- **Always typecheck from the root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — actual JS bundling is esbuild/vite
- Re-run codegen after spec changes: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes: health, checkins, community.

### `artifacts/presently` (`@workspace/presently`)

React + Vite frontend for Presently. Uses React Query hooks from `@workspace/api-client-react`.

### `lib/db` (`@workspace/db`)

Database layer. Tables: checkins, community_posts.

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

OpenAI SDK client pre-configured with Replit AI Integrations env vars.
