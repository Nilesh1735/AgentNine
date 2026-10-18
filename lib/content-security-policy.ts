export function getContentSecurityPolicy(allowCortality: boolean): string {
  const scriptSources = process.env.NODE_ENV === "development"
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net"
    : "'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net";
  const cortalityScript = allowCortality ? " https://cdn.cortality.com" : "";
  const cortalityConnection = allowCortality ? " https://ingest.cortality.com" : "";

  return `default-src 'self'; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://connect.facebook.net https://www.facebook.com${cortalityConnection}; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://connect.facebook.net https://www.facebook.com; style-src 'self' 'unsafe-inline'; script-src ${scriptSources}${cortalityScript}; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
}
