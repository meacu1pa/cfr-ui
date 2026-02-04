import type { ChartConfig } from "@/components/ui/chart"
import type { CfrRelease, CfrRepo } from "@/types/cfr"

export const chartConfig = {
  cfr: {
    label: "CFR",
    color: "var(--cfr-line)",
  },
} satisfies ChartConfig

export const trendChartConfig = {
  cfr: {
    label: "Average CFR",
    color: "var(--cfr-line)",
  },
} satisfies ChartConfig

export type CfrBand = "elite" | "high" | "medium" | "low"

export const CFR_BADGE_STYLES: Record<CfrBand, string> = {
  elite: "border-emerald-200/80 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-200",
  high: "border-blue-200/80 bg-blue-500/15 text-blue-700 dark:border-blue-500/40 dark:text-blue-200",
  medium: "border-amber-200/80 bg-amber-500/15 text-amber-700 dark:border-amber-500/40 dark:text-amber-200",
  low: "border-rose-200/80 bg-rose-500/15 text-rose-700 dark:border-rose-500/40 dark:text-rose-200",
}

export const CFR_TEXT_STYLES: Record<CfrBand, string> = {
  elite: "text-emerald-600 dark:text-emerald-300",
  high: "text-blue-600 dark:text-blue-300",
  medium: "text-amber-600 dark:text-amber-300",
  low: "text-rose-600 dark:text-rose-300",
}

export const CFR_BENCHMARKS = [
  { key: "elite", value: 0.05, label: "Elite 0–5%", color: "var(--cfr-elite)" },
  { key: "high", value: 0.15, label: "High 6–15%", color: "var(--cfr-high)" },
  { key: "medium", value: 0.3, label: "Medium 16–30%", color: "var(--cfr-medium)" },
] as const

export function getCfrBand(cfr: number): CfrBand {
  if (cfr <= 0.05) return "elite"
  if (cfr <= 0.15) return "high"
  if (cfr <= 0.3) return "medium"
  return "low"
}

export function getRepoStatus(repo: CfrRepo) {
  if (repo.error) return { label: "Error", variant: "destructive" as const }
  if (repo.totalReleases === 0) return { label: "No releases", variant: "secondary" as const }
  if (repo.totalPatchFailures === 0) return { label: "Healthy", variant: "secondary" as const }
  return { label: "Patching", variant: "default" as const }
}

export function getLatestReleases(releases: CfrRelease[], limit = 10) {
  const slice = releases.length <= limit ? releases : releases.slice(-limit)
  return slice.slice().reverse()
}
