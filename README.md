# Change Failure Rate UI

Change Failure Rate (CFR) is one of the four key DORA metrics (also known as the "Four Keys") used to measure the performance of software development teams. While metrics like Deployment Frequency measure velocity (speed), Change Failure Rate specifically measures stability (quality). It is the percentage of deployments to production that result in a failure - such as a bug, service degradation, or system outage that requires immediate remediation (e.g. a rollback, hotfix or patch).

## Mapping SemVer to "Failure"

In a standard SemVer scheme (Major.Minor.Patch), you can distinguish between planned feature work and reactive fixes. To calculate CFR, you need to identify which deployments were "failures."

- Total Deployments: Every unique version tag pushed to production (e.g., v1.0.0, v1.1.0, v1.1.1)
- Failed Deployments: Generally, Patch releases (x.x.1, x.x.2) that are released shortly after a Major or Minor release to fix a bug

> Note: Not every patch is a "failure" (some are scheduled maintenance), but in a DORA context, any "hotfix" or "unplanned remediation" is a failure.

### Tagging Strategy

Ensure your team uses a consistent tagging pattern. For example:

- v1.2.0: A new feature (Minor).
- v1.2.1: A hotfix for a bug found in v1.2.0 (Patch).

| Version | Type | Status | Counted As... |
| :--- | :--- | :--- | :--- |
| `v2.1.0` | Minor | Success | Total Deployment |
| `v2.1.1` | Patch | **Failure** | Failed Deployment (Hotfix) |
| `v2.2.0` | Minor | Success | Total Deployment |
| **Result** | | **33% CFR** | (1 failure / 3 total) |

## Tech Stack: React + TypeScript + Vite + shadcn/ui

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## CFR Data Workflow

1. Add your repositories to `repos.json` (name optional):
   ```
   [
     { "name": "react", "url": "https://github.com/facebook/react.git" }
   ]
   ```
2. Generate the CFR report and start the app:
   ```
   bun run dev:up
   ```
   Then open the local URL shown in the terminal (typically `http://localhost:5173`).

If you want to run the steps manually:
```
bun run compute-cfr -- --repos repos.json --out public/data/cfr.json
bun run dev
```

## Theme Support

The UI supports both light and dark modes:

- **Automatic detection**: On first visit, the app detects your browser/system preference using `prefers-color-scheme`
- **Manual toggle**: Use the sun/moon button in the top-right corner to switch themes
- **Persistence**: Your preference is saved to localStorage and restored on subsequent visits

The theme system uses CSS variables and Tailwind's `dark:` modifier for consistent styling across both modes.

## Tests

Run the unit tests with:
```
bun run test
```

For watch mode:
```
bun run test:watch
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
