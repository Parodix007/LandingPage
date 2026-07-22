import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { CaseStudies } from "@/components/sections/CaseStudies";
import { Demos } from "@/components/sections/Demos";
import { Contact } from "@/components/sections/Contact";

// SERVER component (SPEC §6.1) — providers are dedicated 'use client' files taking these
// server-rendered sections as children; never put 'use client' on this file.
export default function Page() {
  return (
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <Hero />
        <Services />
        <CaseStudies />
        <Demos />
        <Process />
        <Contact />
      </ModalProvider>
    </InquiryProvider>
  );
}
