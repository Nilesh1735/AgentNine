import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default {
  targets: [
    {
      name: "web",
      engine: web(),
      app: { url: appUrl },
    },
  ],
  timeout: 60_000,
  retries: 0,
  workers: 1,
  trace: "retain-on-failure",
} satisfies E2EConfig;
