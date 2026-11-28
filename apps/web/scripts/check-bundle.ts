// Bundle budget (ADR-005): initial JS (entry + modulepreload) must stay within the limit, gzip.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const limitKb = 150;
const dist = new URL("../dist/", import.meta.url).pathname;
const html = readFileSync(join(dist, "index.html"), "utf8");
const files = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].flatMap((m) =>
  m[1] ? [m[1]] : [],
);

if (files.length === 0) {
  console.error("check-bundle: no initial JS found in dist/index.html");
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(join(dist, file))).length;
  total += size;
  console.log(`${file}  ${(size / 1024).toFixed(1)} KB gz`);
}
const totalKb = total / 1024;
console.log(`initial JS total: ${totalKb.toFixed(1)} KB gz (limit ${limitKb} KB)`);
if (totalKb > limitKb) {
  console.error("check-bundle: initial JS exceeds the budget");
  process.exit(1);
}
