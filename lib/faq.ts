export type FaqQuestion = {
  id: string;
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  questions: FaqQuestion[];
};

export const faqGroups: FaqGroup[] = [
  {
    id: "about-agentnine",
    title: "About AgentNine",
    questions: [
      {
        id: "how-agents-are-selected",
        question: "How are agents selected?",
        answer:
          "We select projects with a public source repository and a documented setup path. Listings show checklist evidence and a review date when those details have been recorded.",
      },
      {
        id: "submitting-an-agent",
        question: "Can I submit an agent?",
        answer:
          "Contact us with the repository and why it is useful. We manually review submissions and do not publish open submissions automatically.",
      },
    ],
  },
  {
    id: "verification-and-setup",
    title: "Verification and setup",
    questions: [
      {
        id: "security-audit",
        question: "Is AgentNine a security audit?",
        answer:
          "No. It is a directory with setup and access information, not a security certification. Read source code, inspect permissions, pin versions, and use a sandbox for unfamiliar tools.",
      },
      {
        id: "ollama",
        question: "Why do some agents mention Ollama?",
        answer:
          "A locally run model can keep inference prompts from going to a hosted model provider. An agent may still contact other services through tools or its configuration, so check the listing's access details and the upstream documentation.",
      },
      {
        id: "verified-meaning",
        question: "What does verified mean?",
        answer:
          "It means we completed the checklist shown on the listing at the displayed date. Projects change, so check the upstream repository before you run anything.",
      },
    ],
  },
];
