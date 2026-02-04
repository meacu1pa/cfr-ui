import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CFR_TEXT_STYLES, getCfrBand, getRepoStatus } from "@/lib/cfr-ui"
import { formatDate, formatNumber, formatPercent } from "@/lib/format"
import type { CfrRepo } from "@/types/cfr"

type CfrRepoSectionProps = {
  generatedAt: string | null
  error: string | null
  loading: boolean
  repos: CfrRepo[]
}

export function CfrRepoSection({ generatedAt, error, loading, repos }: CfrRepoSectionProps) {
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
                    CFR report data is unavailable. Confirm the report is generated and available at{" "}
                    <span className="font-mono text-foreground">public/data/cfr.json</span>.
                  </TableCell>
                </TableRow>
              )}
              {!loading && !error && repos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Add entries to <span className="font-mono text-foreground">repos.json</span> to track more
                    repositories.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                repos.map((repo) => {
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
  )
}
