# Plan 003: Typecheck node-side scripts in the build gate

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 98e51c9..HEAD -- package.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts vitest.smoke.config.ts scripts/compute-cfr.ts scripts/compute-cfr.test.ts knip.json README.md AGENTS.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `98e51c9`, 2026-07-27

## Why this matters

The release build runs `tsc -b`, but the node-side CFR generator under `scripts/` is not part of any referenced TypeScript project. Tests import parts of the generator, yet untested script-only code can still drift outside the build gate. Including scripts and node config files in a node TypeScript project closes that gap with low risk and makes future CFR generator changes safer.

## Current state

- The root project references app and node configs:

```json
tsconfig.json:3-6
"references": [
  { "path": "./tsconfig.app.json" },
  { "path": "./tsconfig.node.json" }
]
```

- `tsconfig.node.json` includes only Vite config:

```json
tsconfig.node.json:25
"include": ["vite.config.ts"]
```

- `scripts/compute-cfr.ts` is a node/Bun script but is outside `tsconfig.node.json`:

```ts
scripts/compute-cfr.ts:1-4
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { RepoCfrResult } from "@/lib/cfr"
import { computeReleaseCfr } from "@/lib/cfr"
```

- Build scripts rely on `tsc -b`:

```json
package.json:9-10
"build:dev": "tsc -b && vite build",
"build": "tsc -b && bun run compute-cfr -- --repos repos.json --out public/data/cfr.json && vite build",
```

- Knip currently reports a config hint:

```json
knip.json:2-4
"entry": [
  "src/main.tsx"
],
```

During audit, `bun run knip` exited 0 but printed: `Configuration hints (1) src/main.tsx knip.json Remove redundant entry pattern`.

- Repo conventions: the AGENTS guidance requires quality gates in order: `bun run lint`, `bun run knip`, `bun run test`, `bun run build:dev`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `bunx tsc -b` | exit 0, no errors |
| Lint | `bun run lint` | exit 0 |
| Dead-code check | `bun run knip` | exit 0 and no redundant-entry hint |
| Tests | `bun run test` | exit 0 |
| Dev build | `bun run build:dev` | exit 0 |

## Scope

**In scope**:
- `tsconfig.node.json`
- `tsconfig.json` only if a separate scripts config is cleaner than extending `tsconfig.node.json`
- `package.json` only if adding an explicit `typecheck` script is necessary
- `knip.json`
- `README.md` only if command docs change
- `AGENTS.md` only if build/typecheck guidance changes

**Out of scope**:
- Changing CFR behavior in `scripts/compute-cfr.ts`.
- Changing Vite/Vitest runtime configuration unless TypeScript inclusion requires it.
- Dependency upgrades. Plan 002 owns dependency remediation.

## Git workflow

- Branch: `codex/003-typecheck-node-scripts`
- Commit message style: Conventional Commits. Use `build(tsconfig): typecheck node scripts`.
- Do not push or open a PR unless instructed by the operator.

## Steps

### Step 1: Include node-side files in TypeScript project references

Prefer the smallest change: extend `tsconfig.node.json` `include` to cover node-side root configs and scripts that TypeScript should validate. Candidate include list:

```json
"include": [
  "vite.config.ts",
  "vitest.config.ts",
  "vitest.smoke.config.ts",
  "scripts/**/*.ts"
]
```

Keep `types: ["node"]`, `moduleResolution: "bundler"`, strict flags, and `noEmit` unchanged unless TypeScript errors require a narrow adjustment.

**Verify**: `bunx tsc -b` -> exit 0, no TypeScript errors.

### Step 2: Remove stale Knip entry override

Update `knip.json` to remove the redundant `entry` pattern for `src/main.tsx` if Knip still reports the same hint. Preserve the `project`, `ignore`, and `ignoreDependencies` settings unless Knip's output proves they are also stale.

**Verify**: `bun run knip` -> exit 0 and no `Remove redundant entry pattern` hint.

### Step 3: Decide whether to add a typecheck script

If the repo already has clear build scripts and no README command promises a standalone typecheck, do not add a new script. If reviewers/operators expect a direct command, add `"typecheck": "tsc -b"` to `package.json` and update README command docs.

Preferred outcome for this repo: no new script unless there is a clear operator need, because `build:dev` already typechecks.

**Verify**: `git diff -- package.json README.md` -> either no changes, or only the optional `typecheck` command and matching docs.

### Step 4: Run the quality gates

Run the repo's standard quality gates in order.

**Verify**:
- `bun run lint` -> exit 0
- `bun run knip` -> exit 0
- `bun run test` -> exit 0
- `bun run build:dev` -> exit 0

## Test plan

- No new unit tests are expected; this is a build configuration fix.
- The key test is `bunx tsc -b` proving `scripts/**/*.ts` is typechecked.
- Full validation is the repo quality gate sequence.

## Done criteria

- [ ] `scripts/**/*.ts` is included in a referenced TypeScript project used by `tsc -b`.
- [ ] `bunx tsc -b` exits 0.
- [ ] `bun run knip` no longer reports the redundant `src/main.tsx` entry hint.
- [ ] `bun run lint`, `bun run knip`, `bun run test`, and `bun run build:dev` exit 0.
- [ ] No source behavior files are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back if:

- Including scripts exposes TypeScript errors that require behavior changes in `scripts/compute-cfr.ts`.
- TypeScript cannot resolve the `@/` alias for scripts without changing runtime execution.
- Knip asks for removing entries or dependencies beyond the known redundant `src/main.tsx` hint.

## Maintenance notes

- Future scripts under `scripts/` should now be covered by `tsc -b`; reviewers should reject script additions that bypass this project.
- If Plan 001 changes `scripts/compute-cfr.ts`, this plan makes those changes easier to validate.
- Keep node build config focused; do not mix browser-only globals into `tsconfig.node.json`.
