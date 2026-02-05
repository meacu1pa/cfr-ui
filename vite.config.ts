import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return
          if (id.includes("/node_modules/recharts/")) return "charts"
          if (id.includes("/node_modules/@base-ui/")) return "base-ui"
          if (id.includes("/node_modules/lucide-react/")) return "icons"
          return "vendor"
        },
      },
    },
  },
})
