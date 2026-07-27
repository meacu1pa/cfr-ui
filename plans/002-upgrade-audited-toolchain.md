# Plan 002: Upgrade audited Vite and test toolchain advisories

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 98e51c9..HEAD -- package.json bun.lock .github/workflows/ci.yml AGENTS.md README.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `98e51c9`, 2026-07-27

## Why this matters

`bun audit` reports critical and high advisories in the current frontend tooling stack, including Vite, Vitest, Rollup, PostCSS, Undici through jsdom, and glob/parser packages through ESLint and Knip. This is mostly dev/build/test surface, not shipped app runtime, but this repo runs Vite build and Vitest in CI and local development. Upgrading the direct toolchain dependencies is the cleanest remediation path and should be validated through the existing quality gates.

## Current state

- Direct dependency versions from `package.json`:

```json
package.json:42-53
"@vitejs/plugin-react": "^5.1.4",
"eslint": "^10.0.0",
"eslint-plugin-react-hooks": "^7.0.1",
"eslint-plugin-react-refresh": "^0.5.0",
"globals": "^17.3.0",
"jsdom": "^28.0.0",
"knip": "^5.83.1",
"tw-animate-css": "^1.4.0",
"typescript": "^5.9.3",
"typescript-eslint": "^8.55.0",
"vite": "^7.3.1",
"vitest": "^4.0.18"
```

- CI installs with Bun and runs the quality gates:

```yaml
.github/workflows/ci.yml:15-33
- name: Setup Bun
  uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.3.8"

- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Lint
  run: bun run lint
...
- name: Build
  run: bun run build
```

- `bun audit` on 2026-07-27 reported:
  - `vitest >=4.0.0 <4.1.0`: critical advisory affecting Vitest UI server.
  - `vite >=7.0.0 <=7.3.4`: high/moderate dev server advisories.
  - `rollup >=4.0.0 <4.59.0`, `postcss <8.5.10`, `undici >=7.0.0 <7.24.0`, `minimatch >=9.0.0 <9.0.6`, `brace-expansion >=2.0.0 <2.0.3`, `flatted <3.4.0`, and `js-yaml >=4.0.0 <=4.1.1` through direct tooling.

- Repo guidance says dependency versions come from manifest/lockfile and major tool upgrades should update guidance when behavior changes:

```markdown
AGENTS.md
- Dependency versions are sourced from `package.json` and `bun.lock`; avoid hardcoding version numbers in this file unless required for a decision.
- When upgrading major dependencies (React, TypeScript, Vite, Tailwind, Vitest, Bun), update guidance here if behavior or best practices changed.
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Audit before | `bun audit` | may fail before updates with known advisories |
| Update dependencies | `bun update` | exit 0, `package.json`/`bun.lock` updated as needed |
| Audit after | `bun audit` | exit 0 or no critical/high reachable advisories remain |
| Lint | `bun run lint` | exit 0 |
| Dead-code check | `bun run knip` | exit 0 |
| Tests | `bun run test` | exit 0 |
| Dev build | `bun run build:dev` | exit 0 |

## Scope

**In scope**:
- `package.json`
- `bun.lock`
- `.github/workflows/ci.yml` only if the Bun version must be aligned for upgraded tooling
- `AGENTS.md` only if a major upgrade changes repo guidance
- `README.md` only if setup/build commands change

**Out of scope**:
- Application feature changes in `src/`.
- Refactoring tests unrelated to upgrade breakage.
- Adding new tools or replacing Bun.
- Running `bun update --latest` unless `bun update` cannot reach patched versions and the maintainer approves major-version blast radius.

## Git workflow

- Branch: `codex/002-upgrade-audited-toolchain`
- Commit message style: Conventional Commits. Use `build(deps): upgrade audited frontend toolchain`.
- Do not push or open a PR unless instructed by the operator.

## Steps

### Step 1: Capture the current advisory baseline

Run the audit and keep the output in the terminal/session for comparison. Do not paste advisory exploit details into committed files.

**Verify**: `bun audit` -> before updates it may exit nonzero and list the known advisories above.

### Step 2: Update compatible dependency ranges

Run `bun update`. Let Bun update `bun.lock` and compatible package versions. Inspect `git diff -- package.json bun.lock` afterward and confirm the direct tooling packages changed enough to pull patched transitive versions.

If `bun update` leaves critical/high advisories in direct tools, identify the smallest direct dependency bump needed in `package.json` and run `bun update <package>` for that package. Keep upgrades focused on audited packages and their direct owners: `vite`, `vitest`, `@vitejs/plugin-react`, `jsdom`, `eslint`, `typescript-eslint`, and `knip`.

**Verify**: `git diff -- package.json bun.lock` -> only dependency metadata changed at this stage.

### Step 3: Re-run audit and decide if residual advisories are acceptable

Run `bun audit` again.

Expected result is exit 0. If low/moderate advisories remain only in dev-only tooling and no patched compatible release exists, document that in the PR/summary but do not add suppressions. If any critical/high advisory remains in a reachable direct toolchain path, STOP and report the package and advisory IDs without attempting a broad major migration.

**Verify**: `bun audit` -> exit 0, or no critical/high advisories remain.

### Step 4: Fix only upgrade-caused breakage

Run the repo gates in order. If a gate fails due to a changed API from the upgraded tooling, make the smallest compatibility fix.

Allowed examples:
- Adjust Vitest config shape if Vitest changed a type.
- Align `.github/workflows/ci.yml` Bun version only if local `bun --version` and CI Bun drift causes lockfile/install failures.
- Update `AGENTS.md` only if a major Vite/Vitest/ESLint behavior changed.

Do not refactor application components as part of this plan.

**Verify**:
- `bun run lint` -> exit 0
- `bun run knip` -> exit 0
- `bun run test` -> exit 0
- `bun run build:dev` -> exit 0

### Step 5: Review dependency diff for scope

Inspect changed files.

**Verify**: `git status --short` -> only in-scope files changed.

## Test plan

- No new application tests are expected for a dependency-only remediation.
- Existing tests are the validation surface: `bun run test` must pass all unit and smoke tests.
- `bun audit` is the security-specific verification gate.

## Done criteria

- [ ] `bun audit` has no critical/high advisories in reachable direct toolchain paths.
- [ ] `package.json` and `bun.lock` reflect the minimal dependency updates needed.
- [ ] `bun run lint`, `bun run knip`, `bun run test`, and `bun run build:dev` exit 0.
- [ ] No source feature files changed unless a documented tooling API break required it.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back if:

- `bun update` requires a major upgrade with broad application code changes.
- Critical/high advisories remain and no patched compatible release is available.
- The lockfile cannot be regenerated with the repo's Bun version.
- Fixing upgrade breakage appears to require changing app behavior.

## Maintenance notes

- Dependabot already tracks npm and GitHub Actions daily; keep it rather than adding a second dependency bot.
- Reviewers should focus on lockfile churn, residual audit output, and whether CI's Bun version remains compatible.
- Do not commit raw `bun audit` output if future advisories include sensitive local paths.
