import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechStack } from "./TechStack";

const NAMES = ["Angular", "React", "Next.js", "Nest.js", "Fastify", "Spring Boot", "MySQL", "PostgreSQL"];

describe("TechStack", () => {
  it("renders all 8 technology marks as accessible images", () => {
    render(<TechStack />);

    for (const name of NAMES) {
      expect(screen.getByRole("img", { name })).toBeInTheDocument();
    }
  });
});
