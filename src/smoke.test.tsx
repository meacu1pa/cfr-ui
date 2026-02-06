import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import { build } from "vite"
import { mkdtemp, rm, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import App from "@/App"
import { ThemeProvider } from "@/components/ui/theme-provider"

describe("smoke", () => {
  it("renders the app shell", () => {
    const html = renderToString(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )

    expect(html).toContain("Change Failure Rate UI")
    expect(html).toContain("SemVer telemetry")
  })

  it("builds the site", { timeout: 120_000 }, async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const root = path.resolve(__dirname, "..")
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cfr-ui-build-"))

    try {
      await build({
        root,
        configFile: path.join(root, "vite.config.ts"),
        logLevel: "error",
        build: {
          outDir,
          emptyOutDir: true,
          sourcemap: false,
        },
      })

      const indexStats = await stat(path.join(outDir, "index.html"))
      expect(indexStats.isFile()).toBe(true)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})
