import { expect } from "e2e";
import { test } from "@e2e-dev/web";

test("homepage leads into the searchable agent directory", async ({ app, screen }) => {
  await app.open("/");
  await expect(screen.getByRole("heading", "Find Your Next Agent", { level: 1 })).toBeVisible();

  await screen.getByRole("link", "Browse all agents").tap();
  await expect(screen.getByRole("heading", "Search AI agent projects.", { level: 1 })).toBeVisible();
  await expect(screen.getByLabel("Search agents by name, description, or tag")).toBeVisible();
});

test("search narrows the directory to matching agents", async ({ app, screen }) => {
  await app.open("/search");
  await screen.getByLabel("Search agents by name, description, or tag").fill("aider");

  await expect(screen.getByText("1 agent")).toBeVisible();
  await expect(screen.getByRole("link", /^Aider\b/)).toBeVisible();
});

test("agent detail exposes its upstream repository and setup guide", async ({ app, screen }) => {
  await app.open("/agents/aider");
  await expect(screen.getByRole("heading", "Aider", { level: 1 })).toBeVisible();
  await expect(screen.getByRole("link", "GitHub repository")).toBeVisible();
  await expect(screen.getByRole("heading", "Setup", { level: 2 })).toBeVisible();
});

test("comparison page shows both selected projects", async ({ app, screen }) => {
  await app.open("/compare?agents=aider,claude-code");

  await expect(screen.getByRole("heading", "Compare AI agent projects.", { level: 1 })).toBeVisible();
  await expect(screen.getByRole("table")).toBeVisible();
  await expect(screen.getByRole("rowheader", "Description")).toBeVisible();
  await expect(screen.getByRole("link", "Aider")).toBeVisible();
  await expect(screen.getByRole("link", "Claude Code")).toBeVisible();
});

test("FAQ answers can be expanded and the theme can be switched", async ({ app, screen }) => {
  await app.open("/");
  const accountQuestion = screen.getByRole("button", "Is an account required?");

  await expect(accountQuestion).toBeVisible();
  await accountQuestion.tap();
  await expect(accountQuestion).toBeExpanded();
  await expect(screen.getByText("No account is needed. You can browse listings, search agents, view categories, and read setup records without signing in.")).toBeVisible();

  await screen.getByRole("button", /Switch to dark theme/).tap();
  await expect(screen.getByRole("button", /Switch to light theme/)).toBeVisible();
});

test("contact form is available without sending a live message", async ({ app, screen }) => {
  await app.open("/contact");

  await expect(screen.getByRole("heading", "Send a correction or suggest an agent.", { level: 1 })).toBeVisible();
  await expect(screen.getByRole("textbox", "Name")).toBeVisible();
  await expect(screen.getByRole("textbox", "Email")).toBeVisible();
  await expect(screen.getByRole("textbox", "What should we know?")).toBeVisible();
  await expect(screen.getByRole("button", "Send contribution")).toBeEnabled();
  await expect(screen.getByRole("link", "info@agentnine.pro")).toBeVisible();
});

test("public information pages render a primary heading", async ({ app, screen }) => {
  for (const path of [
    "/about",
    "/categories",
    "/faq",
    "/methodology",
    "/join",
    "/privacy",
    "/cookies",
    "/terms",
    "/refunds",
  ]) {
    await app.open(path);
    await expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("narrow screens can open the site navigation", async ({ app, browser, screen }) => {
  await browser.setViewport({ width: 390, height: 844 });
  await app.open("/");

  await screen.getByRole("button", "Open navigation menu").tap();
  await expect(screen.getByRole("navigation", "Main navigation")).toBeVisible();
  await expect(screen.getByRole("link", "Browse agents")).toBeVisible();
});
