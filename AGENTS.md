# AGENTS.md - CFR-UI Development Guidelines

This file provides guidelines for agentic coding agents working in the CFR-UI React + TypeScript repository.

## Agent Instructions

- Run these checks after every change (in order): `bun run lint`, `bun run knip`, `bun run test`, `bun run build`.

## Technology Stack

- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4 with HMR
- **CSS**: Tailwind CSS 4.1.18 (Shadcn/ui-style utility patterns)
- **Package Manager**: Bun (bun.lock present)
- **UI Components**: Local Shadcn/ui-style components + `@base-ui/react` utilities
- **Charts**: Recharts

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
bun run test             # Run Vitest tests once
bun run test:watch       # Run Vitest in watch mode
```

**Note**: Tests run with Vitest; smoke tests live in `src/smoke.test.tsx`.

## Project Structure

```
src/
├── components/ui/        # Local UI components
├── lib/                 # Utilities + CFR logic
├── assets/              # Static assets
├── App.tsx             # Main application
├── main.tsx            # Entry point
└── index.css           # Tailwind CSS + tw-animate

scripts/
└── compute-cfr.ts       # CFR data generator
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
- Use absolute imports with `@/` alias for src files
- Group imports: External → Internal → Styles
- Named exports for utilities, default exports for main components

## TypeScript Guidelines

- **Strict mode enabled** - all files must be properly typed
- **Types or interfaces** are fine; be consistent within a file
- **Generic components** when appropriate
- **No implicit any** - always provide explicit types

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
- Use functional components (function declarations or arrow functions)
- Destructure props with defaults
- Forward refs when needed
- Use `cn()` utility for class merging

## Styling Guidelines

### Tailwind CSS

- Use utility classes for all styling
- Leverage CSS variables for theming
- Follow Tailwind's default naming conventions
- Use OKLCH color space (configured)

```typescript
// Good
className="flex items-center gap-2 p-4 rounded-lg bg-background border border-border"

// Bad
style={{ display: 'flex', padding: '1rem' }}
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

- Use TypeScript for compile-time safety
- Implement proper error boundaries for React components
- Handle async operations with try-catch blocks
- Provide meaningful error messages

```typescript
// Good
try {
  const data = await fetchData()
  setData(data)
} catch (error) {
  console.error('Failed to fetch data:', error)
  setError('Unable to load data')
}
```

## Linting Rules

ESLint is configured with:
- TypeScript recommended rules
- React hooks rules
- React refresh for HMR
- Browser environment target

**Always run `bun run lint`, `bun run knip`, `bun run test`, and `bun run build` before committing.**

## File Organization

- Keep components in `src/components/ui/` for reusable UI
- Use `src/lib/` for utilities and helpers
- One component per file
- Export types/interfaces from component files
- Avoid barrel exports unless they provide clear value

## Performance Considerations

- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders with useMemo/useCallback
- Leverage Vite's build optimizations

## Development Workflow

1. Run `bun run dev` (or `bun run dev:up`) for local development
2. Make changes following the style guidelines
3. Run `bun run lint`, `bun run knip`, `bun run test`, `bun run build`
4. Test components manually in the browser if the change affects UI

## Adding New Dependencies

```bash
# Add runtime dependency
bun add package-name

# Add dev dependency
bun add -D package-name

# Add Shadcn/ui component
bun add @radix-ui/react-component-name
```

Always check if similar functionality exists before adding new dependencies.

## Automation & CI

- CI runs on pull requests to `main` and executes: lint → knip → test → build.
- Dependabot checks dependencies daily for npm and GitHub Actions.

## Dark Mode

Dark mode is configured with class-based strategy:
- Add `.dark` class to `<html>` element
- Use Tailwind's `dark:` prefix for dark-specific styles
- Theme variables are available via CSS custom properties
