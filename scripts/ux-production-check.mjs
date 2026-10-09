import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function requirePattern(relativePath, pattern, label) {
  const content = read(relativePath);
  if (content && !pattern.test(content)) failures.push(`${label}: ${relativePath}`);
}

requirePattern("components/AuthForm.tsx", /finally\s*\{[\s\S]*setPending\(false\)/, "auth pending reset");
requirePattern("components/AuthForm.tsx", /catch\s*\(/, "auth exception handling");
requirePattern("components/AdminDashboard.tsx", /setLoading\(true\)/, "admin loading state");
requirePattern("components/AdminDashboard.tsx", /Your admin session has expired/, "admin session expiry message");
requirePattern("components/AdminDashboard.tsx", /finally\s*\{[\s\S]*setSaving\(false\)/, "admin save pending reset");
requirePattern("components/AdminDashboard.tsx", /role=\{message\.includes/, "admin live feedback");
requirePattern("components/ReportBrokenLink.tsx", /Try again/, "report retry action");
requirePattern("components/ReportBrokenLink.tsx", /Email us instead/, "report email fallback");
requirePattern("components/CatalogState.tsx", /window\.location\.reload/, "catalog retry action");
requirePattern("lib/data.ts", /errorCode: "not_configured"/, "catalog error category");
requirePattern("components/Header.tsx", /pointerdown/, "mobile navigation outside click");
requirePattern("app/globals.css", /overflow-x: clip/, "horizontal overflow protection");
requirePattern("app/globals.css", /prefers-reduced-motion/, "reduced motion handling");
requirePattern("app/api/report/route.ts", /rateLimitResponse/, "report rate limit response");
requirePattern("components/ConsentBanner.tsx", /agentnine-consent-change/, "analytics consent change event");
requirePattern("components/Footer.tsx", /href="\/privacy\/choices"/, "persistent analytics preferences link");

if (failures.length) {
  console.error("UX production checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("UX production checks passed.");
}
