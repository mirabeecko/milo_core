# Agent Runtime Architecture

This document describes the real Agent Runtime implemented during the refactor from mock agents to an actual execution engine.

## Scope

The first phase activates only two agents:

- **Chief of Staff** – receives user intent, creates `Mission`s, delegates `Task`s, finalizes results.
- **Research Agent** – executes search tasks by reading files from the configured Obsidian vault and returns real results.

All other agents remain registered but are not wired into the active runtime until the core flow is fully stable.

## High-level flow

```
User message in chat
        ↓
Command processor detects a research intent
        ↓
AgentManager.createMission(input)
        ↓
Mission persisted + Task created (owner = research)
        ↓
runDelegatedTask(task)
        ↓
ResearchAgent.runTask(task)
        ↓
ExecutionTaskRunner executes real tools (obsidian:list/search/read)
        ↓
Task completed event published
        ↓
AgentManager updates Mission with result
        ↓
Chat / missions API returns the completed Mission
```

## Core components

### `AgentEntityImpl` (`packages/agents/src/agent.ts`)

The runtime object for every agent. It holds:

- `id`, `name`, `status`
- `currentTask` / `activeTaskId`
- task counters (`pendingTasks`, `runningTasks`, `completedTasks`, `failedTasks`)
- `memory` (key/value storage)
- `health` and `lastHeartbeat`
- live `explanation` (what is being done, why, next step, ETA)

State transitions are handled by `AgentStateMachine`. Only valid transitions are allowed.

### State machine

States:

- `offline`
- `idle`
- `starting`
- `working`
- `waiting`
- `paused`
- `stopping`
- `completed`
- `failed`
- `error`

Transitions are explicit. For example, an agent can move from `idle` → `working` when a task arrives, and from `working` → `idle` or `failed` when the task finishes.

### `AgentManager` (`packages/agents/src/agent-manager.ts`)

Central coordinator:

- registers agent definitions
- starts/stops/pauses/resumes agents
- owns the `PriorityTaskQueue`, `AgentScheduler`, `BackgroundRunner`, `HealthMonitor`
- creates `Mission`s and delegates `Task`s
- persists events
- listens for `agent:task:completed` / `agent:task:failed` and updates the parent `Mission`
- exposes API for tools execution and agent introspection

### `ExecutionTaskRunner` (`packages/agents/src/runtime/execution-task-runner.ts`)

Runs a task with real tools. Supports callbacks for:

- `onProgress`
- `onLog`
- `onExplanation`

Currently implemented strategies:

- `search` – lists vault notes, searches by query, reads the top matching files, returns formatted results with citations.
- `analyze`, `summarize`, `report`, `delegate`, `custom` – basic real implementations that do not simulate work.

The runner uses the shared `ToolRegistry` (`@milo/tools`). Tools receive a `ToolContext` containing `vaultPath` and `projectPath`.

### Task Queue

Each agent has its own queue surface, managed centrally by `PriorityTaskQueue`. A task contains:

- `id`, `missionId`
- `type`, `priority`, `status`
- `description` / `title`
- `toolCalls`
- `log`
- `created`, `started`, `finished`
- `result`

Tasks are persisted via `FileTaskRepository`.

### Mission

A `Mission` is a container created by Chief of Staff. It owns one or more tasks and tracks:

- `status` (`pending` → `running` → `completed` / `failed` / `cancelled`)
- `createdAt`, `startedAt`, `completedAt`
- `result`

Missions are persisted via `FileMissionRepository`.

### Tool Registry

Real tools live in `packages/tools/src`. The runtime currently uses:

- `obsidian:list`
- `obsidian:search`
- `obsidian:read`

Other tools (filesystem, web-search, PDF, OCR, etc.) have adapters ready but are not yet wired into active strategies.

## Persistence

- Tasks: `apps/api/data/tasks.json`
- Missions: `apps/api/data/missions.json`
- Logs, memory, metrics, events: in-memory repositories for now (file-backed versions can be added without changing the runtime interface).

Both `tasks.json` and `missions.json` are ignored by git.

## Demo / local mode

The API runs in demo mode by default in development when `DEMO_MODE` is not explicitly set to `false`. Demo mode uses:

- `demo-token` for authentication
- local file-backed repositories
- no external Supabase dependency for auth

This keeps the runtime working locally without needing a deployed backend.

## APIs

Relevant endpoints (all require `Authorization: Bearer demo-token` in local demo mode):

- `POST /chat` – accepts a message; research intent creates a mission.
- `GET /missions` – list missions.
- `GET /missions/:id` – mission detail with result.
- `GET /agents` – list agents with live state.
- `GET /agents/:id` – agent detail.
- `POST /agents/:id/start|stop|pause|resume|restart`
- `GET /agents/:id/logs|metrics|memory|explanation`
- `POST /agents/:id/tools/execute` – run a tool directly through an agent.
- `GET /events/stream` – SSE stream of runtime events.

## Testing

All checks pass:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

## Next steps

1. Extend `ExecutionTaskRunner` strategies for `analyze`, `summarize`, and `report` with real AI calls where appropriate.
2. Activate the remaining agents (Calendar, Communication, Developer, etc.) using the same runtime primitives.
3. Replace in-memory repositories for logs/memory/metrics/events with file-backed implementations.
4. Add retry, deadline handling, and recovery for long-running missions.
