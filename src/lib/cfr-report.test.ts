import { describe, expect, it } from "vitest"
import { parseCfrReport } from "@/lib/cfr-report"

const validReport = {
  generatedAt: "2026-02-03T00:00:00.000Z",
  failureRule: "Patch releases are failures.",
  versionPattern: String.raw`^v?\d+\.\d+\.\d+$`,
  repos: [
    {
      name: "repo",
      url: "https://example.com/repo.git",
      totalReleases: 1,
      totalPatchFailures: 1,
      changeFailureRate: 0.5,
      releases: [
        {
          version: "1.0.0",
          releaseTag: "v1.0.0",
          patchTags: ["v1.0.1"],
          totalTags: 2,
          failedTags: 1,
          changeFailureRate: 0.5,
        },
      ],
      error: null,
    },
  ],
  summary: {
    totalRepos: 1,
    totalReleases: 1,
    totalPatchFailures: 1,
    changeFailureRate: 0.5,
  },
}

describe("parseCfrReport", () => {
  it("returns valid CFR report data", () => {
    expect(parseCfrReport(validReport)).toBe(validReport)
  })

  it("rejects invalid top-level report data", () => {
    expect(() => parseCfrReport({ ...validReport, summary: null })).toThrow("Invalid CFR report data")
  })

  it("rejects invalid repo entries", () => {
    expect(() => parseCfrReport({ ...validReport, repos: [{ ...validReport.repos[0], error: 404 }] })).toThrow(
      "Invalid CFR report data",
    )
  })

  it("rejects invalid release entries", () => {
    expect(() =>
      parseCfrReport({
        ...validReport,
        repos: [
          {
            ...validReport.repos[0],
            releases: [{ ...validReport.repos[0].releases[0], patchTags: [1] }],
          },
        ],
      }),
    ).toThrow("Invalid CFR report data")
  })
})
