import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GhostPill } from "./GhostPill";
import { FilledPill } from "./FilledPill";
import { Chip } from "./Chip";
import { SectionHeading } from "./SectionHeading";

describe("GhostPill", () => {
  it("renders a button with the label", () => {
    render(
      <GhostPill tone="accent" onClick={() => {}}>
        Learn more ›
      </GhostPill>,
    );
    expect(screen.getByRole("button", { name: "Learn more ›" })).toBeInTheDocument();
  });

  it("adds the pill-stretched class when stretched", () => {
    render(
      <GhostPill tone="accent" stretched onClick={() => {}}>
        Learn more ›
      </GhostPill>,
    );
    expect(screen.getByRole("button", { name: "Learn more ›" })).toHaveClass("pill-stretched");
  });

  it("does not add pill-stretched when not stretched", () => {
    render(
      <GhostPill tone="accent" onClick={() => {}}>
        Learn more ›
      </GhostPill>,
    );
    expect(screen.getByRole("button", { name: "Learn more ›" })).not.toHaveClass("pill-stretched");
  });

  it("renders a link with correct href when as='a'", () => {
    render(
      <GhostPill tone="gray" as="a" href="/#services">
        Explore
      </GhostPill>,
    );
    const link = screen.getByRole("link", { name: "Explore" });
    expect(link).toHaveAttribute("href", "/#services");
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <GhostPill tone="accent2" onClick={onClick}>
        Click me
      </GhostPill>,
    );
    await user.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies hit-44 when not stretched (SPEC §11.3)", () => {
    render(<GhostPill tone="accent">Read the story ›</GhostPill>);
    expect(screen.getByRole("button", { name: "Read the story ›" })).toHaveClass("hit-44");
  });

  it("omits hit-44 when stretched (whole-card hit area instead)", () => {
    render(
      <GhostPill tone="accent" stretched>
        Learn more ›
      </GhostPill>,
    );
    const el = screen.getByRole("button", { name: "Learn more ›" });
    expect(el).toHaveClass("pill-stretched");
    expect(el).not.toHaveClass("hit-44");
  });

  it("defaults to size sm (14.5px text, no negative margin)", () => {
    render(<GhostPill tone="accent">Default</GhostPill>);
    const el = screen.getByRole("button", { name: "Default" });
    expect(el).toHaveClass("text-[14.5px]");
    expect(el.className).not.toMatch(/-ml-/);
  });

  it("flush adds a negative left margin matching the size padding (sm → -ml-4)", () => {
    render(
      <GhostPill tone="accent" flush>
        Read the story ›
      </GhostPill>,
    );
    expect(screen.getByRole("button", { name: "Read the story ›" })).toHaveClass("-ml-4");
  });

  it("size lg yields 17px text and its flush margin is -ml-7", () => {
    render(
      <GhostPill tone="accent" size="lg" flush>
        See how we work ›
      </GhostPill>,
    );
    const el = screen.getByRole("button", { name: "See how we work ›" });
    expect(el).toHaveClass("text-[17px]");
    expect(el).toHaveClass("-ml-7");
  });

  it("size xs yields 13px text", () => {
    render(
      <GhostPill tone="accent" size="xs">
        Read the story ›
      </GhostPill>,
    );
    expect(screen.getByRole("button", { name: "Read the story ›" })).toHaveClass("text-[13px]");
  });

  it("tone='accent' yields the accent text class", () => {
    render(<GhostPill tone="accent">A</GhostPill>);
    expect(screen.getByRole("button", { name: "A" })).toHaveClass("text-accent");
  });

  it("tone='accent2' yields the accent2 text class", () => {
    render(<GhostPill tone="accent2">B</GhostPill>);
    expect(screen.getByRole("button", { name: "B" })).toHaveClass("text-accent2");
  });

  it("tone='gray' yields the dimmed ink text class", () => {
    render(<GhostPill tone="gray">C</GhostPill>);
    expect(screen.getByRole("button", { name: "C" })).toHaveClass("text-ink-50");
  });

  it("applies the focus-visible ring for keyboard users (SPEC §11.2)", () => {
    render(<GhostPill tone="accent">Focus me</GhostPill>);
    expect(screen.getByRole("button", { name: "Focus me" })).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-[var(--color-accent)]",
    );
  });

  it("forwards aria-label to the rendered element (per-item SR context)", () => {
    render(
      <GhostPill tone="accent" stretched aria-label="Read the story: Acme">
        Read the story ›
      </GhostPill>,
    );
    // Named by aria-label, not the visible text.
    expect(screen.getByRole("button", { name: "Read the story: Acme" })).toBeInTheDocument();
  });
});

describe("FilledPill", () => {
  it("renders a button", () => {
    render(<FilledPill onClick={() => {}}>Start a project</FilledPill>);
    expect(screen.getByRole("button", { name: "Start a project" })).toBeInTheDocument();
  });

  it("renders a link with href when as='a'", () => {
    render(
      <FilledPill as="a" href="/#contact">
        Start a project
      </FilledPill>,
    );
    const link = screen.getByRole("link", { name: "Start a project" });
    expect(link).toHaveAttribute("href", "/#contact");
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FilledPill onClick={onClick}>Start a project</FilledPill>);
    await user.click(screen.getByRole("button", { name: "Start a project" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("always applies hit-44 (SPEC §11.3)", () => {
    render(<FilledPill>Start a project</FilledPill>);
    expect(screen.getByRole("button", { name: "Start a project" })).toHaveClass("hit-44");
  });

  it("defaults to size md (15px text, 12x28 padding)", () => {
    render(<FilledPill>Start a project</FilledPill>);
    const el = screen.getByRole("button", { name: "Start a project" });
    expect(el).toHaveClass("text-[15px]");
    expect(el).toHaveClass("px-7");
  });

  it("size nav yields 15px text and 8x20 padding", () => {
    render(<FilledPill size="nav">Start a project</FilledPill>);
    const el = screen.getByRole("button", { name: "Start a project" });
    expect(el).toHaveClass("text-[15px]");
    expect(el).toHaveClass("px-5");
  });

  it("size lg yields 17px text", () => {
    render(<FilledPill size="lg">Start a project</FilledPill>);
    expect(screen.getByRole("button", { name: "Start a project" })).toHaveClass("text-[17px]");
  });

  it("applies the focus-visible ring for keyboard users (SPEC §11.2)", () => {
    render(<FilledPill>Start a project</FilledPill>);
    expect(screen.getByRole("button", { name: "Start a project" })).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-[var(--color-accent)]",
    );
  });

  it("forwards aria-label to the rendered element", () => {
    render(<FilledPill aria-label="Start your project inquiry">Start a project</FilledPill>);
    expect(
      screen.getByRole("button", { name: "Start your project inquiry" }),
    ).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip tone="accent">Web apps</Chip>);
    expect(screen.getByText("Web apps")).toBeInTheDocument();
  });

  it("renders children for accent2 tone", () => {
    render(<Chip tone="accent2">RPA</Chip>);
    expect(screen.getByText("RPA")).toBeInTheDocument();
  });

  it("tone='accent' yields the accent tint bg/border classes", () => {
    render(<Chip tone="accent">Web apps</Chip>);
    const el = screen.getByText("Web apps");
    expect(el).toHaveClass(
      "bg-[color-mix(in_oklch,var(--color-accent)_15%,transparent)]",
      "border-[color-mix(in_oklch,var(--color-accent)_32%,transparent)]",
    );
  });

  it("tone='accent2' yields the accent2 tint bg/border classes", () => {
    render(<Chip tone="accent2">RPA</Chip>);
    const el = screen.getByText("RPA");
    expect(el).toHaveClass(
      "bg-[color-mix(in_oklch,var(--color-accent2)_15%,transparent)]",
      "border-[color-mix(in_oklch,var(--color-accent2)_32%,transparent)]",
    );
  });
});

describe("SectionHeading", () => {
  it("renders an h2 with line1 and the id", () => {
    render(<SectionHeading id="services" line1="Four disciplines." />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", "services");
    expect(heading).toHaveTextContent("Four disciplines.");
  });

  it("renders line2 text when provided", () => {
    render(
      <SectionHeading id="services" line1="Four disciplines." line2="One accountable partner." />,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Four disciplines.");
    expect(heading).toHaveTextContent("One accountable partner.");
  });

  it("does not render a subline when omitted", () => {
    const { container } = render(<SectionHeading id="services" line1="Four disciplines." />);
    expect(container.textContent).toBe("Four disciplines.");
  });

  it("renders the subline when provided", () => {
    render(<SectionHeading id="cases" line1="Proof, not promises." subline="Selected work." />);
    expect(screen.getByText("Selected work.")).toBeInTheDocument();
  });
});
