# Plan 004: Validate CFR inputs and loaded report data

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 98e51c9..HEAD -- scripts/compute-cfr.ts scripts/compute-cfr.test.ts src/lib/use-cfr-report.ts src/types/cfr.ts src/lib/cfr.test.ts src/smoke.test.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `98e51c9`, 2026-07-27

## Why this matters

The generator currently casts `JSON.parse` output to `RepoInput[]` and immediately uses fields as if they are valid strings. The UI also casts fetched JSON to `CfrReport` before rendering. Invalid `repos.json`, a stale/corrupt `public/data/cfr.json`, or a server returning the wrong payload can therefore crash or render misleading values instead of producing a clear error.

## Current state

- `scripts/compute-cfr.ts` trusts parsed JSON:

```ts
scripts/compute-cfr.ts:164-165
const reposRaw = await readFile(options.reposPath, "utf8")
const reposInput: RepoInput[] = JSON.parse(reposRaw)
```

- The script immediately dereferences `repo.name` and `repo.url`:

```ts
scripts/compute-cfr.ts:171-174
for (const repo of reposInput) {
  const name = repo.name?.trim() || deriveNameFromUrl(repo.url)

  const { output, error } = await runGitTags(repo.url)
```

- The UI trusts fetched data:

```ts
src/lib/use-cfr-report.ts:17-24
fetch("/data/cfr.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Missing data file (HTTP ${response.status})`)
    }
    return response.json()
  })
  .then((data: CfrReport) => {
```

- `src/types/cfr.ts` defines the expected report shape:

```ts
src/types/cfr.ts:27-32
export type CfrReport = {
  generatedAt: string
  failureRule: string
  versionPattern: string
  repos: CfrRepo[]
  summary: CfrSummary
}
```

- Repo conventions: pure validation helpers should live near use. Since no schema library is installed, prefer small type guards over adding a dependency for this compact JSON shape.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `bun run test:unit -- scripts/compute-cfr.test.ts` | exit 0 |
| Unit tests | `bun run test:unit` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Dead-code check | `bun run knip` | exit 0 |
| Full tests | `bun run test` | exit 0 |
| Dev build | `bun run build:dev` | exit 0 |

## Scope

**In scope**:
- `scripts/compute-cfr.ts`
- `scripts/compute-cfr.test.ts`
- `src/lib/use-cfr-report.ts`
- `src/types/cfr.ts` only if shared runtime validators need exported types
- `src/smoke.test.tsx` or a new nearby test only if UI report validation is tested

**Out of scope**:
- Adding Zod, Valibot, or another schema dependency unless the maintainer explicitly prefers it.
- Changing the public report JSON shape.
- Changing CFR calculation semantics. Plan 001 owns metric semantics.
- Rewriting `useCfrReport` to a data-fetching library.

## Git workflow

- Branch: `codex/004-validate-cfr-inputs-and-report`
- Commit message style: Conventional Commits. Use `fix(cfr): validate report inputs`.
- Do not push or open a PR unless instructed by the operator.

## Steps

### Step 1: Add generator input validation tests

In `scripts/compute-cfr.test.ts`, add tests for a new exported helper such as `parseReposInput(value: unknown): RepoInput[]` or `validateReposInput(value: unknown): RepoInput[]`.

Cover these cases:
- Non-array JSON throws a clear error mentioning the repos file must contain an array.
- An entry without a string `url` throws a clear error with the entry index.
- An entry with a blank `url` throws a clear error with the entry index.
- `name` is optional, but if present must be a string.
- Valid entries are returned unchanged or normalized only by trimming if you choose to trim.

Do not include secret or real private repository URLs in tests. Use `https://example.com/repo.git`.

**Verify**: `bun run test:unit -- scripts/compute-cfr.test.ts` -> new tests fail before implementation.

### Step 2: Implement generator input validation

In `scripts/compute-cfr.ts`:
- Change the parse flow to `const reposInput = parseReposInput(JSON.parse(reposRaw))`.
- Implement and export the validation helper for tests.
- Throw `Error` instances with user-meaningful messages such as `repos.json entry 2 must include a non-empty string url`.
- Preserve current behavior for valid `name`/`url` entries.

Avoid broad casts. Narrow `unknown` values with `typeof`, `Array.isArray`, and object checks.

**Verify**: `bun run test:unit -- scripts/compute-cfr.test.ts` -> all focused tests pass.

### Step 3: Add report-shape validation for fetched data

Create a small runtime guard near `useCfrReport`, for example inside `src/lib/use-cfr-report.ts` or a new `src/lib/cfr-report.ts` if the file gets too crowded.

Validate only the shape needed to avoid crashes and misleading top-level renders:
- `generatedAt`, `failureRule`, and `versionPattern` are strings.
- `repos` is an array.
- `summary` is an object with numeric `totalRepos`, `totalReleases`, `totalPatchFailures`, and `changeFailureRate`.
- For repo entries, at minimum require string `name`, string `url`, numeric totals/rate, array `releases`, and `error` being `string | null`.

In `useCfrReport`, after `response.json()`, validate before `setReport`. If validation fails, throw `Error("Invalid CFR report data")` or a similarly clear message. Keep the existing loading/error state shape unchanged.

**Verify**: `bun run test:unit` -> existing tests still pass.

### Step 4: Add focused UI validation coverage if practical

If there is an existing fetch-hook test pattern, follow it. There currently is no `useCfrReport` test, so prefer adding a small test only if it can be done without complex mocking.

Acceptable options:
- Add a unit test for the exported validator if you placed it in `src/lib/cfr-report.ts`.
- Or add a `useCfrReport` test that stubs `global.fetch` and asserts invalid data produces the error state.

If testing the hook requires heavy new test harness code, STOP and report that the generator validation landed but UI validation coverage needs a separate test infrastructure plan.

**Verify**: `bun run test:unit` -> all unit tests pass, including validator/hook tests if added.

### Step 5: Run the full repo gates

Run the quality gates in documented order.

**Verify**:
- `bun run lint` -> exit 0
- `bun run knip` -> exit 0
- `bun run test` -> exit 0
- `bun run build:dev` -> exit 0

## Test plan

- Add generator validation tests to `scripts/compute-cfr.test.ts`, modeled after the existing `parseArgs` tests.
- Add validator or hook tests for fetched report shape only if they stay small and stable.
- Full verification is lint, knip, test, and build:dev.

## Done criteria

- [ ] Invalid `repos.json` shapes fail with clear messages before `runGitTags`.
- [ ] `useCfrReport` does not set invalid fetched JSON as a `CfrReport`.
- [ ] Valid existing report data still renders and tests pass.
- [ ] `bun run lint`, `bun run knip`, `bun run test`, and `bun run build:dev` exit 0.
- [ ] No public report JSON shape change is introduced.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back if:

- Runtime validation would require changing the report JSON shape.
- Hook testing requires large test infrastructure unrelated to validation.
- Plan 001 has already moved report parsing/types enough that these excerpts no longer match.
- A validation error would expose sensitive repo URLs in logs; keep messages structural and avoid dumping full input objects.

## Maintenance notes

- Future additions to `CfrReport` should update the runtime validator and tests in the same PR.
- Reviewers should check that validation errors are helpful but do not dump entire JSON payloads.
- If this app later accepts user-submitted repo config, validation should become stricter and include URL protocol allow-listing.
