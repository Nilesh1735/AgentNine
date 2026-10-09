"use client";

import { useEffect, useSyncExternalStore } from "react";

export type AnalyticsAttribution = Partial<Record<
  "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content",
  string
>>;

export type VisitorPreferences = {
  theme?: "light" | "dark";
  analyticsConsent?: "accepted" | "declined";
  analyticsSessionId?: string;
  attribution?: AnalyticsAttribution;
  recentAgentSlugs?: string[];
  compareSlugs?: string[];
  setupProgress?: Record<string, number>;
};

export type VisitorPreferencePatch = {
  [K in keyof VisitorPreferences]?: VisitorPreferences[K] | null;
};

type Snapshot = { preferences: VisitorPreferences; ready: boolean };

const emptyPreferences: VisitorPreferences = {};
const emptySnapshot: Snapshot = { preferences: emptyPreferences, ready: false };
let snapshot = emptySnapshot;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function normalizeVisitorPreferences(preferences: VisitorPreferences): VisitorPreferences {
  const setupProgress = preferences.setupProgress;
  if (!setupProgress) return preferences;

  const normalizedProgress: Record<string, number> = {};
  for (const [key, value] of Object.entries(setupProgress)) {
    if (key.startsWith("agenthive:setup:")) continue;
    normalizedProgress[key] = value;
  }
  for (const [key, value] of Object.entries(setupProgress)) {
    if (key.startsWith("agenthive:setup:")) {
      normalizedProgress[key.replace("agenthive:setup:", "agentnine:setup:")] ??= value;
    }
  }
  return { ...preferences, setupProgress: normalizedProgress };
}

function notify() {
  for (const listener of listeners) listener();
}

function applySnapshot(preferences: VisitorPreferences) {
  snapshot = { preferences, ready: true };
  if (preferences.theme) document.documentElement.dataset.theme = preferences.theme;
  notify();
}

async function fetchPreferences(options: RequestInit) {
  try {
    return await fetch("/api/preferences", options);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fetch("/api/preferences", options);
  }
}

export async function loadVisitorPreferences() {
  if (snapshot.ready) return snapshot.preferences;
  if (!loading) {
    loading = fetchPreferences({ cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preferences could not be loaded (${response.status})`);
        const result = await response.json() as { preferences?: VisitorPreferences };
        applySnapshot(normalizeVisitorPreferences(result.preferences ?? {}));
      })
      .catch((error: unknown) => {
        snapshot = emptySnapshot;
        notify();
        loading = null;
        throw error;
      });
  }
  await loading;
  return snapshot.preferences;
}

export async function updateVisitorPreferences(patch: VisitorPreferencePatch) {
  await loadVisitorPreferences();
  const response = await fetchPreferences({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`Preferences could not be saved (${response.status})`);
  const result = await response.json() as { preferences?: VisitorPreferences };
  applySnapshot(normalizeVisitorPreferences(result.preferences ?? {}));
  return snapshot.preferences;
}

export function useVisitorPreferences() {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => emptySnapshot,
  );

  useEffect(() => {
    void loadVisitorPreferences().catch((error: unknown) => {
      if (process.env.NODE_ENV === "development") console.error("Visitor preferences are unavailable", error);
    });
  }, []);

  return current;
}
