import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cases } from "@/content/cases";
import { demos, getDemoBySlug } from "@/content/demos";
import { getServiceForLine } from "@/content/services";
import { allSolutionLines, solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { stripEmphasis } from "@/components/ui/RichText";
import type { SolutionLine } from "@/content/types";
import { SolutionLineBlock } from "./SolutionLineBlock";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function getLine(slug: string): SolutionLine {
  const line = allSolutionLines.find((l) => l.slug === slug);
  if (!line) throw new Error(`fixture solution line "${slug}" not found`);
  return line;
}

const vet = getLine("weterynaria");
const clinics = getLine("kliniki-laboratoria");
const migrations = getLine("migracje");
const integrations = getLine("integracje");

function renderLine(line: SolutionLine) {
  return render(
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <SolutionLineBlock
          line={line}
          clickLabel={solutions.page.clickLabel}
          audienceLabel={solutions.page.audienceLabel}
          serviceLabel={solutions.page.serviceLabel}
          asIsLabel={solutions.page.paths.asIs.title}
          customLabel={solutions.page.paths.custom.title}
        />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("SolutionLineBlock (2026-07-26 solutions restructure design)", () => {
  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)("renders %s's kicker, headline and every intro paragraph", (_name, line) => {
    renderLine(line);

    expect(screen.getByText(line.kicker)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: line.headline })).toBeInTheDocument();
    for (const paragraph of line.intro) {
      const plain = stripEmphasis(paragraph);
      expect(
        screen.getByText((_, el) => el?.tagName === "P" && el.textContent === plain),
      ).toBeInTheDocument();
    }
  });

  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)("renders a card with visible item text for every %s item", (_name, line) => {
    renderLine(line);

    for (const item of line.items) {
      const plain = stripEmphasis(item.text);
      expect(
        screen.getByText((_, el) => el?.tagName === "P" && el.textContent === plain),
      ).toBeInTheDocument();
    }
  });

  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)(
    "each %s card exposes a details button and an external link to its own mockup",
    (_name, line) => {
      renderLine(line);

      for (const item of line.items) {
        const demo = getDemoBySlug(item.demoSlug)!;

        expect(
          screen.getByRole("button", { name: `${site.sections.demos.detailCta} ${demo.name}` }),
        ).toBeInTheDocument();

        const link = screen.getByRole("link", { name: `${item.openCta} ${demo.name}` });
        expect(link).toHaveAttribute("href", demo.href);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
      }
    },
  );

  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)("gives the %s <article> an id equal to the line's slug", (_name, line) => {
    const { container } = renderLine(line);
    expect(container.querySelector(`#${line.slug}`)).toBeInTheDocument();
  });

  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)("renders the audience label and the %s audience text", (_name, line) => {
    renderLine(line);

    expect(screen.getByText(solutions.page.audienceLabel)).toBeInTheDocument();
    const plainAudience = stripEmphasis(line.audience);
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" &&
          el.textContent === `${solutions.page.audienceLabel} ${plainAudience}`,
      ),
    ).toBeInTheDocument();
  });

  it("renders kliniki-laboratoria's caveat label and body", () => {
    expect(clinics.caveat).toBeDefined();
    renderLine(clinics);

    expect(screen.getByText(clinics.caveat!.label)).toBeInTheDocument();
    expect(screen.getByText(clinics.caveat!.body)).toBeInTheDocument();
  });

  it("renders no caveat block for weterynaria", () => {
    expect(vet.caveat).toBeUndefined();
    const { container } = renderLine(vet);

    expect(container.querySelector("aside")).not.toBeInTheDocument();
  });

  it("renders no proof block for migracje (proof removed, 2026-07-26 crosslink design)", () => {
    expect(migrations.proof).toBeUndefined();
    const { container } = renderLine(migrations);

    // The proof markup itself stays in the component, dormant — same state `line.price` is
    // already in — this line's content simply no longer supplies a `proof` object, so the
    // /work/ CTA that only the proof block renders never appears for migracje.
    expect(container.querySelector('a[href="/work/"]')).not.toBeInTheDocument();
  });

  it("never renders a price block while every line's price is still undefined", () => {
    for (const line of allSolutionLines) {
      expect(line.price).toBeUndefined();
    }
    renderLine(vet);

    expect(screen.queryByText(solutions.page.paths.asIs.title)).not.toBeInTheDocument();
    expect(screen.queryByText(solutions.page.paths.custom.title)).not.toBeInTheDocument();
  });

  it("renders the service label and a link to /?usluga=core#services for integracje (2026-07-26 crosslink design)", () => {
    const service = getServiceForLine(integrations.slug)!;
    expect(service.id).toBe("core");
    renderLine(integrations);

    expect(screen.getByText(solutions.page.serviceLabel)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: service.tag });
    expect(link).toHaveAttribute("href", `/?usluga=${service.id}#services`);
  });

  it.each([
    ["weterynaria", vet],
    ["kliniki-laboratoria", clinics],
  ] as const)(
    "shows the desktop-only note exactly where a %s item's demo has desktopOnly set",
    (_name, line) => {
      renderLine(line);

      const expectedCount = line.items.filter(
        (item) => getDemoBySlug(item.demoSlug)?.desktopOnly,
      ).length;

      if (expectedCount > 0) {
        expect(screen.getAllByText(site.sections.demos.desktopNote)).toHaveLength(expectedCount);
      } else {
        expect(screen.queryByText(site.sections.demos.desktopNote)).not.toBeInTheDocument();
      }
    },
  );
});
