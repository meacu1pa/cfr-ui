import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatPercent } from "@/lib/format"
import type { CfrSummary } from "@/types/cfr"

type CfrSummaryCardsProps = {
  summary: CfrSummary | null
}

export function CfrSummaryCards({ summary }: CfrSummaryCardsProps) {
  if (!summary) return null

  const cards = [
    {
      label: "Total repos",
      value: formatNumber(summary.totalRepos),
      helper: "Repos included in summary",
    },
    {
      label: "Major/minor releases",
      value: formatNumber(summary.totalReleases),
      helper: "Tags ending in .0",
    },
    {
      label: "Patch failures",
      value: formatNumber(summary.totalPatchFailures),
      helper: "Patch tags counted as failures",
    },
    {
      label: "Change failure rate",
      value: formatPercent(summary.changeFailureRate),
      helper: "Patch failures / (releases + patch failures)",
    },
  ]

  return (
    <section className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="space-y-1">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-3xl">{card.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{card.helper}</CardContent>
        </Card>
      ))}
    </section>
  )
}
