import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CFR_BENCHMARKS, getLatestReleases, trendChartConfig } from "@/lib/cfr-ui"
import { formatPercent } from "@/lib/format"
import type { CfrRepo } from "@/types/cfr"

type TrendPoint = {
  bucket: string
  cfr: number
  releaseIndex: number
}

const MAX_TREND_POINTS = 10

function buildTrendData(repos: CfrRepo[], limit: number): TrendPoint[] {
  const buckets = Array.from({ length: limit }, () => ({ sum: 0, count: 0 }))

  repos.forEach((repo) => {
    const latestReleases = getLatestReleases(repo.releases, limit)
    latestReleases.forEach((release, index) => {
      buckets[index].sum += release.changeFailureRate
      buckets[index].count += 1
    })
  })

  return buckets
    .map((bucket, index) => {
      if (bucket.count === 0) return null
      return {
        bucket: `R${index + 1}`,
        cfr: Number((bucket.sum / bucket.count).toFixed(4)),
        releaseIndex: index + 1,
      }
    })
    .filter((point): point is TrendPoint => Boolean(point))
    .reverse()
}

type CfrTrendSectionProps = {
  repos: CfrRepo[]
}

export function CfrTrendSection({ repos }: CfrTrendSectionProps) {
  const trendData = useMemo(() => buildTrendData(repos, MAX_TREND_POINTS), [repos])
  if (trendData.length === 0) return null

  return (
    <section>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">CFR Trend</CardTitle>
          <CardDescription>
            Shows the average CFR for the last 10 releases across all repositories. R1 is the most recent release.
            Dashed lines mark common benchmarks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendChartConfig} className="h-[260px] w-full">
            <LineChart data={trendData} margin={{ left: 12, right: 12, top: 12, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              {CFR_BENCHMARKS.map((benchmark) => (
                <ReferenceLine
                  key={benchmark.label}
                  y={benchmark.value}
                  stroke={benchmark.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: benchmark.label,
                    position: "insideLeft",
                    offset: 6,
                    fill: benchmark.color,
                    fontSize: 10,
                  }}
                />
              ))}
              <XAxis
                dataKey="bucket"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{
                  value: "Release sequence (R1 = latest)",
                  position: "insideBottom",
                  offset: -8,
                  className: "fill-muted-foreground text-xs",
                }}
              />
              <YAxis
                domain={[0, 1]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatPercent(Number(value))}
                label={{
                  value: "CFR",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  className: "fill-muted-foreground text-xs",
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const releaseIndex = payload?.[0]?.payload?.releaseIndex as number | undefined
                      if (!releaseIndex) return "Release"
                      return releaseIndex === 1 ? "Release 1 (latest)" : `Release ${releaseIndex} (recent)`
                    }}
                    formatter={(value) => formatPercent(Number(value))}
                  />
                }
              />
              <Line dataKey="cfr" type="monotone" stroke="var(--color-cfr)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  )
}
