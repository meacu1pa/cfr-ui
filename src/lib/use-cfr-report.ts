import { useEffect, useState } from "react"
import type { CfrReport } from "@/types/cfr"

type UseCfrReportResult = {
  report: CfrReport | null
  error: string | null
  loading: boolean
}

export function useCfrReport(): UseCfrReportResult {
  const [report, setReport] = useState<CfrReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  return { report, error, loading }
}
