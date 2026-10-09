#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceOnly = process.argv.includes("--source-only");
const configuredUrl = process.env.ROUTE_SMOKE_URL;
const timeoutMs = Number(process.env.ROUTE_SMOKE_TIMEOUT_MS ?? 20_000);

const sourceFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/about/page.tsx",
  "app/join/page.tsx",
  "app/categories/page.tsx",
  "app/categories/[slug]/page.tsx",
  "app/search/page.tsx",
  "app/agents/[slug]/page.tsx",
  "app/contact/page.tsx",
  "app/faq/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/favicon.ico",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/llms.txt/route.ts",
  "public/og-image.png",
];

const liveRoutes = ["/", "/about", "/join", "/categories", "/search", "/contact", "/faq", "/privacy", "/terms", "/favicon.ico", "/og-image.png"];

function report(message) {
  console.log(`[route-smoke] ${message}`);
}

async function fileExists(relativePath) {
  try {
    await access(resolve(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkSourceInvariants() {
  const present = await Promise.all(sourceFiles.map((file) => fileExists(file)));
  const missing = sourceFiles.filter((file, index) => !present[index]);
  const failures = [];
  if (missing.length) failures.push(`missing route/metadata files: ${missing.join(", ")}`);

  for (const [file, pattern, description] of [
    ["app/layout.tsx", /export const metadata\s*:/, "root metadata export"],
    ["app/robots.ts", /export default function robots/, "robots metadata handler"],
    ["app/sitemap.ts", /export default async function sitemap/, "sitemap metadata handler"],
  ]) {
    if (!(await fileExists(file))) continue;
    const content = await readFile(resolve(root, file), "utf8");
    if (!pattern.test(content)) failures.push(`${file} does not define its ${description}`);
  }

  if (failures.length) {
    for (const failure of failures) console.error(`[route-smoke] FAIL: ${failure}`);
    return false;
  }
  report(`source checks passed (${sourceFiles.length} route and metadata files)`);
  return true;
}

function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(url, child) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return false;
    try {
      await fetch(url, { signal: AbortSignal.timeout(1_000) });
      return true;
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    }
  }
  return false;
}

async function checkLiveRoutes(baseUrl) {
  const routes = [...liveRoutes, "/robots.txt", "/sitemap.xml", "/llms.txt"];
  let passed = true;
  for (const route of routes) {
    try {
      const response = await fetch(new URL(route, baseUrl), { signal: AbortSignal.timeout(5_000) });
      if (response.status < 200 || response.status >= 400) {
        console.error(`[route-smoke] FAIL: ${route} returned HTTP ${response.status}`);
        passed = false;
        continue;
      }
      if (route === "/robots.txt" && !(await response.text()).includes("Sitemap:")) {
        console.error("[route-smoke] FAIL: /robots.txt does not advertise a sitemap");
        passed = false;
      } else if (route === "/sitemap.xml" && !(await response.text()).includes("<urlset")) {
        console.error("[route-smoke] FAIL: /sitemap.xml is not an XML urlset");
        passed = false;
      } else if (route === "/og-image.png" && !response.headers.get("content-type")?.includes("image/png")) {
        console.error("[route-smoke] FAIL: /og-image.png is not served as a PNG image");
        passed = false;
      } else if (route === "/favicon.ico" && !response.headers.get("content-type")?.startsWith("image/")) {
        console.error("[route-smoke] FAIL: /favicon.ico is not served as an image");
        passed = false;
      }
    } catch (error) {
      console.error(`[route-smoke] FAIL: ${route} could not be fetched (${error.message})`);
      passed = false;
    }
  }
  if (passed) report(`live checks passed (${routes.length} routes at ${baseUrl})`);
  return passed;
}

async function startProductionServer() {
  if (!(await fileExists(".next"))) return null;
  const port = await findFreePort();
  const nextCli = resolve(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "ignore",
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  if (!(await waitForServer(baseUrl, child))) {
    child.kill();
    return null;
  }
  return { baseUrl, child };
}

const sourcePassed = await checkSourceInvariants();
if (!sourcePassed) process.exit(1);

if (sourceOnly) {
  report("source-only mode requested; live server checks skipped");
  process.exit(0);
}

let server;
let baseUrl = configuredUrl;
if (!baseUrl) {
  server = await startProductionServer();
  baseUrl = server?.baseUrl;
}

if (!baseUrl) {
  report("production server unavailable; source checks are the fallback validation");
  process.exit(0);
}

try {
  process.exitCode = (await checkLiveRoutes(baseUrl)) ? 0 : 1;
} finally {
  server?.child.kill();
}
