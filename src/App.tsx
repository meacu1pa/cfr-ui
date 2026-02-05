import { CfrRepoSection } from "@/components/cfr/CfrRepoSection"
import { CfrSignalsSection } from "@/components/cfr/CfrSignalsSection"
import { CfrSummaryCards } from "@/components/cfr/CfrSummaryCards"
import { CfrTrendSection } from "@/components/cfr/CfrTrendSection"
import { BackToTop } from "@/components/ui/back-to-top"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useCfrReport } from "@/lib/use-cfr-report"
import "./App.css"

function App() {
  const { report, error, loading } = useCfrReport()

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex items-start justify-between gap-4 animate-in fade-in duration-700">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.4em] text-muted-foreground">SemVer telemetry</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Change Failure Rate Checker</h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Pulls release tags straight from git, treats patch releases as failures, summarizes change failure
              rates across repositories.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Rule:</span>
              <Badge variant="outline">x.y.0 = release</Badge>
              <Badge variant="outline">x.y.z (z &gt; 0) = failure</Badge>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {report?.repos && report.repos.length > 0 && <CfrTrendSection repos={report.repos} />}

        <CfrSummaryCards summary={report?.summary ?? null} />

        <CfrRepoSection
          generatedAt={report?.generatedAt ?? null}
          error={error}
          loading={loading}
          repos={report?.repos ?? []}
        />

        {!loading && report && report.repos.length > 0 && <CfrSignalsSection repos={report.repos} />}
      </div>
      <BackToTop />
    </div>
  )
}

export default App
