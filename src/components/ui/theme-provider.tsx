import { useEffect, useLayoutEffect, useState, type ReactNode } from "react"
import { ThemeContext, type Theme } from "./theme-context"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light"

    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) return stored

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }

    return "light"
  })

  const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

  // Apply theme class and persist to localStorage
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}
