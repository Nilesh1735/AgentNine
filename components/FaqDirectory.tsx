"use client";

import { useEffect, useMemo, useState } from "react";
import Search from "reicon-react/icons/Search";
import type { FaqGroup } from "@/lib/faq";

export function FaqDirectory({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(() => new Set());
  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return groups;

    return groups
      .map((group) => ({
        ...group,
        questions: group.questions.filter(({ question, answer }) =>
          `${group.title} ${question} ${answer}`.toLocaleLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.questions.length > 0);
  }, [groups, query]);
  const visibleQuestionCount = filteredGroups.reduce((count, group) => count + group.questions.length, 0);

  useEffect(() => {
    const openQuestionFromHash = () => {
      const questionId = window.location.hash.slice(1);
      if (!groups.some((group) => group.questions.some(({ id }) => id === questionId))) return;

      setOpenQuestionIds((current) => {
        if (current.has(questionId)) return current;
        return new Set(current).add(questionId);
      });
    };

    openQuestionFromHash();
    window.addEventListener("hashchange", openQuestionFromHash);
    return () => window.removeEventListener("hashchange", openQuestionFromHash);
  }, [groups]);

  return (
    <>
      <label className="faq-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search frequently asked questions</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions..."
        />
      </label>
      <div className="faq-directory-layout">
        <nav className="faq-category-nav" aria-label="FAQ categories">
          <p>Topics</p>
          {filteredGroups.map((group) => (
            <a href={`#${group.id}`} key={group.id}>
              {group.title}
              <span>{group.questions.length}</span>
            </a>
          ))}
        </nav>
        <div className="faq-groups" aria-live="polite">
          <p className="sr-only" role="status">
            {visibleQuestionCount} {visibleQuestionCount === 1 ? "question" : "questions"} found
          </p>
          {filteredGroups.length ? (
            filteredGroups.map((group) => (
              <section className="faq-group" id={group.id} key={group.id}>
                <h2>{group.title}</h2>
                <div className="faq-list">
                  {group.questions.map(({ id, question, answer }) => (
                    <section className={`faq-item${openQuestionIds.has(id) ? " is-open" : ""}`} id={id} key={id}>
                      <h3 className="faq-item-heading">
                        <button
                          type="button"
                          className="faq-item-toggle"
                          id={`${id}-toggle`}
                          aria-expanded={openQuestionIds.has(id)}
                          aria-controls={`${id}-answer`}
                          onClick={() => {
                            setOpenQuestionIds((current) => {
                              const next = new Set(current);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }}
                        >
                          <span>{question}</span>
                          <span className="faq-item-chevron" aria-hidden="true" />
                        </button>
                      </h3>
                      <div
                        className="faq-answer"
                        id={`${id}-answer`}
                        aria-labelledby={`${id}-toggle`}
                        aria-hidden={!openQuestionIds.has(id)}
                      >
                        <div className="faq-answer-inner">
                          <p>{answer}</p>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="faq-empty">No questions match &quot;{query}&quot;. Try a different search.</p>
          )}
        </div>
        <nav className="faq-page-index" aria-label="Questions on this page">
          <p>On this page</p>
          {filteredGroups.flatMap((group) =>
            group.questions.map(({ id, question }) => (
              <a href={`#${id}`} key={id}>{question}</a>
            )),
          )}
        </nav>
      </div>
    </>
  );
}
