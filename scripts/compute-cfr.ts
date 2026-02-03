import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

type RepoInput = {
  name?: string
  url: string
}

type CfrTag = {
  name: string
  isFailure: boolean
}

type CfrRepo = {
  name: string
  url: string
  totalTags: number
  failedTags: number
  changeFailureRate: number
  tags: CfrTag[]
  error: string | null
}

type CfrSummary = {
  totalRepos: number
  totalTags: number
  failedTags: number
  changeFailureRate: number
}

type CfrReport = {
  generatedAt: string
  failurePattern: string
  versionPattern: string
  repos: CfrRepo[]
  summary: CfrSummary
}

const DEFAULT_FAILURE_PATTERN = String.raw`(?:^|[-_])(rollback|revert|hotfix|fix)(?:$|[-_])`
const DEFAULT_VERSION_PATTERN = String.raw`^v?\d+\.\d+\.\d+(?:[-+].+)?$`

type CliOptions = {
  reposPath: string
  outPath: string
  failurePattern: string
  versionPattern: string
  showHelp: boolean
}

const DEFAULT_OPTIONS: CliOptions = {
  reposPath: "repos.json",
  outPath: "public/data/cfr.json",
  failurePattern: DEFAULT_FAILURE_PATTERN,
  versionPattern: DEFAULT_VERSION_PATTERN,
  showHelp: false,
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") {
      options.showHelp = true
      continue
    }
    if (arg === "--repos" && argv[i + 1]) {
      options.reposPath = argv[i + 1]
      i += 1
      continue
    }
    if (arg === "--out" && argv[i + 1]) {
      options.outPath = argv[i + 1]
      i += 1
      continue
    }
    if (arg === "--failure-pattern" && argv[i + 1]) {
      options.failurePattern = argv[i + 1]
      i += 1
      continue
    }
    if (arg === "--version-pattern" && argv[i + 1]) {
      options.versionPattern = argv[i + 1]
      i += 1
      continue
    }
  }
  return options
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(`Usage:
  bun run compute-cfr -- --repos repos.json --out public/data/cfr.json

Options:
  --repos <path>            Path to repos.json (default: repos.json)
  --out <path>              Output JSON path (default: public/data/cfr.json)
  --failure-pattern <regex> Override failure tag regex
  --version-pattern <regex> Override version tag regex
  -h, --help                Show this help
`)
}

function deriveNameFromUrl(url: string): string {
  const trimmed = url.replace(/\.git$/i, "")
  const lastSlash = trimmed.lastIndexOf("/")
  const lastColon = trimmed.lastIndexOf(":")
  const splitIndex = Math.max(lastSlash, lastColon)
  return splitIndex >= 0 ? trimmed.slice(splitIndex + 1) : trimmed
}

async function runGitTags(url: string): Promise<{ output: string; error: string | null }> {
  const proc = Bun.spawn(["git", "ls-remote", "--tags", url], {
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdoutText, stderrText, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  if (exitCode !== 0) {
    const message = stderrText.trim() || `git ls-remote failed with exit code ${exitCode}`
    return { output: "", error: message }
  }

  return { output: stdoutText, error: null }
}

function parseTags(output: string): string[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[1])
    .filter((ref) => ref && ref.startsWith("refs/tags/"))
    .filter((ref) => !ref.endsWith("^{}"))
    .map((ref) => ref.replace("refs/tags/", ""))
}

function rate(failed: number, total: number): number {
  if (total <= 0) return 0
  return Number((failed / total).toFixed(4))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.showHelp) {
    printHelp()
    return
  }

  const reposRaw = await readFile(options.reposPath, "utf8")
  const reposInput: RepoInput[] = JSON.parse(reposRaw)

  const failureRegex = new RegExp(options.failurePattern, "i")
  const versionRegex = new RegExp(options.versionPattern)

  const repos: CfrRepo[] = []

  for (const repo of reposInput) {
    const name = repo.name?.trim() || deriveNameFromUrl(repo.url)

    const { output, error } = await runGitTags(repo.url)

    if (error) {
      repos.push({
        name,
        url: repo.url,
        totalTags: 0,
        failedTags: 0,
        changeFailureRate: 0,
        tags: [],
        error,
      })
      continue
    }

    const allTags = parseTags(output).filter((tag) => versionRegex.test(tag))
    const tags: CfrTag[] = allTags.map((tag) => ({
      name: tag,
      isFailure: failureRegex.test(tag),
    }))
    const failedTags = tags.filter((tag) => tag.isFailure).length
    const totalTags = tags.length

    repos.push({
      name,
      url: repo.url,
      totalTags,
      failedTags,
      changeFailureRate: rate(failedTags, totalTags),
      tags,
      error: null,
    })
  }

  const reposForSummary = repos.filter((repo) => repo.error === null)
  const summaryTotalTags = reposForSummary.reduce((sum, repo) => sum + repo.totalTags, 0)
  const summaryFailedTags = reposForSummary.reduce((sum, repo) => sum + repo.failedTags, 0)

  const report: CfrReport = {
    generatedAt: new Date().toISOString(),
    failurePattern: options.failurePattern,
    versionPattern: options.versionPattern,
    repos,
    summary: {
      totalRepos: reposForSummary.length,
      totalTags: summaryTotalTags,
      failedTags: summaryFailedTags,
      changeFailureRate: rate(summaryFailedTags, summaryTotalTags),
    },
  }

  await mkdir(path.dirname(options.outPath), { recursive: true })
  await writeFile(options.outPath, JSON.stringify(report, null, 2), "utf8")
  // eslint-disable-next-line no-console
  console.log(`Wrote CFR report to ${options.outPath}`)
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
