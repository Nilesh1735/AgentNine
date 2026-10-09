"use client";

import { useEffect, useRef, useState } from "react";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy was not available");
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {

  }
  fallbackCopy(text);
}

export function SetupStepper({ steps, storageKey, sourceUrl }: { steps: string[]; storageKey: string; sourceUrl?: string }) {
  const [copied, setCopied] = useState<number | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const { preferences } = useVisitorPreferences();
  const stored = preferences.setupProgress?.[storageKey];
  const completedThrough = typeof stored === "number" && stored >= -1 && stored < steps.length ? stored : -1;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function saveProgress(next: number) {
    try {
      await updateVisitorPreferences({ setupProgress: { ...preferences.setupProgress, [storageKey]: next } });
      setProgressError(false);
    } catch (error) {
      console.error("Setup progress could not be saved", error);
      setProgressError(true);
    }
  }

  function updateProgress(index: number) {
    const next = index === completedThrough ? index - 1 : Math.max(completedThrough, index);
    void saveProgress(next);
  }

  function resetProgress() {
    void saveProgress(-1);
  }

  async function copyStep(step: string, index: number) {
    try {
      await copyText(step);
      setCopyError(false);
      setCopied(index);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setCopied(null);
        timeoutRef.current = null;
      }, 1600);
    } catch {
      setCopyError(true);
    }
  }

  if (!steps.length) {
    const readmeUrl = sourceUrl?.replace(/\/+$/, "").replace(/\.git$/, "").replace(/\/blob\/.*$/, "") + "/blob/HEAD/README.md";
    return <div className="empty-state setup-unavailable" role="status"><strong>Setup steps not recorded</strong><p>AgentNine has not validated setup steps for this listing yet. This is a documentation gap, not a setup failure.</p>{sourceUrl ? <a className="button button-outline" href={readmeUrl} target="_blank" rel="noopener noreferrer">Open the project README <ArrowUpRight size={15} aria-hidden="true" /></a> : <p className="muted">The source repository is not recorded, so an upstream README link is unavailable.</p>}</div>;
  }

  return <div><div className="stepper-actions"><span aria-live="polite">{completedThrough >= 0 ? `Step ${Math.min(completedThrough + 1, steps.length)} of ${steps.length} reached` : "No steps completed yet"}</span><button type="button" className="copy-button" onClick={resetProgress} disabled={completedThrough < 0}>Reset steps</button></div>{copyError ? <p className="form-error" role="alert">Copy failed. Select the text manually and press Ctrl+C (or Cmd+C).</p> : null}{progressError ? <p className="form-error" role="alert">Setup progress could not be saved. Try again.</p> : null}<ol className="stepper">{steps.map((step, index) => <li className={index <= completedThrough ? "step-complete" : ""} key={`${step}-${index}`}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><div className="step-content"><p>{step}</p><div className="step-actions"><button type="button" className="copy-button" onClick={() => copyStep(step, index)}>{copied === index ? "Copied" : "Copy step"}</button><button type="button" className="copy-button" onClick={() => updateProgress(index)}>{index <= completedThrough ? "Completed" : "Mark complete"}</button></div></div></li>)}</ol></div>;
}

export function CopyableCommand({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function copy() {
    try {
      await copyText(value);
      setCopyError(false);
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1600);
    } catch {
      setCopyError(true);
    }
  }
  return <div className="command-card"><div><strong>{label}</strong><pre>{value}</pre>{copyError ? <small className="form-error">Copy failed. Select the command and press Ctrl+C (or Cmd+C).</small> : null}</div><button type="button" className="copy-button" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>;
}
