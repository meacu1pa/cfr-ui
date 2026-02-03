export type CfrRelease = {
  version: string
  releaseTag: string
  patchTags: string[]
  totalTags: number
  failedTags: number
  changeFailureRate: number
}

export type CfrRepo = {
  name: string
  url: string
  totalReleases: number
  totalPatchFailures: number
  changeFailureRate: number
  releases: CfrRelease[]
  error: string | null
}

export type CfrSummary = {
  totalRepos: number
  totalReleases: number
  totalPatchFailures: number
  changeFailureRate: number
}

export type CfrReport = {
  generatedAt: string
  failureRule: string
  versionPattern: string
  repos: CfrRepo[]
  summary: CfrSummary
}
