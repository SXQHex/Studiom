// Production deploys happen only from Cloudflare Workers Builds on `main` (ADR-016).
// Runs from the `deploy` script and from wrangler's custom build hook.
const wranglerCommand = process.env["WRANGLER_COMMAND"]
const isProductionDeploy =
  wranglerCommand === undefined || wranglerCommand === "deploy"
const fromMainBuild =
  process.env["WORKERS_CI"] === "1" &&
  process.env["WORKERS_CI_BRANCH"] === "main"

if (isProductionDeploy && !fromMainBuild) {
  console.error(
    "deploy-guard: production deploy refused. Merge into main; Cloudflare Workers Builds publishes it."
  )
  process.exit(1)
}
