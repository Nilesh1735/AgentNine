"use client";

import { useEffect, useState } from "react";

export function AgentPageNavigation() {
  const [activeSection, setActiveSection] = useState("quick-read");

  useEffect(() => {
    const trackedSections = [
      { element: document.getElementById("quick-read"), activeId: "quick-read" },
      { element: document.getElementById("setup"), activeId: "setup" },
      { element: document.getElementById("report"), activeId: "report" },
      { element: document.querySelector(".feedback-section"), activeId: "report" },
    ].filter((section): section is { element: HTMLElement; activeId: string } => (
      section.element instanceof HTMLElement
    ));

    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const activeLine = Math.min(280, Math.max(120, window.innerHeight * 0.3));
        const passedSections = trackedSections.filter(
          ({ element }) => element.getBoundingClientRect().top <= activeLine,
        );
        const currentSection = passedSections[passedSections.length - 1] ?? trackedSections[0];
        if (currentSection) setActiveSection(currentSection.activeId);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <nav className="agent-toc" aria-label="On this page">
      <strong>Guide</strong>
      <a href="#quick-read" aria-current={activeSection === "quick-read" ? "location" : undefined}>Verification</a>
      <a href="#setup" aria-current={activeSection === "setup" ? "location" : undefined}>Setup</a>
      <a href="#report" aria-current={activeSection === "report" ? "location" : undefined}>Feedback</a>
    </nav>
  );
}
