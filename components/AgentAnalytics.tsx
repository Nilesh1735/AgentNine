"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function AgentAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("agent_view", { slug });
  }, [slug]);
  return null;
}
