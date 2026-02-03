export type ParsedTag = {
  name: string
  major: number
  minor: number
  patch: number
}

export type CfrRelease = {
  version: string
  releaseTag: string
  patchTags: string[]
  totalTags: number
  failedTags: number
  changeFailureRate: number
}

export type RepoCfrResult = {
  totalReleases: number
  totalPatchFailures: number
  changeFailureRate: number
  releases: CfrRelease[]
}

const SEMVER_PREFIX = /^v?(\d+)\.(\d+)\.(\d+)/

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

export function computeReleaseCfr(tags: string[], versionRegex: RegExp): RepoCfrResult {
  const parsedTags = tags
    .map((tag) => parseSemverTag(tag, versionRegex))
    .filter((tag): tag is ParsedTag => Boolean(tag))

  const groups = new Map<string, { major: number; minor: number; releaseTag: string | null; patchTags: ParsedTag[] }>()

  for (const tag of parsedTags) {
    const key = `${tag.major}.${tag.minor}`
    const group = groups.get(key) ?? { major: tag.major, minor: tag.minor, releaseTag: null, patchTags: [] }

    if (tag.patch === 0) {
      group.releaseTag = group.releaseTag ?? tag.name
    } else {
      group.patchTags.push(tag)
    }

    groups.set(key, group)
  }

  const releases = Array.from(groups.values())
    .filter((group) => group.releaseTag)
    .sort((a, b) => (a.major !== b.major ? a.major - b.major : a.minor - b.minor))
    .map((group) => {
      const patchTags = group.patchTags
        .sort((a, b) => a.patch - b.patch)
        .map((tag) => tag.name)
      const failedTags = patchTags.length
      const totalTags = failedTags + 1
      return {
        version: `${group.major}.${group.minor}.0`,
        releaseTag: group.releaseTag ?? `${group.major}.${group.minor}.0`,
        patchTags,
        totalTags,
        failedTags,
        changeFailureRate: rate(failedTags, totalTags),
      }
    })

  const totalReleases = releases.length
  const totalPatchFailures = releases.reduce((sum, release) => sum + release.failedTags, 0)
  const overallTotalTags = totalReleases + totalPatchFailures

  return {
    totalReleases,
    totalPatchFailures,
    changeFailureRate: rate(totalPatchFailures, overallTotalTags),
    releases,
  }
}

function rate(failed: number, total: number): number {
  if (total <= 0) return 0
  return Number((failed / total).toFixed(4))
}
