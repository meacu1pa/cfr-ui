export type CfrTag = {
  name: string
  isFailure: boolean
}

export type CfrRepo = {
  name: string
  url: string
  totalTags: number
  failedTags: number
  changeFailureRate: number
  tags: CfrTag[]
  error: string | null
}

export type CfrSummary = {
  totalRepos: number
  totalTags: number
  failedTags: number
  changeFailureRate: number
}

export type CfrReport = {
  generatedAt: string
  failurePattern: string
  versionPattern: string
  repos: CfrRepo[]
  summary: CfrSummary
}
