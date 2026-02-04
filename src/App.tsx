import { useEffect, useMemo, useState } from "react"
import { Collapsible } from "@base-ui/react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { CfrRelease, CfrReport, CfrRepo } from "@/types/cfr"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
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

const chartConfig = {
  cfr: {
    label: "CFR",
  },
} satisfies ChartConfig

type CfrBand = "elite" | "medium" | "low"

const CFR_BADGE_STYLES: Record<CfrBand, string> = {
  elite: "border-emerald-200/80 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-200",
  medium: "border-sky-200/80 bg-sky-500/15 text-sky-700 dark:border-sky-500/40 dark:text-sky-200",
  low: "border-rose-200/80 bg-rose-500/15 text-rose-700 dark:border-rose-500/40 dark:text-rose-200",
}

const CFR_TEXT_STYLES: Record<CfrBand, string> = {
  elite: "text-emerald-600 dark:text-emerald-300",
  medium: "text-sky-600 dark:text-sky-300",
  low: "text-rose-600 dark:text-rose-300",
}

function getCfrBand(cfr: number): CfrBand {
  if (cfr <= 0.15) return "elite"
  if (cfr <= 0.45) return "medium"
  return "low"
}

function getCfrBarColor(cfr: number) {
  const band = getCfrBand(cfr)
  if (band === "elite") return "var(--cfr-elite)"
  if (band === "medium") return "var(--cfr-medium)"
  return "var(--cfr-low)"
}

function getRepoStatus(repo: CfrRepo) {
  if (repo.error) return { label: "Error", variant: "destructive" as const }
  if (repo.totalReleases === 0) return { label: "No releases", variant: "secondary" as const }
  if (repo.totalPatchFailures === 0) return { label: "Healthy", variant: "secondary" as const }
  return { label: "Patching", variant: "default" as const }
}

function getLatestReleases(releases: CfrRelease[], limit = 10) {
  const slice = releases.length <= limit ? releases : releases.slice(-limit)
  return slice.slice().reverse()
}

function App() {
  const [report, setReport] = useState<CfrReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null)

  useEffect(() => {
    let active = true
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
        label: "Major/minor releases",
        value: formatNumber(report.summary.totalReleases),
        helper: "Tags ending in .0",
      },
      {
        label: "Patch failures",
        value: formatNumber(report.summary.totalPatchFailures),
        helper: "Patch tags counted as failures",
      },
      {
        label: "Change failure rate",
        value: formatPercent(report.summary.changeFailureRate),
        helper: "Patch failures / (releases + patch failures)",
      },
    ]
  }, [report])

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex items-start justify-between gap-4 animate-in fade-in duration-700">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.4em] text-muted-foreground">
              Git tag telemetry
            </p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Change Failure Rate</h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Pulls release tags straight from git, treats patch releases as failures, and summarizes the
              change failure rate across repos. Generate new data with{" "}
              <span className="font-mono text-foreground">bun run compute-cfr</span>.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Rule:</span>
              <Badge variant="outline">x.y.0 = release</Badge>
              <Badge variant="outline">x.y.z (z &gt; 0) = failure</Badge>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="space-y-1">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{card.helper}</CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Repositories</h2>
              <p className="text-sm text-muted-foreground">
                {report?.generatedAt ? `Last generated ${formatDate(report.generatedAt)}.` : "No data loaded yet."}
              </p>
            </div>
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Releases</TableHead>
                      <TableHead className="text-right">Patch failures</TableHead>
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
                          <TableCell className="text-right">{formatNumber(repo.totalReleases)}</TableCell>
                          <TableCell className="text-right">{formatNumber(repo.totalPatchFailures)}</TableCell>
                          <TableCell
                            className={`text-right font-semibold ${CFR_TEXT_STYLES[getCfrBand(repo.changeFailureRate)]}`}
                          >
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
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Signals</span>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                  {report.repos.map((repo) => {
                    const latestReleases = getLatestReleases(repo.releases)
                    const chartReleases = latestReleases.slice().reverse()
                    const chartData = chartReleases.map((release) => ({
                      release: release.releaseTag,
                      cfr: release.changeFailureRate,
                      fill: getCfrBarColor(release.changeFailureRate),
                    }))

                    return (
                      <Card key={`${repo.url}-signals`}>
                        <CardHeader className="space-y-1">
                          <CardTitle className="text-lg">{repo.name}</CardTitle>
                          <CardDescription>
                            {repo.error ?? "CFR history by major/minor release (latest on the right)."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {repo.error ? (
                            <Badge variant="destructive">{repo.error}</Badge>
                          ) : repo.releases.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No major/minor releases found.</p>
                          ) : (
                            <div className="space-y-4">
                              <ChartContainer config={chartConfig} className="h-24 w-full">
                                <BarChart data={chartData} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="release" hide />
                                  <YAxis domain={[0, 1]} hide />
                                  <ChartTooltip
                                    cursor={false}
                                    content={
                                      <ChartTooltipContent
                                        hideLabel
                                        formatter={(value, _name, item) => {
                                          const percent = formatPercent(Number(value))
                                          const release = item?.payload?.release as string | undefined
                                          return release ? `${release} · ${percent}` : percent
                                        }}
                                      />
                                    }
                                  />
                                  <Bar dataKey="cfr" radius={[4, 4, 0, 0]} maxBarSize={14}>
                                    {chartData.map((entry) => (
                                      <Cell key={entry.release} fill={entry.fill} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ChartContainer>
                              <div className="space-y-2">
                                {latestReleases.map((release) => {
                                  const releaseKey = `${repo.url}-${release.releaseTag}`
                                  const isExpanded = expandedRelease === releaseKey
                                  return (
                                    <Collapsible.Root
                                      key={`${releaseKey}-summary`}
                                      open={isExpanded}
                                      onOpenChange={() => {
                                        setExpandedRelease(isExpanded ? null : releaseKey)
                                      }}
                                      className={`rounded-lg border transition-colors ${isExpanded ? "border-border/60 bg-muted/30" : "border-border/60 hover:bg-muted/50"}`}
                                    >
                                      <Collapsible.Trigger className="w-full px-3 py-2 cursor-pointer">
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-2">
                                            <ChevronDown
                                              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                            <div className="flex flex-col text-left">
                                              <span className="text-sm font-semibold">{release.releaseTag}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {release.failedTags} patch{release.failedTags === 1 ? "" : "es"} · total{" "}
                                                {release.totalTags} tag{release.totalTags === 1 ? "" : "s"}
                                              </span>
                                            </div>
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className={`border ${CFR_BADGE_STYLES[getCfrBand(release.changeFailureRate)]}`}
                                          >
                                            {formatPercent(release.changeFailureRate)}
                                          </Badge>
                                        </div>
                                      </Collapsible.Trigger>
                                      <Collapsible.Panel>
                                        <div className="border-t border-border/40 px-3 pb-3 pt-2">
                                          <div className="ml-6 border-l border-border/40 pl-3 space-y-1">
                                            {release.patchTags.map((patchTag) => (
                                              <div key={patchTag} className="text-xs text-muted-foreground font-mono">
                                                └─ {patchTag}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </Collapsible.Panel>
                                    </Collapsible.Root>
                                  )
                                })}
                                {repo.releases.length > 10 && (
                                  <p className="text-xs text-muted-foreground">
                                    Showing latest 10 releases of {repo.releases.length}.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
