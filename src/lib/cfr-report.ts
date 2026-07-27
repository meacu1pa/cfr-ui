import type { CfrRelease, CfrRepo, CfrReport, CfrSummary } from "@/types/cfr"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isCfrSummary(value: unknown): value is CfrSummary {
  return (
    isRecord(value) &&
    isFiniteNumber(value.totalRepos) &&
    isFiniteNumber(value.totalReleases) &&
    isFiniteNumber(value.totalPatchFailures) &&
    isFiniteNumber(value.changeFailureRate)
  )
}

function isCfrRelease(value: unknown): value is CfrRelease {
  return (
    isRecord(value) &&
    typeof value.version === "string" &&
    typeof value.releaseTag === "string" &&
    isStringArray(value.patchTags) &&
    isFiniteNumber(value.totalTags) &&
    isFiniteNumber(value.failedTags) &&
    isFiniteNumber(value.changeFailureRate)
  )
}

function isCfrRepo(value: unknown): value is CfrRepo {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.url === "string" &&
    isFiniteNumber(value.totalReleases) &&
    isFiniteNumber(value.totalPatchFailures) &&
    isFiniteNumber(value.changeFailureRate) &&
    Array.isArray(value.releases) &&
    value.releases.every(isCfrRelease) &&
    (typeof value.error === "string" || value.error === null)
  )
}

function isCfrReport(value: unknown): value is CfrReport {
  return (
    isRecord(value) &&
    typeof value.generatedAt === "string" &&
    typeof value.failureRule === "string" &&
    typeof value.versionPattern === "string" &&
    Array.isArray(value.repos) &&
    value.repos.every(isCfrRepo) &&
    isCfrSummary(value.summary)
  )
}

export function parseCfrReport(value: unknown): CfrReport {
  if (!isCfrReport(value)) {
    throw new Error("Invalid CFR report data")
  }

  return value
}
