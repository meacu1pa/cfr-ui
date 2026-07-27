# Plan 001: Tighten CFR to production SemVer tags

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 98e51c9..HEAD -- src/lib/cfr.ts src/lib/cfr.test.ts scripts/compute-cfr.ts scripts/compute-cfr.test.ts README.md public/data/cfr.json`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `98e51c9`, 2026-07-27

## Why this matters

The app's main promise is a dashboard for production Change Failure Rate using SemVer release tags. Today the default regex accepts prerelease/build/suffixed tags, and the grouping logic can count both `15.3.1` and `v15.3.1` as separate patch failures. That makes the headline CFR easy to inflate or skew before a user ever sees the chart. This plan makes the default policy match the README and UI copy: exact `x.y.z` or `vx.y.z` production tags only, with aliases deduplicated by canonical version.

## Current state

- `README.md` defines the metric in terms of production deployment tags and patch hotfix tags:

```markdown
README.md:13
- Total Deployments: Every unique version tag pushed to production (e.g., v1.0.0, v1.1.0, v1.1.1)

README.md:14
- Failed Deployments: Generally, Patch releases (x.x.1, x.x.2) that are released shortly after a Major or Minor release to fix a bug
```

- `scripts/compute-cfr.ts` defaults to a suffix-inclusive pattern:

```ts
scripts/compute-cfr.ts:38
const DEFAULT_VERSION_PATTERN = String.raw`^v?\d+\.\d+\.\d+(?:[-+].+)?$`
```

- `src/lib/cfr.ts` parses only the numeric prefix after the broader regex accepts the tag:

```ts
src/lib/cfr.ts:24
const SEMVER_PREFIX = /^v?(\d+)\.(\d+)\.(\d+)/

src/lib/cfr.ts:26-35
function parseSemverTag(tag: string, versionRegex: RegExp): ParsedTag | null {
  if (!versionRegex.test(tag)) return null
  const match = tag.match(SEMVER_PREFIX)
  if (!match) return null
  return {
    name: tag,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}
```

- `src/lib/cfr.ts` appends every patch tag without deduping canonical aliases:

```ts
src/lib/cfr.ts:49-53
if (tag.patch === 0) {
  group.releaseTag = group.releaseTag ?? tag.name
} else {
  group.patchTags.push(tag)
}
```

- `src/lib/cfr.test.ts` currently codifies suffix-inclusive behavior:

```ts
src/lib/cfr.test.ts:4
const VERSION_REGEX = /^v?\d+\.\d+\.\d+(?:[-+].+)?$/

src/lib/cfr.test.ts:41-47
it("filters tags that do not match the version regex", () => {
  const result = computeReleaseCfr(["v1.0.0", "build-123", "v1.0.1-hotfix"], VERSION_REGEX)

  expect(result.totalReleases).toBe(1)
  expect(result.totalPatchFailures).toBe(1)
  expect(result.releases[0].patchTags).toEqual(["v1.0.1-hotfix"])
})
```

- `public/data/cfr.json` already contains suffixes and aliases in the generated report:

```json
public/data/cfr.json:216
"releaseTag": "16.0.0-beta.1"

public/data/cfr.json:162-163
"15.3.1",
"v15.3.1",
```

- Repo conventions: utilities live in `src/lib`, tests sit beside the code, and test names describe user-visible behavior. Match `src/lib/cfr.test.ts` style with `describe`, `it`, and `expect`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `bun run test:unit -- src/lib/cfr.test.ts scripts/compute-cfr.test.ts` | exit 0, relevant tests pass |
| Lint | `bun run lint` | exit 0 |
| Dead-code check | `bun run knip` | exit 0; existing redundant-entry hint is acceptable until Plan 003 |
| Full tests | `bun run test` | exit 0 |
| Dev build | `bun run build:dev` | exit 0 |
| Regenerate report | `bun run compute-cfr -- --repos repos.json --out public/data/cfr.json` | exit 0 and rewrites report |

## Scope

**In scope**:
- `src/lib/cfr.ts`
- `src/lib/cfr.test.ts`
- `scripts/compute-cfr.ts`
- `scripts/compute-cfr.test.ts`
- `README.md`
- `public/data/cfr.json`

**Out of scope**:
- Adding a UI toggle for tag policy. This plan fixes the default production policy only.
- Changing the CFR formula. Keep patch failures divided by releases plus patch failures.
- Replacing `git ls-remote` or adding concurrency. That performance work is deferred in `plans/README.md`.

## Git workflow

- Branch: `codex/001-tighten-production-semver-cfr`
- Commit message style: Conventional Commits. Use `fix(cfr): tighten production semver tag handling`.
- Do not push or open a PR unless instructed by the operator.

## Steps

### Step 1: Add regression tests for strict production tags

Update `src/lib/cfr.test.ts` so the shared test regex is strict production SemVer: `/^v?\d+\.\d+\.\d+$/`.

Replace the current suffix-inclusive test with cases that prove:
- `v1.0.1-hotfix`, `v1.0.1+build.1`, `v1.0.0-rc.1`, and `build-123` are ignored by the strict default regex.
- `v1.0.0` plus `v1.0.1` still yields one release and one patch failure.
- Duplicate aliases such as `v1.0.1` and `1.0.1` count as one patch failure, preserving the first tag encountered for display.
- Duplicate aliases such as `v1.0.0` and `1.0.0` count as one release, preserving the first release tag encountered.

Add or adjust `scripts/compute-cfr.test.ts` to assert that `parseArgs([]).versionPattern` equals the new strict default pattern string.

**Verify**: `bun run test:unit -- src/lib/cfr.test.ts scripts/compute-cfr.test.ts` -> tests should fail before implementation for the new strict/dedupe assertions.

### Step 2: Tighten parsing and dedupe aliases

In `scripts/compute-cfr.ts`, change `DEFAULT_VERSION_PATTERN` to:

```ts
const DEFAULT_VERSION_PATTERN = String.raw`^v?\d+\.\d+\.\d+$`
```

In `src/lib/cfr.ts`:
- Rename `SEMVER_PREFIX` to a stricter name such as `SEMVER_TAG`.
- Anchor it to the full tag shape: `/^v?(\d+)\.(\d+)\.(\d+)$/`.
- Add a canonical version field to `ParsedTag`, for example `version: `${major}.${minor}.${patch}``.
- Keep accepting the caller-provided `versionRegex`, but parse with the anchored SemVer matcher so suffixes cannot sneak through when the default policy is used.
- Deduplicate within each major/minor group by canonical version. A simple implementation is to track `seenVersions: Set<string>` in the group and skip tags already seen.
- Preserve the first encountered tag spelling for display (`v1.0.1` if it appears before `1.0.1`).

Do not use one-letter variable names. Keep exported types stable unless a test forces a shape change.

**Verify**: `bun run test:unit -- src/lib/cfr.test.ts scripts/compute-cfr.test.ts` -> all focused tests pass.

### Step 3: Align documentation and generated metadata

Update README text only where it clarifies the default tag policy. Add one sentence near the tagging strategy that says the default generator includes exact `x.y.z` and `vx.y.z` production tags and ignores prerelease/build/suffixed tags unless `--version-pattern` is explicitly overridden.

Update the `failureRule` string in `scripts/compute-cfr.ts` only if needed to avoid implying suffixes are included by default. Keep wording short and user-facing.

**Verify**: `bun run lint` -> exit 0.

### Step 4: Regenerate checked-in CFR data

Run the generator so `public/data/cfr.json` reflects the new default policy.

**Verify**: `bun run compute-cfr -- --repos repos.json --out public/data/cfr.json` -> exits 0 and prints `Wrote CFR report to public/data/cfr.json`.

Then spot-check the generated report:
- `rg -n 'releaseTag": ".*-' public/data/cfr.json` should not show prerelease/build suffixes introduced by the default pattern.
- `rg -n '"15\\.3\\.1"|"v15\\.3\\.1"' public/data/cfr.json` should not show both aliases in the same patch list.

### Step 5: Run the full repo gates

Run the quality gates in the repo's documented order.

**Verify**:
- `bun run lint` -> exit 0
- `bun run knip` -> exit 0; existing redundant-entry hint is acceptable until Plan 003
- `bun run test` -> exit 0
- `bun run build:dev` -> exit 0

## Test plan

- Update `src/lib/cfr.test.ts` with strict suffix filtering and alias dedupe cases.
- Update `scripts/compute-cfr.test.ts` with a default-pattern assertion for `parseArgs([])`.
- Model test style after the existing `computeReleaseCfr` and `parseArgs` tests in those files.
- Full verification is the repo's standard gates: lint, knip, test, build:dev.

## Done criteria

- [ ] Default version pattern in `scripts/compute-cfr.ts` is strict exact SemVer.
- [ ] `src/lib/cfr.ts` ignores suffixes under the default pattern and dedupes `v`/non-`v` aliases by canonical version.
- [ ] Tests cover prerelease/build/suffixed tag filtering and alias dedupe.
- [ ] `public/data/cfr.json` is regenerated with the new policy.
- [ ] `bun run lint`, `bun run knip`, `bun run test`, and `bun run build:dev` exit 0.
- [ ] No files outside the in-scope list are modified, except `plans/README.md` status if the executor updates it.

## STOP conditions

Stop and report back if:

- The current code at the cited lines no longer matches the excerpts.
- Product direction changes and the maintainer wants suffix-inclusive tags to remain the default.
- Regenerating `public/data/cfr.json` requires network access the operator cannot approve.
- The dedupe implementation appears to require changing the public JSON shape in `src/types/cfr.ts`.

## Maintenance notes

- If a future UI tag-policy selector is added, keep the production default strict and make suffix-inclusive behavior explicit in the UI.
- Reviewers should scrutinize the data diff: a lower CFR is expected when prerelease/suffixed tags stop counting, but unexpected disappearance of exact production tags is not.
- This plan intentionally does not add time-based DORA semantics; tag dates require a different data source than `git ls-remote --tags`.
