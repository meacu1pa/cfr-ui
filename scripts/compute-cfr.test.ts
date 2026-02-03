import { describe, expect, it } from "vitest"
import { buildReport, parseArgs } from "./compute-cfr"

describe("buildReport", () => {
  it("summarizes repos and computes the CFR rate", () => {
    const report = buildReport({
      generatedAt: "2026-02-03T00:00:00.000Z",
      versionPattern: "^v",
      repos: [
        {
          name: "alpha",
          url: "https://example.com/alpha.git",
          totalReleases: 2,
          totalPatchFailures: 1,
          changeFailureRate: 0.3333,
          releases: [],
          error: null,
        },
        {
          name: "beta",
          url: "https://example.com/beta.git",
          totalReleases: 0,
          totalPatchFailures: 0,
          changeFailureRate: 0,
          releases: [],
          error: "boom",
        },
      ],
    })

    expect(report.generatedAt).toBe("2026-02-03T00:00:00.000Z")
    expect(report.summary.totalRepos).toBe(1)
    expect(report.summary.totalReleases).toBe(2)
    expect(report.summary.totalPatchFailures).toBe(1)
    expect(report.summary.changeFailureRate).toBeCloseTo(1 / 3, 4)
  })
})

describe("parseArgs", () => {
  it("overrides defaults when flags are provided", () => {
    const options = parseArgs([
      "--repos",
      "repos.custom.json",
      "--out",
      "public/data/custom.json",
      "--version-pattern",
      "^v",
      "--help",
    ])

    expect(options).toEqual({
      reposPath: "repos.custom.json",
      outPath: "public/data/custom.json",
      versionPattern: "^v",
      showHelp: true,
    })
  })
})
