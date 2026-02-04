import { useEffect, useState, createContext, useContext, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage/system preference
  useEffect(() => {
    const initializeTheme = () => {
      let initialTheme: Theme = "light"
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("theme") as Theme | null
        if (stored) {
          initialTheme = stored
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          initialTheme = "dark"
        }
      }
      return initialTheme
    }
    
    const initialTheme = initializeTheme()
    // Theme initialization requires reading from localStorage/system preference
    // This is a one-time setup effect, not a cascading render issue
    setThemeState(initialTheme) // eslint-disable-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Apply theme class and persist to localStorage
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
