# AGENTS.md - CFR-UI Development Guidelines

Guidelines for agentic coding agents working in the CFR-UI React + TypeScript repository.

## Operating Expectations

- Run quality gates after every change (in order): `bun run lint`, `bun run knip`, `bun run test`, `bun run build`.
- Before committing, update documentation when changes affect behavior, workflows, or architecture.
- Commit messages must be meaningful and follow semver-aligned conventions (e.g., `feat:`, `fix:`, `chore:`, `refactor:`).
- Capture meaningful learnings during a session (architectural decisions, solved problems, new patterns). Document and discourage antipatterns when discovered.

## Technology Stack

- **Framework**: React 19.2.4 + TypeScript (strict)
- **Build Tool**: Vite 7.3.1 with HMR
- **CSS**: Tailwind CSS 4.1.18 (Shadcn/ui-style utility patterns)
- **Package Manager**: Bun (bun.lock present)
- **UI Components**: Local Shadcn/ui-style components + `@base-ui/react` utilities
- **Charts**: Recharts 3.7.0
- **Testing**: Vitest 4.0.18 + Testing Library

## Development Commands

```bash
# Development
bun run dev              # Start dev server with HMR
bun run dev:up           # Recompute CFR data then start dev server

# Building
bun run build            # Production build (TypeScript + Vite)
bun run preview          # Preview production build locally
bun run compute-cfr      # Generate CFR report JSON

# Code Quality
bun run lint             # Run ESLint on all TypeScript files
bun run knip             # Dead-code/unused export checks
bun run test             # Run Vitest tests once (unit + smoke)
bun run test:unit        # Run unit tests only
bun run test:smoke       # Run smoke tests only
bun run test:watch       # Run Vitest in watch mode
```

**Note**: Smoke tests live in `src/smoke.test.tsx` and use `vitest.smoke.config.ts`.

## Project Structure

```
src/
├── components/cfr/       # CFR-specific UI sections
├── components/ui/        # Reusable UI components + theme utilities
├── lib/                  # Utilities + CFR logic
├── assets/               # Static assets
├── types/                # Shared types
├── App.tsx               # Main application
├── main.tsx              # Entry point
└── index.css             # Tailwind CSS + tw-animate

public/
└── data/cfr.json         # Generated CFR report data

scripts/
└── compute-cfr.ts        # CFR data generator
```

## Import Conventions

```typescript
// External imports first
import { useEffect } from "react"
import { BarChart } from "recharts"

// Internal imports with @ alias
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Styles last
import "./App.css"
```

**Rules**:
- Use absolute imports with `@/` alias for `src` files.
- Group imports: External → Internal → Styles.
- Named exports for utilities, default exports for main components.

## TypeScript Guidelines

- **Strict mode enabled** - all files must be properly typed.
- **Types or interfaces** are fine; be consistent within a file.
- **Generic components** when appropriate.
- **No implicit any** - always provide explicit types.

```typescript
// Good
type CardProps = React.ComponentProps<"div"> & {
  tone?: "default" | "muted"
}

// Bad
function Card(props: any) { /* ... */ }
```

## Component Development

### Shadcn/ui Patterns

```typescript
// Use class-variance-authority for variants
const cardVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Component Structure

```typescript
function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-xl border", className)} {...props} />
}
```

**Rules**:
- Use functional components (function declarations or arrow functions).
- Destructure props with defaults.
- Forward refs when needed.
- Use `cn()` utility for class merging.

## Styling Guidelines

### Tailwind CSS

- Use utility classes for all styling.
- Leverage CSS variables for theming.
- Follow Tailwind's default naming conventions.
- Use OKLCH color space (configured).
- Avoid inline styles unless required for dynamic values.

```typescript
// Good
className="flex items-center gap-2 p-4 rounded-lg bg-background border border-border"

// Bad
style={{ display: "flex", padding: "1rem" }}
```

### Responsive Design

```typescript
// Mobile-first approach
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

## Naming Conventions

- **Components**: PascalCase (Button, UserProfile)
- **Files**: kebab-case for utilities, PascalCase for components
- **Functions**: camelCase (formatDate, calculateTotal)
- **Variables**: camelCase (isLoading, userCount)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **CSS Classes**: Tailwind utilities only

## Error Handling

- Use TypeScript for compile-time safety.
- Implement proper error boundaries for React components when needed.
- Handle async operations with try-catch blocks.
- Provide meaningful error messages.

```typescript
// Good
try {
  const data = await fetchData()
  setData(data)
} catch (error) {
  console.error("Failed to fetch data:", error)
  setError("Unable to load data")
}
```

## File Organization

- Keep reusable UI in `src/components/ui/`.
- Keep CFR feature UI in `src/components/cfr/`.
- Use `src/lib/` for utilities and helpers.
- One component per file.
- Export types/interfaces from component files.
- Avoid barrel exports unless they provide clear value.

## Performance Considerations

- Use React.memo for expensive components.
- Implement proper dependency arrays in `useEffect`.
- Avoid unnecessary re-renders with `useMemo`/`useCallback`.
- Leverage Vite build optimizations.

## Dark Mode

Dark mode uses a class-based strategy:
- `ThemeProvider` manages theme state and `<html>` class toggling.
- `useTheme` hook lives in `src/components/ui/use-theme.ts`.
- Use Tailwind's `dark:` prefix for dark-specific styles.
- Theme variables are available via CSS custom properties.
- System preference detection via `prefers-color-scheme` media query.
- User preference persists to `localStorage`.

## Testing

### Test Configuration

- **Unit tests**: jsdom environment (`vitest.config.ts`).
- **Smoke tests**: node environment (`vitest.smoke.config.ts`).
- **Setup**: mock localStorage and matchMedia in `src/test-setup.ts`.

### Component Testing

Use `@testing-library/react` for component tests:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { MyComponent } from "./my-component"

it("renders correctly", async () => {
  render(
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  )

  await waitFor(() => {
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

## Automation & CI

- CI runs on PRs to `main`: lint → knip → test → build.
- Dependabot checks dependencies daily for npm and GitHub Actions.

## Session Learnings (Append)

When you learn something meaningful, append a short entry here:
- `YYYY-MM-DD: <learning or decision>`
- If discouraging an antipattern, note the replacement pattern.

- `2026-02-05: Split Vite vendor chunks by library group (charts/base-ui/icons) and keep React in the shared vendor chunk to avoid circular chunk warnings.`
