"use client";

import { useState } from "react";

const questions = [
  {
    question: "Is an account required?",
    answer:
      "No account is needed. You can browse listings, search agents, view categories, and read setup records without signing in.",
  },
  {
    question: "What does “verified” mean?",
    answer:
      "All five checklist items have recorded evidence, the listing is not marked stale, and no later upstream change is recorded. A review date appears only when one has been recorded. This is not a safety certification.",
  },
  {
    question: "Where does a listing’s information come from?",
    answer:
      "Each published listing links to its upstream repository. Open that source to check the current code, setup instructions, and license.",
  },
];

export function HomeFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="home-faq-list">
      {questions.map(({ question, answer }, index) => {
        const isOpen = openIndex === index;
        const questionId = `home-faq-question-${index}`;
        const answerId = `home-faq-answer-${index}`;

        return (
          <section className={`home-faq-item${isOpen ? " is-open" : ""}`} key={question}>
            <h3 className="home-faq-question" id={questionId}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{question}</span>
                <span className="home-faq-chevron" aria-hidden="true" />
              </button>
            </h3>
            <div className="home-faq-answer" id={answerId} aria-labelledby={questionId} aria-hidden={!isOpen}>
              <div className="home-faq-answer-inner">
                <p>{answer}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
