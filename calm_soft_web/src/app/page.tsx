import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { Contact } from "@/components/sections/Contact";

// SERVER component (SPEC §6.1) — providers are dedicated 'use client' files taking these
// server-rendered sections as children; never put 'use client' on this file.
//
// 2026-07-31 service-pages-restructure design: the mockup-showcase section is retired — its
// content now lives on /uslugi/<slug>/ via SolutionLineBlock. Section order: Hero → Services →
// CaseStudies → Process → Contact.
export default function Page() {
  return (
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <Hero />
        <Services />
        <CaseStudies />
        <Process />
        <Contact />
      </ModalProvider>
    </InquiryProvider>
  );
}
