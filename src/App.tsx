import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CfrReport, CfrRepo } from "@/types/cfr"
import { cn } from "@/lib/utils"
import "./App.css"

const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
})

const numberFormat = new Intl.NumberFormat("en-US")

function formatPercent(value: number) {
  return percentFormat.format(value)
}

function formatNumber(value: number) {
  return numberFormat.format(value)
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

function getRepoStatus(repo: CfrRepo) {
  if (repo.error) return { label: "Error", variant: "destructive" as const }
  if (repo.totalTags === 0) return { label: "No tags", variant: "secondary" as const }
  if (repo.failedTags === 0) return { label: "Healthy", variant: "secondary" as const }
  return { label: "Needs review", variant: "default" as const }
}

function App() {
  const [report, setReport] = useState<CfrReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch("/data/cfr.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Missing data file (HTTP ${response.status})`)
        }
        return response.json()
      })
      .then((data: CfrReport) => {
        if (!active) return
        setReport(data)
        setError(null)
      })
      .catch((err: Error) => {
        if (!active) return
        setError(err.message)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const summaryCards = useMemo(() => {
    if (!report) return []
    return [
      {
        label: "Total repos",
        value: formatNumber(report.summary.totalRepos),
        helper: "Repos included in summary",
      },
      {
        label: "Version tags",
        value: formatNumber(report.summary.totalTags),
        helper: "Semver-style tags",
      },
      {
        label: "Failed tags",
        value: formatNumber(report.summary.failedTags),
        helper: "Rollback, revert, hotfix, fix",
      },
      {
        label: "Change failure rate",
        value: formatPercent(report.summary.changeFailureRate),
        helper: "Failed tags / total tags",
      },
    ]
  }, [report])

  return (
    <div
      className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.14),transparent_55%),radial-gradient(circle_at_20%_35%,rgba(56,189,248,0.2),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.12))]"
      style={{ fontFamily: '"Space Grotesk","IBM Plex Sans","Segoe UI",sans-serif' }}
    >
      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="absolute left-6 top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-8 top-24 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

        <header className="relative space-y-3 animate-in fade-in duration-700">
          <p className="text-sm font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Git tag telemetry
          </p>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Change Failure Rate</h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Pulls release tags straight from git, flags rollback-like releases, and summarizes the failure
            rate across repos. Generate new data with{" "}
            <span className="font-mono text-foreground">bun run compute-cfr</span>.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Failure tags:</span>
            <Badge variant="outline">rollback</Badge>
            <Badge variant="outline">revert</Badge>
            <Badge variant="outline">hotfix</Badge>
            <Badge variant="outline">fix</Badge>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
          {summaryCards.map((card) => (
            <Card key={card.label} className="bg-card/80 backdrop-blur">
              <CardHeader className="space-y-1">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{card.helper}</CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Repositories</h2>
              <p className="text-sm text-muted-foreground">
                {report?.generatedAt ? `Last generated ${formatDate(report.generatedAt)}.` : "No data loaded yet."}
              </p>
            </div>
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>

          <Card className="overflow-hidden bg-card/80 backdrop-blur">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tags</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">CFR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Loading CFR data...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && error && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No CFR report found. Run{" "}
                        <span className="font-mono text-foreground">
                          bun run compute-cfr -- --repos repos.json --out public/data/cfr.json
                        </span>{" "}
                        to generate it.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && report?.repos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Add entries to <span className="font-mono text-foreground">repos.json</span> and regenerate the
                        report.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    !error &&
                    report?.repos.map((repo) => {
                      const status = getRepoStatus(repo)
                      return (
                        <TableRow key={repo.url}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{repo.name}</span>
                              <span className="text-xs text-muted-foreground">{repo.url}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(repo.totalTags)}</TableCell>
                          <TableCell className="text-right">{formatNumber(repo.failedTags)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatPercent(repo.changeFailureRate)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {!loading && report && report.repos.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Signals</span>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {report.repos.map((repo) => (
                <Card key={`${repo.url}-signals`} className="bg-card/80 backdrop-blur">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg">{repo.name}</CardTitle>
                    <CardDescription>{repo.error ?? "Latest version tags flagged below."}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {repo.error ? (
                      <Badge variant="destructive">{repo.error}</Badge>
                    ) : repo.tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No semver tags found.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {repo.tags.slice(0, 10).map((tag) => (
                          <Badge
                            key={tag.name}
                            variant={tag.isFailure ? "destructive" : "secondary"}
                            className={cn("text-xs", tag.isFailure && "shadow-sm")}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {repo.tags.length > 10 && (
                          <Badge variant="outline">+{repo.tags.length - 10} more</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
