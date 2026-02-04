import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ThemeProvider } from "./theme-provider"
import { ThemeToggle } from "./theme-toggle"

describe("ThemeToggle", () => {
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

  it("renders moon icon in light mode", async () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()
    })
  })

  it("renders sun icon in dark mode", async () => {
    localStorageMock.getItem.mockReturnValue("dark")

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument()
    })
  })

  it("toggles theme when clicked", async () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument()
    })
  })
})
