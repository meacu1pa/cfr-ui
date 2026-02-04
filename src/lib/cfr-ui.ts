import type { ChartConfig } from "@/components/ui/chart"
import type { CfrRelease, CfrRepo } from "@/types/cfr"

export const chartConfig = {
  cfr: {
    label: "CFR",
  },
} satisfies ChartConfig

export type CfrBand = "elite" | "medium" | "low"

export const CFR_BADGE_STYLES: Record<CfrBand, string> = {
  elite: "border-emerald-200/80 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-200",
  medium: "border-sky-200/80 bg-sky-500/15 text-sky-700 dark:border-sky-500/40 dark:text-sky-200",
  low: "border-rose-200/80 bg-rose-500/15 text-rose-700 dark:border-rose-500/40 dark:text-rose-200",
}

export const CFR_TEXT_STYLES: Record<CfrBand, string> = {
  elite: "text-emerald-600 dark:text-emerald-300",
  medium: "text-sky-600 dark:text-sky-300",
  low: "text-rose-600 dark:text-rose-300",
}

export function getCfrBand(cfr: number): CfrBand {
  if (cfr <= 0.15) return "elite"
  if (cfr <= 0.45) return "medium"
  return "low"
}

export function getCfrBarColor(cfr: number) {
  const band = getCfrBand(cfr)
  if (band === "elite") return "var(--cfr-elite)"
  if (band === "medium") return "var(--cfr-medium)"
  return "var(--cfr-low)"
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
