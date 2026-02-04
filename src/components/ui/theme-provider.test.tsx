import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import { ThemeProvider, useTheme } from "./theme-provider"

describe("ThemeProvider", () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    document.documentElement.classList.remove("dark")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove("dark")
  })

  function TestComponent() {
    const { theme, toggleTheme, setTheme } = useTheme()
    return (
      <div>
        <span data-testid="theme">{theme}</span>
        <button data-testid="toggle" onClick={toggleTheme}>
          Toggle
        </button>
        <button data-testid="set-light" onClick={() => setTheme("light")}>
          Set Light
        </button>
        <button data-testid="set-dark" onClick={() => setTheme("dark")}>
          Set Dark
        </button>
      </div>
    )
  }

  it("provides default light theme", async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })
  })

  it("toggles theme between light and dark", async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })
  })

  it("persists theme preference to localStorage", async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark")
    })
  })

  it("restores theme from localStorage on mount", async () => {
    localStorageMock.getItem.mockReturnValue("dark")

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    })
  })

  it("setTheme function changes theme directly", async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("set-dark"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId("set-light"))
    })

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })
  })

  it("applies dark class to document element when theme is dark", async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    expect(document.documentElement.classList.contains("dark")).toBe(false)

    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle"))
    })

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })
  })

  it("throws error when useTheme is used outside ThemeProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    function ComponentWithoutProvider() {
      useTheme()
      return <div>Test</div>
    }

    expect(() => {
      render(<ComponentWithoutProvider />)
    }).toThrow("useTheme must be used within a ThemeProvider")

    consoleSpy.mockRestore()
  })
})
