# Change Failure Rate UI

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/CNtUwe?referralCode=uZ7wW9&utm_medium=integration&utm_source=template&utm_campaign=generic)

This app provides a simple dashboard for CFR statistics across multiple repositories. The data is downloaded once and can then be compiled into a React app using Vite.

The Change Failure Rate (CFR) is one of the four key DORA metrics (also known as the "Four Keys") used to measure the performance of software development teams. While metrics like Deployment Frequency measure velocity (speed), Change Failure Rate specifically measures stability (quality). It is the percentage of deployments to production that result in a failure - such as a bug, service degradation, or system outage that requires immediate remediation (e.g. a rollback, hotfix or patch).

## Mapping SemVer to "Failure"

In a standard SemVer scheme (Major.Minor.Patch), you can distinguish between planned feature work and reactive fixes. To calculate CFR, you need to identify which deployments were "failures."

- Total Deployments: Every unique version tag pushed to production (e.g., v1.0.0, v1.1.0, v1.1.1)
- Failed Deployments: Generally, Patch releases (x.x.1, x.x.2) that are released shortly after a Major or Minor release to fix a bug

> Note: Not every patch is a "failure" (some are scheduled maintenance), but in a DORA context, any "hotfix" or "unplanned remediation" is a failure. SemVer also recommends treating maintenance releases as minor.

### Tagging Strategy

Ensure your team uses a consistent tagging pattern. For example:

- v1.2.0: A new feature or maintenance release (Minor).
- v1.2.1: A hotfix for a bug found in v1.2.0 (Patch).

| Version | Type | Status | Counted As... |
| :--- | :--- | :--- | :--- |
| `v2.1.0` | Minor | Success | Total Deployment |
| `v2.1.1` | Patch | **Failure** | Failed Deployment (Hotfix) |
| `v2.2.0` | Minor | Success | Total Deployment |
| **Result** | | **33% CFR** | (1 failure / 3 total) |

## CFR Data Workflow

1. Add your repositories to `repos.json` (name is optional):

   ```javascript
   [
     { "name": "react", "url": "https://github.com/facebook/react.git" }
   ]
   ```

2. Generate the CFR report and start the app:

   ```bash
   bun run dev:up
   ```

   Then open the local URL shown in the terminal (typically `http://localhost:5173`).

If you want to run the steps manually:

```bash
bun run compute-cfr -- --repos repos.json --out public/data/cfr.json
bun run dev
```

## Build Commands

- `bun run build:dev`: Fast local build validation (type-check + Vite build) without recomputing CFR data.
- `bun run build`: Release/deploy build (type-check + CFR recompute + Vite build).

## Docker Compose (No Local Bun Required)

This repo includes a Bun-based Docker setup so you can develop and run quality gates without installing Bun on your host machine.

1. Start the dev server in Docker:

   ```bash
   docker compose up -d
   ```

2. Open the app at:

   ```text
   http://localhost:5173
   ```

Run any project script in the same container image:

```bash
docker compose run --rm app bun run lint
docker compose run --rm app bun run knip
docker compose run --rm app bun run test
docker compose run --rm app bun run build:dev
docker compose run --rm app bun run build
```

Open an interactive shell in the container:

```bash
docker compose exec app sh
```

Notes:

- The container uses the official Bun image: `oven/bun`.
- Dependencies are installed inside the container on startup via `bun install --frozen-lockfile` (configured directly in `docker-compose.yml`).
