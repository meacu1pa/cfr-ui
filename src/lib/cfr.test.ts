import { describe, expect, it } from "vitest"
import { computeReleaseCfr } from "@/lib/cfr"

const VERSION_REGEX = /^v?\d+\.\d+\.\d+(?:[-+].+)?$/

describe("computeReleaseCfr", () => {
  it("treats x.y.0 as a release and patches as failures", () => {
    const result = computeReleaseCfr(["v1.0.0", "v1.0.1", "v1.0.2"], VERSION_REGEX)

    expect(result.totalReleases).toBe(1)
    expect(result.totalPatchFailures).toBe(2)
    expect(result.changeFailureRate).toBeCloseTo(2 / 3, 4)
    expect(result.releases[0]).toMatchObject({
      version: "1.0.0",
      releaseTag: "v1.0.0",
      failedTags: 2,
      totalTags: 3,
    })
  })

  it("ignores patch-only streams without a .0 release", () => {
    const result = computeReleaseCfr(["v2.1.1", "v2.1.2"], VERSION_REGEX)

    expect(result.totalReleases).toBe(0)
    expect(result.totalPatchFailures).toBe(0)
    expect(result.releases).toHaveLength(0)
  })

  it("groups patches by major/minor release", () => {
    const result = computeReleaseCfr(
      ["v1.0.0", "v1.0.1", "v1.1.0", "v1.1.3", "v2.0.0"],
      VERSION_REGEX,
    )

    expect(result.totalReleases).toBe(3)
    expect(result.totalPatchFailures).toBe(2)
    expect(result.releases.map((release) => release.version)).toEqual(["1.0.0", "1.1.0", "2.0.0"])
    expect(result.releases[1].failedTags).toBe(1)
  })

  it("filters tags that do not match the version regex", () => {
    const result = computeReleaseCfr(["v1.0.0", "build-123", "v1.0.1-hotfix"], VERSION_REGEX)

    expect(result.totalReleases).toBe(1)
    expect(result.totalPatchFailures).toBe(1)
    expect(result.releases[0].patchTags).toEqual(["v1.0.1-hotfix"])
  })
})
