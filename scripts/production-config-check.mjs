const requiredInProduction = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_DASHBOARD_KEY",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TRUSTED_PROXY_HEADERS",
  "CRON_SECRET",
];

const optionalProduction = [
  "REPORT_LAMBDA_URL",
  "GITHUB_TOKEN",
  "CRON_SECRET",
];

const production = process.env.NODE_ENV === "production" || process.env.CHECK_PRODUCTION_CONFIG === "1";
if (!production) {
  console.log("Production configuration check skipped (set CHECK_PRODUCTION_CONFIG=1 to run locally).");
  process.exit(0);
}

const missing = requiredInProduction.filter((name) => !process.env[name]?.trim());
if (!process.env.CONTACT_LAMBDA_URL?.trim() && (!process.env.RESEND_API_KEY?.trim() || !process.env.CONTACT_FROM_EMAIL?.trim())) {
  missing.push("Configure CONTACT_LAMBDA_URL or both RESEND_API_KEY and CONTACT_FROM_EMAIL");
}
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
if (siteUrl) {
  try {
    const parsedSiteUrl = new URL(siteUrl);
    if (parsedSiteUrl.protocol !== "https:" || parsedSiteUrl.origin !== siteUrl) {
      missing.push("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path, trailing slash, credentials, query, or fragment");
    }
  } catch {
    missing.push("NEXT_PUBLIC_SITE_URL must be a valid HTTPS origin");
  }
}
const rateLimitUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
if (rateLimitUrl) {
  try {
    const parsedRateLimitUrl = new URL(rateLimitUrl);
    if (parsedRateLimitUrl.protocol !== "https:" || parsedRateLimitUrl.username || parsedRateLimitUrl.password || parsedRateLimitUrl.search || parsedRateLimitUrl.hash) {
      missing.push("UPSTASH_REDIS_REST_URL must be HTTPS without embedded credentials, query, or fragment");
    }
  } catch {
    missing.push("UPSTASH_REDIS_REST_URL must be a valid HTTPS URL");
  }
}
if (process.env.TRUSTED_PROXY_HEADERS !== "true") {
  missing.push("TRUSTED_PROXY_HEADERS must be true after confirming the production proxy sanitizes forwarded IP headers");
}

if (missing.length) {
  console.error("Production configuration check failed:");
  missing.forEach((name) => console.error(`- ${name}`));
  process.exitCode = 1;
} else {
  const unsetOptional = optionalProduction.filter((name) => !process.env[name]?.trim());
  console.log("Required production configuration is present.");
  if (unsetOptional.length) console.warn(`Optional production configuration not set: ${unsetOptional.join(", ")}`);
}
