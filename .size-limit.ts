import { readFileSync } from "node:fs"

// Initial JavaScript = the entry script and its modulepreload chunks from the built index.html.
const html = readFileSync("apps/web/dist/index.html", "utf8")
const files = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map(
  (match) => `apps/web/dist/${String(match[1])}`
)

export default [
  { name: "initial JS", path: files, limit: "150 kB", gzip: true },
]
