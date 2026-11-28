import { defineConfig } from "@playwright/test";

const port = 4173;

/** Shared settings: built app served by `vite preview`, fail on stray `test.only`. */
export const baseConfig = defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "off" },
  webServer: {
    command: `pnpm build && pnpm preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env["CI"],
    // Let `vite preview` exit cleanly so its lock does not block the next suite.
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
});
