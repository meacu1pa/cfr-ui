import { useState } from "react"
import { Collapsible } from "@base-ui/react"
import { ChevronDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { CFR_BADGE_STYLES, chartConfig, getCfrBand, getLatestReleases } from "@/lib/cfr-ui"
import { formatPercent } from "@/lib/format"
import type { CfrRepo } from "@/types/cfr"

type CfrSignalsSectionProps = {
  repos: CfrRepo[]
}

export function CfrSignalsSection({ repos }: CfrSignalsSectionProps) {
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null)

  if (repos.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Signals</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {repos.map((repo) => {
          const latestReleases = getLatestReleases(repo.releases)
          const chartReleases = latestReleases.slice().reverse()
          const chartData = chartReleases.map((release) => ({
            release: release.releaseTag,
            cfr: release.changeFailureRate,
          }))

          return (
            <Card key={`${repo.url}-signals`}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">{repo.name}</CardTitle>
                <CardDescription>{repo.error ?? "CFR history by major/minor release (latest on the right)."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {repo.error ? (
                  <Badge variant="destructive">{repo.error}</Badge>
                ) : repo.releases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No major/minor releases found.</p>
                ) : (
                  <div className="space-y-4">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 0 }} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="release" tickLine={false} axisLine={false} tickMargin={8} />
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
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          dataKey="cfr"
                          type="monotone"
                          stroke="var(--color-cfr)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
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
                            className={`rounded-lg border transition-colors ${
                              isExpanded ? "border-border/60 bg-muted/30" : "border-border/60 hover:bg-muted/50"
                            }`}
                          >
                            <Collapsible.Trigger className="w-full cursor-pointer px-3 py-2">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
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
                                <div className="ml-6 space-y-1 border-l border-border/40 pl-3">
                                  {release.patchTags.map((patchTag) => (
                                    <div key={patchTag} className="text-xs font-mono text-muted-foreground">
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
  )
}
