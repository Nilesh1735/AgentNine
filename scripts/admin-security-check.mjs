import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";

const baseUrl = (process.env.ADMIN_SECURITY_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const checks = [
  { name: "admin page without cookie", method: "GET", path: "/admin", expected: [200, 302, 307] },
  { name: "admin agent read without cookie", method: "GET", path: "/api/admin/agents", expected: [401, 403] },
  { name: "admin agent create without cookie", method: "POST", path: "/api/admin/agents", body: {}, expected: [403] },
  { name: "admin agent update without cookie", method: "PATCH", path: "/api/admin/agents", body: {}, expected: [403] },
  { name: "admin metadata mutation without cookie", method: "PUT", path: "/api/admin/agents/metadata", body: {}, expected: [403] },
  { name: "admin verification without cookie", method: "POST", path: "/api/admin/agents/verifications", body: {}, expected: [403] },
  { name: "admin bulk verification without cookie", method: "PUT", path: "/api/admin/agents/verifications", body: {}, expected: [403] },
  { name: "admin candidates mutation without cookie", method: "POST", path: "/api/admin/trending-candidates", body: {}, expected: [403] },
  { name: "admin operations read without cookie", method: "GET", path: "/api/admin/operations?view=audit", expected: [401] },
  { name: "admin operations update without cookie", method: "PATCH", path: "/api/admin/operations", body: {}, expected: [403] },
  { name: "admin login wrong origin", method: "POST", path: "/api/admin/auth", headers: { origin: "https://invalid.example" }, body: {}, expected: [403] },
  { name: "admin logout wrong origin", method: "DELETE", path: "/api/admin/auth", headers: { origin: "https://invalid.example" }, expected: [403] },
];

async function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to determine an available port."));
        return;
      }
      server.close(() => resolvePort(address.port));
    });
  });
}

async function startLocalProductionServer() {
  const port = await findFreePort();
  const server = spawn(
    process.execPath,
    [resolve("node_modules", "next", "dist", "bin", "next"), "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { env: { ...process.env, NODE_ENV: "production" }, stdio: "ignore" },
  );
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Production server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return { server, url };
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  server.kill();
  throw new Error("Production server did not become ready within 20 seconds.");
}

const failures = [];
let server;
let checkBaseUrl = baseUrl;
if (!process.env.ADMIN_SECURITY_URL) {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
    if (!response.ok) throw new Error(`Existing local server returned HTTP ${response.status}.`);
  } catch {
    try {
      ({ server, url: checkBaseUrl } = await startLocalProductionServer());
    } catch (error) {
      console.error(`Unable to start a local production server: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

try {
  for (const check of checks) {
    const headers = { ...(check.body ? { "content-type": "application/json" } : {}), ...(check.headers || {}) };
    try {
      const response = await fetch(`${checkBaseUrl}${check.path}`, {
        method: check.method,
        headers,
        body: check.body ? JSON.stringify(check.body) : undefined,
        redirect: "manual",
      });
      if (!check.expected.includes(response.status)) {
        failures.push(`${check.name}: expected ${check.expected.join(" or ")}, received ${response.status}`);
      } else {
        console.log(`passed: ${check.name} (${response.status})`);
      }
    } catch (error) {
      failures.push(`${check.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} finally {
  server?.kill();
}

if (failures.length) {
  console.error("Admin security checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Admin security boundary checks passed (${checks.length} checks).`);
}
