# Copilot Usage Monitor

Small repo to monitor GitHub Copilot (personal) usage and publish a simple dashboard via GitHub Pages.

Features
- Daily GitHub Action that fetches Copilot usage/billing endpoints and writes `usage.json`.
- Static dashboard (Pages) that reads `usage.json` and shows current usage, percent used, and recent history.
- Optional alerting: creates a GitHub Issue when usage exceeds a configurable threshold.

Security
- Do NOT store PATs in the repo. The action expects a repository secret named `USAGE_MONITOR_PAT` (scopes: repo, workflow).
- The push script will prompt for a PAT locally and set the secret via the GitHub CLI (gh). You can alternatively set the secret in the repo settings UI.

Quick local push (Windows PowerShell)
1. Install gh CLI and authenticate: `gh auth login`.
2. From this folder run: `.	ools\create_and_push.ps1` and follow prompts.

What I created
- src/fetcher.js — Node script used by the Action to call the GitHub API and emit `usage.json`.
- web/index.html — Dashboard UI.
- .github/workflows/fetch-usage.yml — Main Action to run daily and write `usage.json` to the `gh-pages` branch.
- .github/workflows/publish-pages.yml — Deploy the `gh-pages` branch to GitHub Pages.
- tools/create_and_push.ps1 — Push script that creates the repo and sets the secret (runs locally).

Defaults
- Repo name: `copilot-usage-monitor`
- Alert threshold: 80% (Action will create an issue when percent_used >= threshold)

If anything needs changing (threshold, schedule), edit `.github/workflows/fetch-usage.yml`.
