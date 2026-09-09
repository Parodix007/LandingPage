import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichText, stripEmphasis } from "./RichText";

describe("RichText", () => {
  it("renders text without markers in full, with no <strong>", () => {
    const { container } = render(<RichText>{"Plain text with no markers."}</RichText>);
    expect(screen.getByText("Plain text with no markers.")).toBeInTheDocument();
    expect(container.querySelectorAll("strong")).toHaveLength(0);
  });

  it("wraps a single emphasised phrase in <strong>, leaving the rest as text", () => {
    const { container } = render(<RichText>{"Before **highlighted** after"}</RichText>);
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(1);
    expect(strongs[0]).toHaveTextContent("highlighted");
    expect(container.textContent).toBe("Before highlighted after");
  });

  it("renders multiple emphasised phrases, in order", () => {
    const { container } = render(<RichText>{"**one** and **two** and **three**"}</RichText>);
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(3);
    expect(Array.from(strongs).map((el) => el.textContent)).toEqual(["one", "two", "three"]);
    expect(container.textContent).toBe("one and two and three");
  });

  it("renders an unpaired ** literally and creates no <strong>", () => {
    const { container } = render(<RichText>{"Odd marker ** without a pair"}</RichText>);
    expect(container.querySelectorAll("strong")).toHaveLength(0);
    expect(container.textContent).toBe("Odd marker ** without a pair");
  });

  it("does not throw on an empty string", () => {
    const { container } = render(<RichText>{""}</RichText>);
    expect(container.textContent).toBe("");
  });

  it("emphasis carries text-accent and never an underline class", () => {
    const { container } = render(<RichText>{"**word**"}</RichText>);
    const strong = container.querySelector("strong");
    expect(strong).toHaveClass("font-semibold", "text-accent");
    expect(strong?.className).not.toMatch(/underline/);
  });
});

describe("RichText brand token", () => {
  it("renders calm_soft as a font-mono span containing a text-accent underscore", () => {
    const { container } = render(<RichText>{"calm_soft"}</RichText>);
    const brand = container.querySelector("span.font-mono");
    expect(brand).not.toBeNull();
    const underscore = brand?.querySelector("span.text-accent");
    expect(underscore).not.toBeNull();
    expect(underscore).toHaveTextContent("_");
    expect(brand?.textContent).toBe("calm_soft");
  });

  it("does not create a font-mono span when the token is absent", () => {
    const { container } = render(<RichText>{"no brand mention here"}</RichText>);
    expect(container.querySelectorAll("span.font-mono")).toHaveLength(0);
  });

  it("styles calm_soft inside emphasis too, nested in <strong>", () => {
    const { container } = render(<RichText>{"**calm_soft** x"}</RichText>);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.querySelector("span.font-mono")).not.toBeNull();
    expect(container.textContent).toBe("calm_soft x");
  });

  it("renders two separate font-mono spans for two occurrences", () => {
    const { container } = render(<RichText>{"calm_soft and calm_soft"}</RichText>);
    expect(container.querySelectorAll("span.font-mono")).toHaveLength(2);
  });

  it("stripEmphasis leaves calm_soft as plain text, unchanged behavior", () => {
    expect(stripEmphasis("**calm_soft**")).toBe("calm_soft");
  });
});

describe("stripEmphasis", () => {
  it("removes markers, leaving the plain text", () => {
    expect(stripEmphasis("a **b** c")).toBe("a b c");
  });

  it("removes multiple marker pairs", () => {
    expect(stripEmphasis("**start** middle **end**")).toBe("start middle end");
  });

  it("is a no-op on text without markers", () => {
    expect(stripEmphasis("no markers here")).toBe("no markers here");
  });

  it("is a no-op on an empty string", () => {
    expect(stripEmphasis("")).toBe("");
  });

  it("leaves an unpaired ** untouched", () => {
    expect(stripEmphasis("odd ** marker")).toBe("odd ** marker");
  });
});
