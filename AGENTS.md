# AGENTS.md - CFR-UI Development Guidelines

Guidelines for agentic coding agents working in the CFR-UI React + TypeScript repository.

## Operating Expectations

- Run quality gates after every change (in order): `bun run lint`, `bun run knip`, `bun run test`, `bun run build:dev`.
- Run the production release gate with `bun run build` before deployment (includes CFR recomputation).
- Before committing, update documentation when changes affect behavior, workflows, architecture, or developer setup.
- Commit messages must follow `Commit Conventions (SemVer)` below.
- Capture meaningful learnings during a session (architectural decisions, solved problems, and discouraged antipatterns).

## Instruction Priority

- Treat repository config as executable source of truth: `package.json`, `tsconfig*.json`, `eslint.config.js`, `vite.config.ts`, `vitest*.config.ts`, and `.github/workflows/ci.yml`.
- If guidance in this file conflicts with enforced config, follow config and update `AGENTS.md` in the same change.
- Prefer simple, maintainable code over clever abstractions.

## Commit Conventions (SemVer)

Use Conventional Commits so release versioning can be derived consistently.

Core SemVer-mapped types:

- `fix:` Bug fix. Maps to a PATCH release (`1.0.0` -> `1.0.1`).
- `feat:` New feature. Maps to a MINOR release (`1.0.0` -> `1.1.0`).
- `BREAKING CHANGE:` Footer (or `!` after type/scope, e.g. `feat!:`). Maps to a MAJOR release (`1.0.0` -> `2.0.0`).

Other common types:

- `build:` Build system or external dependency changes.
- `ci:` CI configuration and script changes.
- `docs:` Documentation-only changes.
- `perf:` Performance improvements.
- `refactor:` Code change that is neither a feature nor bug fix.
- `style:` Formatting/whitespace/code style changes with no behavior change.
- `test:` Adding or correcting tests.

Recommended header shape:

```text
<type>(optional-scope)!: short summary
```

## Source of Truth and Freshness

- Dependency versions are sourced from `package.json` and `bun.lock`; avoid hardcoding version numbers in this file unless required for a decision.
- When upgrading major dependencies (React, TypeScript, Vite, Tailwind, Vitest, Bun), update guidance here if behavior or best practices changed.
- Prefer official documentation for framework/tooling guidance.

## Technology Stack

- React + TypeScript (strict mode)
- Vite (HMR + production build)
- Tailwind CSS + local Shadcn/ui-style utility patterns
- Bun (package manager + scripts runtime)
- Vitest + Testing Library
- Recharts for charting

## Development Commands

```bash
# Development
bun run dev              # Start dev server with HMR
bun run dev:up           # Recompute CFR data then start dev server

# Building
bun run build:dev        # Development build validation (TypeScript + Vite, no CFR recompute)
bun run build            # Production build (TypeScript + CFR recompute + Vite)
bun run preview          # Preview production build locally
bun run compute-cfr      # Generate CFR report JSON

# Code Quality
bun run lint             # Run ESLint on all TypeScript files
bun run knip             # Dead-code/unused export checks
bun run test             # Run Vitest tests once (unit + smoke)
bun run test:unit        # Run unit tests only
bun run test:smoke       # Run smoke tests only
bun run test:watch       # Run Vitest in watch mode
```

## Project Structure

```text
src/
├── components/cfr/       # CFR-specific UI sections
├── components/ui/        # Reusable UI components + theme utilities
├── lib/                  # Utilities + CFR logic
├── assets/               # Static assets
├── types/                # Shared types
├── App.tsx               # Main application
├── main.tsx              # Entry point
└── index.css             # Tailwind CSS + tw-animate

public/
└── data/cfr.json         # Generated CFR report data

scripts/
└── compute-cfr.ts        # CFR data generator
```

## Design Principles

- Prefer clear, straightforward solutions and incremental refactors.
- Keep components and functions focused on one responsibility.
- Avoid premature abstraction; extract shared utilities when duplication is repeated and stable.
- Favor pure utility functions in `src/lib/` for business logic.
- Keep side effects isolated (data fetching, subscriptions, DOM APIs) and away from pure rendering logic.

## Import Conventions

- Prefer `@/` alias imports for `src` modules.
- Relative imports are acceptable for same-directory files and app bootstrap modules (for example `src/main.tsx`).
- Group imports in this order: external -> internal -> styles.
- Use named exports for utilities/components by default; keep default exports for top-level entry components when it improves ergonomics.

## TypeScript Guidelines

- Strict mode is required; do not use implicit `any`.
- Type all exported functions, hooks, and public utility interfaces.
- Use unions and narrowing over broad optional object shapes.
- Keep types close to usage, then extract shared types when reused.
- Do not suppress errors without a code comment explaining why.

## React + Vite Best Practices

- Prefer derived values in render over storing redundant state.
- Use `useEffect` only for synchronization with external systems (network, subscriptions, timers, imperative DOM).
- Do not add `React.memo`, `useMemo`, or `useCallback` by default; use them only when profiling shows a measurable benefit.
- Keep hook dependency arrays correct; if dependencies are intentionally omitted, explain why in a short comment.
- Vite transpiles TypeScript but does not type-check; keep `tsc -b` in quality gates (`build:dev`, `build`).

## Styling Guidelines

- Use Tailwind utilities and existing design tokens/CSS variables.
- Use `cn()` and `class-variance-authority` patterns for composable variants.
- Avoid inline styles except for dynamic runtime values not expressible in utilities.
- Follow mobile-first responsive design.

## Error Handling

- Fail with clear, user-meaningful messages for UI states.
- Use `try/catch` around async boundaries and preserve actionable context in logs.
- Avoid swallowing errors silently.
- Add error boundaries when introducing fragile or externalized UI sections.

## Dark Mode

Dark mode uses a class-based strategy:

- `ThemeProvider` manages theme state and `<html>` class toggling.
- `useTheme` hook lives in `src/components/ui/use-theme.ts`.
- Use Tailwind `dark:` variants for dark-specific styles.
- Persist user theme preference in `localStorage`.

## Testing

- Unit tests run in jsdom (`vitest.config.ts`).
- Smoke tests run in node (`vitest.smoke.config.ts`) and include build verification.
- Use Testing Library patterns that assert user-visible behavior.
- Add or update tests when behavior changes, especially for `src/lib` utilities and critical UI flows.

## Automation & CI

- CI runs on pull requests to `main` with gates in this order: lint -> knip -> test -> build.
- Dependabot updates npm dependencies and GitHub Actions on a daily schedule.

## Session Learnings (Append)

When you learn something meaningful, append a short entry here:

- `YYYY-MM-DD:` <learning>
- If discouraging an antipattern, note the preferred replacement pattern.
- Keep this section concise: retain the latest 20 entries and move older ones to `docs/agent-learnings.md`.

- `2026-02-05:` Split Vite vendor chunks by library group (charts/base-ui/icons) and keep React in the shared vendor chunk to avoid circular chunk warnings.
- `2026-02-06:` Added separate build scripts: use `build:dev` for fast local quality gates and `build` for release builds that recompute CFR data.
- `2026-02-06:` Added Docker Compose workflow using the official `oven/bun` image so lint/knip/test/build can run without host Bun.
- `2026-02-06:` Documented Conventional Commit rules with explicit SemVer mapping (`fix`=PATCH, `feat`=MINOR, `BREAKING CHANGE`/`!`=MAJOR) and common auxiliary commit types.
