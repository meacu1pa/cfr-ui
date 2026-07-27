import { describe, expect, it } from "vitest"
import { buildReport, parseArgs, parseReposInput } from "./compute-cfr"

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
  it("defaults to exact production semver tags", () => {
    expect(parseArgs([]).versionPattern).toBe(String.raw`^v?\d+\.\d+\.\d+$`)
  })

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

describe("parseReposInput", () => {
  it("requires repos.json to contain an array", () => {
    expect(() => parseReposInput({ url: "https://example.com/repo.git" })).toThrow(
      "repos.json must contain an array",
    )
  })

  it("requires each entry to include a string url", () => {
    expect(() => parseReposInput([{ name: "repo" }])).toThrow(
      "repos.json entry 0 must include a non-empty string url",
    )
  })

  it("rejects blank urls", () => {
    expect(() => parseReposInput([{ url: "  " }])).toThrow(
      "repos.json entry 0 must include a non-empty string url",
    )
  })

  it("requires names to be strings when provided", () => {
    expect(() => parseReposInput([{ name: 123, url: "https://example.com/repo.git" }])).toThrow(
      "repos.json entry 0 name must be a string when provided",
    )
  })

  it("returns valid entries unchanged", () => {
    expect(
      parseReposInput([
        { name: "repo", url: "https://example.com/repo.git" },
        { url: "https://example.com/unnamed.git" },
      ]),
    ).toEqual([
      { name: "repo", url: "https://example.com/repo.git" },
      { url: "https://example.com/unnamed.git" },
    ])
  })
})
