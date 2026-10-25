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
      "AgentNine's five-step setup verification checklist has been completed for the listing. This is separate from the Needs review status, which can reflect repository freshness or setup documentation. Verification is not a security audit or certification.",
  },
  {
    question: "Where does a listing’s information come from?",
    answer:
      "Each published listing links to its project repository. Open that source to check the current code, setup instructions, and license.",
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
