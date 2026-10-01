# Ifty portfolio: GitHub Pages deployment

Upload the **contents of this extracted folder** to the root of a GitHub repository with the default branch named `main`. Preserve the paths `.github/workflows/pages.yml`, `.github/scripts/sync-scholar.mjs`, `site/index.html`, and `site/data/scholar-citations.json`.

1. Get a SerpApi API key for the Google Scholar Author API. In repository **Settings → Secrets and variables → Actions → New repository secret**, create `SERPAPI_KEY`. Do not put the value in a file or screenshot.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. In **Actions → Portfolio and Scholar citations → Run workflow**, choose `main` and run it once. Inspect `prepare` and `deploy` for green checks. The Pages URL appears in **Settings → Pages**.
4. Open `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/data/scholar-citations.json` (substitute your own Pages URL). A successful initial check returns a verified `citations`, `checked_at`, and `profile_url`. On the portfolio, the number appears in the introduction next to “Reported Google Scholar citations.”

The workflow checks once daily at 00:17 UTC and deploys the last verified result. Ordinary edits to `main` also redeploy the site. It uses `GITHUB_TOKEN` to preserve the checked JSON, then deploys the Pages artifact in the same run, because a bot-authored commit alone does not start a branch-based Pages build. Only the generated JSON is public; the API key stays in the repository secret.

The initial `site/data/scholar-citations.json` is intentionally unavailable. Until the first successful check, the readable offline 132 snapshot in the HTML remains. Provider errors stop the workflow before replacing the site; the last verified live deployment remains available. Google Scholar may itself register citations with a delay, and GitHub's scheduled runs may also start later than the specified time. This is a daily synchronization, not an instantaneous link to Scholar.

No npm, build tools, server functions, or additional hosting service are needed for this package. `site/index.html` also opens locally, with its static offline citation snapshot. The linked CV is embedded in the HTML.
