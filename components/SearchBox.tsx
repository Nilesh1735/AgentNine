"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Search from "reicon-react/icons/Search";
import Xmark from "reicon-react/icons/Xmark";
import ChevronDown from "reicon-react/icons/ChevronDown";
import Check from "reicon-react/icons/Check";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import ArrowDown from "reicon-react/icons/ArrowDown";
import { trackEvents } from "@/lib/analytics";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";
import type { Agent, Category } from "@/lib/types";

type FilterOption = { value: string; label: string };
const MAX_RECENT_AGENT_SEARCHES = 5;
const touchModeQuery = "(hover: none)";

function subscribeToTouchMode(onChange: () => void) {
  const media = window.matchMedia(touchModeQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getTouchMode() {
  return window.matchMedia(touchModeQuery).matches;
}

function FilterPopover({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selected.value));
  const [open, setOpen] = useState(false);
  const touchMode = useSyncExternalStore(subscribeToTouchMode, getTouchMode, () => false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusOptionOnOpenRef = useRef(false);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  useEffect(() => {
    if (open && focusOptionOnOpenRef.current) {
      focusOptionOnOpenRef.current = false;
      optionRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex, open]);

  function focusOption(index: number) {
    if (!options.length) return;
    const nextIndex = (index + options.length) % options.length;
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  function openAndFocusOption(index: number) {
    setActiveIndex(index);
    if (open) {
      optionRefs.current[index]?.focus();
    } else {
      focusOptionOnOpenRef.current = true;
      setOpen(true);
    }
  }

  function selectOption(option: FilterOption) {
    onChange(option.value);
    setActiveIndex(Math.max(0, options.findIndex((item) => item.value === option.value)));
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={rootRef}
      className={`filter-popover${open ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch" && !touchMode) setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch" && !touchMode) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="filter-popover-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `filter-listbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined}
        onClick={() => setOpen((isOpen) => touchMode ? !isOpen : true)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            openAndFocusOption(open ? activeIndex + 1 : selectedIndex);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openAndFocusOption(open ? activeIndex - 1 : options.length - 1);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) selectOption(options[activeIndex]);
            else openAndFocusOption(selectedIndex);
          }
        }}
      >
        <span className="filter-label">{label}</span>
        <span className="filter-value">{selected.label}</span>
        <span className="filter-chevron" aria-hidden><ChevronDown size={16} /></span>
      </button>
      {open ? (
        <div
          id={`filter-listbox-${label.toLowerCase().replace(/\s+/g, "-")}`}
          className="filter-popover-menu"
          role="listbox"
          aria-label={label}
          onKeyDown={(event) => {
            const focusedIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
            const currentIndex = focusedIndex < 0 ? activeIndex : focusedIndex;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              focusOption(currentIndex + (event.key === "ArrowDown" ? 1 : -1));
            } else if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              focusOption(event.key === "Home" ? 0 : options.length - 1);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            } else if (event.key === "Enter" || event.key === " ") {
              const option = options[currentIndex];
              if (option) {
                event.preventDefault();
                selectOption(option);
              }
            }
          }}
        >
          {options.map((option, index) => (
            <button
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`filter-option${option.value === value ? " is-selected" : ""}`}
              key={option.value}
              onFocus={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden><Check size={14} /></span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SearchBox({ agents, categories, freshnessCutoff }: { agents: Agent[]; categories: Category[]; freshnessCutoff: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [queryDraft, setQueryDraft] = useState({ urlQuery, value: urlQuery });
  if (queryDraft.urlQuery !== urlQuery) {
    setQueryDraft({ urlQuery, value: urlQuery });
  }
  const inputQuery = queryDraft.value;
  function setInputQuery(value: string) {
    setQueryDraft((current) => ({ ...current, value }));
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const recentAgentSearchesRef = useRef<HTMLDivElement>(null);
  const category = searchParams.get("category") ?? "";
  const os = searchParams.get("os") ?? "";
  const apiKey = searchParams.get("apiKey") ?? "";
  const verification = searchParams.get("verification") ?? "";
  const recentlyUpdated = searchParams.get("updated") === "1";
  const sort = searchParams.get("sort") ?? "relevance";

  const activeQuery = inputQuery.trim();
  const [showMoreFilters, setShowMoreFilters] = useState(Boolean(apiKey || recentlyUpdated));
  const [visibleLimit, setVisibleLimit] = useState(24);
  const { preferences } = useVisitorPreferences();
  const recentAgentSlugs = preferences.recentAgentSlugs ?? [];
  const [searchFocused, setSearchFocused] = useState(false);

  function saveRecentAgentSearch(slug: string) {
    const next = [slug, ...recentAgentSlugs.filter((recentSlug) => recentSlug !== slug)].slice(0, MAX_RECENT_AGENT_SEARCHES);
    void updateVisitorPreferences({ recentAgentSlugs: next }).catch((error: unknown) => {
      console.error("Recent agent search could not be saved", error);
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = inputQuery.trim();
      if (trimmed !== urlQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        const next = params.toString();
        const target = next ? `${pathname}?${next}` : pathname;
        router.replace(target, { scroll: false });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [inputQuery, pathname, urlQuery, searchParams, router]);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  const categoryById = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item])), [categories]);
  const agentBySlug = useMemo(() => new Map(agents.map((agent) => [agent.slug, agent])), [agents]);
  const recentAgents = recentAgentSlugs
    .map((slug) => agentBySlug.get(slug))
    .filter((agent): agent is Agent => Boolean(agent));
  const fuse = useMemo(() => new Fuse(agents.map((agent) => ({
    ...agent,
    searchCategory: categoryById[agent.category_id]?.name ?? "",
    searchCapabilities: [agent.network_access, agent.file_access, agent.hardware_requirements, agent.cost_to_run].join(" "),
  })), { keys: ["name", "short_description", "tags", "github_url", "searchCategory", "searchCapabilities"], threshold: 0.2, ignoreLocation: true, includeScore: true }), [agents, categoryById]);
  const searched = useMemo(() => {
    const normalizedQuery = activeQuery.toLowerCase();
    if (!normalizedQuery) return agents.map((agent) => ({ agent, score: 1 }));

    const directMatches = agents
      .map((agent) => {
        const searchableText = [
          agent.name,
          agent.short_description,
          ...(agent.tags ?? []),
          categoryById[agent.category_id]?.name ?? "",
          agent.network_access,
          agent.file_access,
          agent.hardware_requirements,
          agent.cost_to_run,
        ].join(" ").toLowerCase();

        const nameMatch = agent.name.toLowerCase().includes(normalizedQuery) ? 100 : 0;
        const textMatch = searchableText.includes(normalizedQuery) ? 40 : 0;
        const score = nameMatch + textMatch;

        return score > 0 ? { agent, score } : null;
      })
      .filter((entry): entry is { agent: Agent; score: number } => Boolean(entry));

    if (directMatches.length) {
      return directMatches.sort((a, b) => b.score - a.score || a.agent.name.localeCompare(b.agent.name));
    }

    return fuse.search(normalizedQuery)
      .filter((result) => (result.score ?? 1) <= 0.35)
      .map((result) => ({ agent: result.item, score: result.score ?? 1 }));
  }, [activeQuery, agents, categoryById, fuse]);
  const filtered = searched.filter(({ agent }) => {
    const categoryMatches = !category || categoryById[agent.category_id]?.slug === category;
    const osMatches = !os || Boolean(agent.os_commands[os as keyof Agent["os_commands"]]);
    const apiMatches = !apiKey || (apiKey === "required"
      ? agent.requires_api_key === true
      : agent.requires_api_key === false);
    const verificationMatches = !verification || (verification === "5" && agent.verification_score === 5);
    const commitTime = agent.last_commit_at ? new Date(agent.last_commit_at).getTime() : 0;
    const updatedMatches = !recentlyUpdated || (commitTime > 0 && commitTime >= freshnessCutoff);
    return categoryMatches && osMatches && apiMatches && verificationMatches && updatedMatches;
  });
  const results = [...filtered].sort((a, b) => {
    if (sort === "name") return a.agent.name.localeCompare(b.agent.name);
    if (sort === "stars") return b.agent.stars - a.agent.stars || a.agent.name.localeCompare(b.agent.name);
    if (sort === "recent") return (new Date(b.agent.last_commit_at || 0).getTime() || 0) - (new Date(a.agent.last_commit_at || 0).getTime() || 0);
    if (a.score !== b.score) return a.score - b.score;
    return a.agent.name.localeCompare(b.agent.name);
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const filterCount = [category, os, apiKey, verification, recentlyUpdated ? "updated" : ""].filter(Boolean).length;
      trackEvents([
        { eventName: "search", properties: { queryLength: activeQuery.length, filterCount } },
        results.length
          ? { eventName: "search_success", properties: { resultCount: results.length } }
          : { eventName: "search_zero_results", properties: { filterCount } },
      ]);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeQuery, category, os, apiKey, verification, recentlyUpdated, results.length]);

  function updateQuery(value: string) {
    setVisibleLimit(24);
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    router.replace(target, { scroll: false });
  }

  function updateParam(name: string, value: string) {
    setVisibleLimit(24);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    router.replace(target, { scroll: false });
  }
  const activeFilters = [
    category ? ["Category", categoryById[category] ? categoryById[category].name : category, "category"] : null,
    os ? ["OS", os === "macos" ? "macOS" : os[0].toUpperCase() + os.slice(1), "os"] : null,
    apiKey ? ["API key", apiKey === "required" ? "Required" : "Not required for documented local or default setup", "apiKey"] : null,
    verification ? ["Checklist", "5 checks recorded", "verification"] : null,
    recentlyUpdated ? ["Freshness", "Past 180 days", "updated"] : null,
  ].filter(Boolean) as string[][];
  const clearAll = () => {
    setVisibleLimit(24);
    router.replace(pathname, { scroll: false });
  };
  const hasSearchCriteria = Boolean(activeQuery || category || os || apiKey || verification || recentlyUpdated);
  const categoryName = category ? categoryById[category]?.name ?? category : "";
  const filterSummary = [categoryName, os === "macos" ? "macOS" : os ? os[0].toUpperCase() + os.slice(1) : "", verification === "5" ? "5 checks recorded" : "", recentlyUpdated ? "Updated recently" : ""].filter(Boolean);
  const visibleFilterCount = [category, os, apiKey, verification, recentlyUpdated ? "updated" : ""].filter(Boolean).length;
  const visibleResults = results.slice(0, visibleLimit);
  const formatUpdated = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `Updated ${date.toLocaleDateString("en", { month: "short", year: "numeric" })}`;
  };

  return (
    <div className="search-shell" role="search" aria-label="Search agent directory">
      <label className="search-input-wrap" htmlFor="agent-directory-search">
        <span className="search-icon" aria-hidden><Search size={16} /></span>
        <input id="agent-directory-search" ref={inputRef} value={inputQuery} onChange={(event) => setInputQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={(event) => { if (!recentAgentSearchesRef.current?.contains(event.relatedTarget as Node | null)) setSearchFocused(false); }} placeholder="Search agents by name, description, or tag" aria-label="Search agents by name, description, or tag" aria-describedby="search-scope search-status" />
        {inputQuery && <button type="button" className="clear-query" onClick={() => { setInputQuery(""); updateQuery(""); }} aria-label="Clear search query"><Xmark size={15} aria-hidden="true" /></button>}
        <kbd aria-label="Keyboard shortcut slash">/</kbd>
      </label>
      {searchFocused && !inputQuery && recentAgents.length > 0 ? (
        <div ref={recentAgentSearchesRef} className="recent-agent-searches" aria-label="Recently opened agents" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchFocused(false); }}>
          <span>Recent agents</span>
          {recentAgents.map((agent) => (
            <button
              type="button"
              key={agent.slug}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setInputQuery(agent.name);
                updateQuery(agent.name);
              }}
            >
              {agent.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="search-toolbar">
        <div className="search-filters search-primary-filters">
        <FilterPopover label="Category" value={category} options={[{ value: "", label: "All categories" }, ...categories.map((item) => ({ value: item.slug, label: item.name }))]} onChange={(value) => updateParam("category", value)} />
        <FilterPopover label="OS" value={os} options={[{ value: "", label: "Any OS" }, { value: "linux", label: "Linux" }, { value: "macos", label: "macOS" }, { value: "windows", label: "Windows" }]} onChange={(value) => updateParam("os", value)} />
        <FilterPopover label="Checklist" value={verification} options={[{ value: "", label: "Any checklist status" }, { value: "5", label: "5 checks recorded" }]} onChange={(value) => updateParam("verification", value)} />
        <button type="button" className={`filter-toggle${showMoreFilters ? " is-open" : ""}`} onClick={() => setShowMoreFilters((open) => !open)} aria-expanded={showMoreFilters}>More filters{visibleFilterCount > 2 ? ` (${visibleFilterCount - 2})` : ""}</button>
        </div>
        <FilterPopover label="Sort" value={sort} options={[{ value: "relevance", label: "Relevance" }, { value: "recent", label: "Recently updated" }, { value: "name", label: "Name" }, { value: "stars", label: "GitHub stars" }]} onChange={(value) => updateParam("sort", value)} />
      </div>
      {showMoreFilters ? <div className="more-filters">
      <FilterPopover label="API key" value={apiKey} options={[{ value: "", label: "Any API requirement" }, { value: "required", label: "Required" }, { value: "not-required", label: "Not required for documented local or default setup" }]} onChange={(value) => updateParam("apiKey", value)} />
        <label className="updated-filter"><input type="checkbox" checked={recentlyUpdated} onChange={(event) => updateParam("updated", event.target.checked ? "1" : "")} /> Updated in the past 180 days</label>
      </div> : null}
      {activeFilters.length > 0 && <div className="active-filters" aria-label="Active search filters"><span className="active-filters-label">Active filters</span>{activeFilters.map(([label, value, key]) => <button type="button" className="filter-chip" key={key} onClick={() => updateParam(key, "")} aria-label={`Remove ${label} filter${value ? `: ${value}` : ""}`}>{label}: {value} <Xmark size={12} aria-hidden="true" /></button>)}<button type="button" className="clear-filters" onClick={clearAll}>Clear all</button></div>}
      <div id="search-status" className="search-meta" role="status" aria-live="polite"><div><strong>{hasSearchCriteria ? `${results.length} agent${results.length === 1 ? "" : "s"}` : `${agents.length} agents`}</strong><span>{filterSummary.length ? filterSummary.join(", ") : "All published agents"}</span></div></div>
      <div className="results-list results-comfortable">
        {visibleResults.map(({ agent }) => <div key={agent.id}><Link className="search-result" href={`/agents/${agent.slug}`} prefetch={false} onClick={() => saveRecentAgentSearch(agent.slug)}><span className="result-main"><strong>{agent.name}</strong><small>{agent.short_description}</small><span className="result-meta"><span>{categoryById[agent.category_id]?.name ?? "Uncategorized"}</span>{Object.keys(agent.os_commands ?? {}).filter((key) => agent.os_commands[key as keyof Agent["os_commands"]]).slice(0, 2).map((item) => <span key={item}>{item === "macos" ? "macOS" : item[0].toUpperCase() + item.slice(1)}</span>)}{agent.verification_score === 5 ? <span>5 checks recorded</span> : null}{formatUpdated(agent.last_commit_at) ? <span>{formatUpdated(agent.last_commit_at)}</span> : null}</span></span><span className="result-side"><span className="result-category">{agent.stars ? `${agent.stars.toLocaleString()} GitHub stars` : "No star count recorded"}</span><ArrowUpRight size={16} aria-hidden="true" className="result-arrow" /></span></Link></div>)}
        {!results.length && <div className="empty-state" role="status" aria-live="polite"><strong>No matching agents.</strong><p>{activeQuery ? "Try another search or remove a filter." : "Remove a filter to broaden the results."}</p><button type="button" className="button button-outline" onClick={clearAll}>{activeQuery ? "Reset search" : "Reset filters"}</button></div>}
        {visibleResults.length < results.length ? <button type="button" className="load-more-results" onClick={() => setVisibleLimit((limit) => limit + 24)}>Load more agents <ArrowDown size={14} aria-hidden="true" /></button> : null}
      </div>
    </div>
  );
}
