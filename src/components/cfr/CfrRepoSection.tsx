import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CFR_TEXT_STYLES, getCfrBand, getRepoSignalId } from "@/lib/cfr-ui"
import { formatDate, formatNumber, formatPercent } from "@/lib/format"
import type { CfrRepo } from "@/types/cfr"

type CfrRepoSectionProps = {
  generatedAt: string | null
  error: string | null
  loading: boolean
  repos: CfrRepo[]
}

export function CfrRepoSection({ generatedAt, error, loading, repos }: CfrRepoSectionProps) {
  const scrollToRepoSignals = (repo: CfrRepo) => {
    const target = document.getElementById(getRepoSignalId(repo))
    if (!target) return
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const sortedRepos = repos.slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Repositories</h2>
          <p className="text-sm text-muted-foreground">
            {generatedAt ? `Last generated ${formatDate(generatedAt)}.` : "No data loaded yet."}
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
                <TableHead className="text-right">Releases</TableHead>
                <TableHead className="text-right">Patch failures</TableHead>
                <TableHead className="text-right">CFR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Loading CFR data...
                  </TableCell>
                </TableRow>
              )}
              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    CFR report data is unavailable. Confirm the report is generated and available at{" "}
                    <span className="font-mono text-foreground">public/data/cfr.json</span>.
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && repos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Add entries to <span className="font-mono text-foreground">repos.json</span> to track more
                    repositories.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                sortedRepos.map((repo) => {
                  return (
                    <TableRow
                      key={repo.url}
                      tabIndex={0}
                      onClick={() => {
                        scrollToRepoSignals(repo)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          scrollToRepoSignals(repo)
                        }
                      }}
                      aria-label={`Scroll to ${repo.name} signals`}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{repo.name}</span>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => {
                              event.stopPropagation()
                            }}
                            onKeyDown={(event) => {
                              event.stopPropagation()
                            }}
                            className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            {repo.url}
                          </a>
                        </div>
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
  )
}
