import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoots = ["app", "components", "lib"].map((directory) => join(root, directory));
const publicPageFiles = [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/categories/page.tsx",
  "app/contact/page.tsx",
  "app/faq/page.tsx",
  "app/privacy/page.tsx",
  "app/search/page.tsx",
  "app/terms/page.tsx",
  "app/not-found.tsx",
  "app/error.tsx",
];
const ignored = new Set(["node_modules", ".next", ".git"]);
const files = [];

function collect(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collect(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry)) files.push(path);
  }
}

sourceRoots.forEach(collect);

const failures = [];
const addFailure = (label, file, line) => {
  failures.push(`${label}: ${relative(root, file)}:${line}`);
};

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function checkPublicTsx(file, content) {
  if (!file.endsWith(".tsx")) return;

  // Spreads are intentionally ignored: the caller may provide an accessible
  // attribute, and a regex cannot safely resolve that prop at build time.
  for (const match of content.matchAll(/<(img|Image)\b([^>]*?)(?:\/?)>/g)) {
    const attributes = match[2];
    if (!/\balt\s*=/.test(attributes) && !/\{\s*\.\.\./.test(attributes)) {
      addFailure("image without alt", file, lineNumber(content, match.index));
    }
  }

  // Only report statically empty labels. Dynamic children and handlers need
  // JSX-aware analysis and are deliberately left to the framework a11y lint.
  for (const match of content.matchAll(/<(button|a)\b([^>]*)>/g)) {
    const attributes = match[2];
    if (/\b(?:aria-label|aria-labelledby)\s*=\s*(?:""|''|\{\s*["']["']\s*\})/.test(attributes)) {
      addFailure("interactive element with empty label", file, lineNumber(content, match.index));
    }
  }
  for (const match of content.matchAll(/<(button|a)\b[^>]*>\s*<\/\1\s*>/g)) {
    addFailure("interactive element with empty label", file, lineNumber(content, match.index));
  }

  for (const match of content.matchAll(/\bhref\s*=\s*(?:"#"|'#'|\{\s*["']#["']\s*\})/g)) {
    addFailure("fake hash link", file, lineNumber(content, match.index));
  }

  // Loading copy should expose a live/status signal. Restrict this to the
  // conventional literal copy to avoid flagging unrelated business text.
  for (const match of content.matchAll(/\bLoading(?:\.{3}|…)/gi)) {
    const context = content.slice(Math.max(0, match.index - 200), match.index + 200);
    if (!/\b(?:role\s*=\s*["']status["']|aria-live\s*=|aria-busy\s*=)/.test(context)) {
      addFailure("visible loading text without status/aria", file, lineNumber(content, match.index));
    }
  }

  // localhost is fine in docs and development URLs, but not in detectable
  // metadata/JSON-LD that can leak into a deployed page.
  const hasDevelopmentOnlyMetadataFallback = /NODE_ENV\s*!==\s*["']production["']/.test(content);
  if (/\blocalhost(?::\d+)?\b/i.test(content) && /\bmetadata\b|application\/ld\+json|metadataBase|jsonLd/.test(content) && !hasDevelopmentOnlyMetadataFallback) {
    const match = /\blocalhost(?::\d+)?\b/i.exec(content);
    addFailure("hardcoded localhost in user-facing metadata", file, lineNumber(content, match.index));
  }
}

const sourceChecks = [
  { label: "service-role key in client source", pattern: /SUPABASE_SERVICE_ROLE_KEY.{0,80}(NEXT_PUBLIC|window|localStorage)/ },
];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  checkPublicTsx(file, content);
  for (const check of sourceChecks) {
    if (check.pattern.test(content)) addFailure(check.label, file, 1);
  }

  for (const relativeFile of publicPageFiles) {
    const file = join(root, relativeFile);
    if (!existsSync(file)) {
      failures.push(`missing public route module: ${relativeFile}`);
      continue;
    }
    const content = readFileSync(file, "utf8");
    if (!/<main\b/.test(content)) failures.push(`public route lacks main landmark: ${relativeFile}`);
    if (!/id=["']main-content["']/.test(content)) failures.push(`public route lacks main-content target: ${relativeFile}`);
  }

  const stylesheet = join(root, "app", "globals.css");
  if (!existsSync(stylesheet)) {
    failures.push("missing global stylesheet: app/globals.css");
  } else {
    const css = readFileSync(stylesheet, "utf8");
    const requiredCssSignals = [
      ["visible focus styles", /focus-visible/],
      ["reduced-motion handling", /prefers-reduced-motion/],
      ["horizontal overflow protection", /overflow-x\s*:/],
    ];
    for (const [label, pattern] of requiredCssSignals) {
      if (!pattern.test(css)) failures.push(`missing ${label}: app/globals.css`);
    }
  }
}

try {
  const tracked = execFileSync("git", ["ls-files", ".env.local"], { encoding: "utf8" }).trim();
  if (tracked) failures.push("tracked local environment file: .env.local");
} catch {
  // Git is unavailable in some deployment environments; source checks still run.
}

if (failures.length) {
  console.error("Anti-vibe checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Anti-vibe checks passed (${files.filter((file) => file.endsWith(".tsx")).length} public TSX files inspected).`);
}
