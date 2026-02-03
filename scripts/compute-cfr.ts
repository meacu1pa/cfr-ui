import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { RepoCfrResult } from "@/lib/cfr"
import { computeReleaseCfr } from "@/lib/cfr"

type RepoInput = {
  name?: string
  url: string
}

type CfrRelease = RepoCfrResult["releases"][number]

type CfrRepo = RepoCfrResult & {
  name: string
  url: string
  error: string | null
}

type CfrSummary = {
  totalRepos: number
  totalReleases: number
  totalPatchFailures: number
  changeFailureRate: number
}

type CfrReport = {
  generatedAt: string
  failureRule: string
  versionPattern: string
  repos: CfrRepo[]
  summary: CfrSummary
}

type BuildReportOptions = {
  generatedAt?: string
  versionPattern: string
  repos: CfrRepo[]
}

const DEFAULT_VERSION_PATTERN = String.raw`^v?\d+\.\d+\.\d+(?:[-+].+)?$`

type CliOptions = {
  reposPath: string
  outPath: string
  versionPattern: string
  showHelp: boolean
}

const DEFAULT_OPTIONS: CliOptions = {
  reposPath: "repos.json",
  outPath: "public/data/cfr.json",
  versionPattern: DEFAULT_VERSION_PATTERN,
  showHelp: false,
}

export function parseArgs(argv: string[]): CliOptions {
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

export function buildReport(options: BuildReportOptions): CfrReport {
  const reposForSummary = options.repos.filter((repo) => repo.error === null)
  const summaryTotalReleases = reposForSummary.reduce((sum, repo) => sum + repo.totalReleases, 0)
  const summaryPatchFailures = reposForSummary.reduce((sum, repo) => sum + repo.totalPatchFailures, 0)
  const summaryTotalTags = summaryTotalReleases + summaryPatchFailures

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    failureRule: "Patch releases (x.y.z where z > 0) are failures; x.y.0 counts as a release.",
    versionPattern: options.versionPattern,
    repos: options.repos,
    summary: {
      totalRepos: reposForSummary.length,
      totalReleases: summaryTotalReleases,
      totalPatchFailures: summaryPatchFailures,
      changeFailureRate: rate(summaryPatchFailures, summaryTotalTags),
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.showHelp) {
    printHelp()
    return
  }

  const reposRaw = await readFile(options.reposPath, "utf8")
  const reposInput: RepoInput[] = JSON.parse(reposRaw)

  const versionRegex = new RegExp(options.versionPattern)

  const repos: CfrRepo[] = []

  for (const repo of reposInput) {
    const name = repo.name?.trim() || deriveNameFromUrl(repo.url)

    const { output, error } = await runGitTags(repo.url)

    if (error) {
      repos.push({
        name,
        url: repo.url,
        totalReleases: 0,
        totalPatchFailures: 0,
        changeFailureRate: 0,
        releases: [],
        error,
      })
      continue
    }

    const tags = parseTags(output)
    const repoResult = computeReleaseCfr(tags, versionRegex)

    repos.push({
      name,
      url: repo.url,
      totalReleases: repoResult.totalReleases,
      totalPatchFailures: repoResult.totalPatchFailures,
      changeFailureRate: repoResult.changeFailureRate,
      releases: repoResult.releases,
      error: null,
    })
  }

  const report = buildReport({
    repos,
    versionPattern: options.versionPattern,
  })

  await mkdir(path.dirname(options.outPath), { recursive: true })
  await writeFile(options.outPath, JSON.stringify(report, null, 2), "utf8")
  // eslint-disable-next-line no-console
  console.log(`Wrote CFR report to ${options.outPath}`)
}

if (import.meta.main) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
