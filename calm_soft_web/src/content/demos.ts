import type { Demo } from "./types";

// Approved marketing copy for the five clickable clinic mockups shipped as static assets under
// public/demo/<slug>/ (never modified — verbatim-assets contract, see docs/superpowers/specs/
// 2026-07-20-demo-section-design.md). Screenshots live at /demo-shots/<slug>.webp. Order: the
// three patient-facing sites first, then the two staff consoles. Featured 3 (homepage) come from
// site.featuredDemoSlugs, resolved via getDemoBySlug (never index).
export const demos: Demo[] = [
  {
    slug: "merdi",
    name: "Merdi",
    tag: "Veterinary clinic",
    description:
      "The whole clinic, made pet-owner-friendly: services with upfront pricing, the team, a five-step visit booking and an account with a health profile for every pet.",
    tagline: "Veterinary care that understands pet owners.",
    detail:
      "Merdi puts a modern face on a veterinary practice: transparent service pricing, a warm team page, and a five-step booking flow that turns “call during opening hours” into a 30-second task. Every client gets an account with a health profile for each pet — history, visits and reminders in one place.",
    features: [
      "Services with upfront pricing",
      "Meet-the-team page",
      "Five-step visit booking",
      "Client account",
      "A profile for every pet",
    ],
    shot: "/demo-shots/merdi.webp",
    shotAlt: "The Merdi veterinary-clinic website, home page",
    href: "/demo/merdi/index.html",
  },
  {
    slug: "vitalab",
    name: "VitaLab",
    tag: "Clinic + laboratory",
    description:
      "A clinic and its own lab in one place: order lab tests in five steps, book doctor visits, compare tests and packages, find collection points and track it all from a patient account.",
    tagline: "Lab tests and doctor visits, one calm flow.",
    detail:
      "VitaLab merges two journeys most clinics keep apart: booking a doctor and ordering lab work. Patients choose tests or bundled packages in five guided steps, pick a collection point, book visits, and follow results from one account — while the clinic keeps a single source of truth.",
    features: [
      "Five-step lab-test ordering",
      "Five-step visit booking",
      "Test & package details",
      "Collection-point finder",
      "Patient account with results",
    ],
    shot: "/demo-shots/vitalab.webp",
    shotAlt: "The VitaLab clinic-and-laboratory website, home page",
    href: "/demo/vitalab/index.html",
  },
  {
    slug: "primavita",
    name: "Primavita",
    tag: "Medical clinic",
    description:
      "A private medical clinic online: search 36 doctors across 12 specialties, scan a transparent price list, pick a care package and book in five steps — results waiting in the patient panel.",
    tagline: "Book a specialist without calling or waiting.",
    detail:
      "Primavita is the private-clinic experience patients actually want: a searchable directory of 36 doctors across 12 specialties, an at-a-glance price list, care packages, and a five-step booking flow that skips the phone queue. After the visit, results and history live in a clean patient panel.",
    features: [
      "36 doctors, 12 specialties",
      "Searchable price list",
      "Care packages",
      "Five-step booking",
      "Patient panel with results",
    ],
    shot: "/demo-shots/primavita.webp",
    shotAlt: "The Primavita medical-clinic website, home page",
    href: "/demo/primavita/index.html",
  },
  {
    slug: "healthlab",
    name: "HealthLab",
    tag: "Lab back-office",
    description:
      "The console a diagnostic lab runs on: manage patients, take in test orders, enter and release results, and move every sample through one clear workflow — no spreadsheets.",
    tagline: "The back office that runs the lab.",
    detail:
      "HealthLab is the staff side of a diagnostic lab: one console for patient records, incoming test orders, results entry and controlled release. It replaces the spreadsheet-and-email choreography with a single workflow, so technicians and managers always know what’s pending, what’s ready, and what’s been sent.",
    features: [
      "Patient management",
      "Test-order intake",
      "Results entry & release",
      "Sample workflow",
      "Staff dashboard",
    ],
    shot: "/demo-shots/healthlab.webp",
    shotAlt: "The HealthLab laboratory back-office console",
    href: "/demo/healthlab/index.html",
    desktopOnly: true,
  },
  {
    slug: "merdi-panel",
    name: "Merdi Panel",
    tag: "Vet staff panel",
    description:
      "The team’s side of Merdi: an appointment calendar, daily schedule and staff rota, patient and pet records, and fast booking — everything the front desk and vets need in one panel.",
    tagline: "Run the whole clinic day from one calendar.",
    detail:
      "Behind Merdi’s friendly booking page sits the panel the staff live in: a shared appointment calendar, daily schedule and rota, and quick access to patient and pet records. Reception books and reschedules in seconds; vets see their day at a glance — no double-bookings, no paper diary.",
    features: [
      "Appointment calendar",
      "Daily schedule & rota",
      "Patient & pet records",
      "Booking & rescheduling",
      "Front-desk dashboard",
    ],
    shot: "/demo-shots/merdi-panel.webp",
    shotAlt: "The Merdi veterinary-clinic staff panel",
    href: "/demo/merdi-panel/index.html",
    desktopOnly: true,
  },
];

export const getDemoBySlug = (slug: string) => demos.find((d) => d.slug === slug);
