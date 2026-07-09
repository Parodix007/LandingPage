import type { ProcessStep } from "./types";

export const steps: ProcessStep[] = [
  {
    number: "00",
    title: "Discover",
    badge: "Billed separately",
    description:
      "One room, one goal. A brainstorming workshop built on Domain-Driven Design, where we map your domain, its events and its users together — and define what the product should actually do before anyone writes code.",
  },
  {
    number: "01",
    title: "Design",
    description:
      "The findings become a roadmap: an MVP-first plan of what ships now, what waits and why. Agile by design — sized in increments you can see, measure and re-prioritise.",
  },
  {
    number: "02",
    title: "Build",
    description:
      "We build exactly what we agreed in the workshops — iteration by iteration, with a working demo at the end of each. The roadmap turns into product, not into status reports.",
  },
  {
    number: "03",
    title: "Handover",
    description:
      "The project closes on your terms: take the product and full ownership, or continue with a maintenance and growth agreement. It ends with a handshake, never a lock-in.",
  },
];
