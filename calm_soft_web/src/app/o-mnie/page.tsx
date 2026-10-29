import type { Metadata } from "next";
import { stripEmphasis } from "@/components/ui/RichText";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { site } from "@/content/site";

const title = "O mnie — calm_soft";
const description = stripEmphasis(site.about.long.join(" "));

// metadataBase is inherited from layout.tsx — do not redeclare it here.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/o-mnie/" },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/o-mnie/",
  },
};

// Server component — no 'use client', no providers (the page needs no inquiry/modal state).
// Nav/Footer come from layout.tsx automatically. The page closes with its own <Contact />
// section (id="contact"), which carries the page's only Calendly CTA.
export default function AboutPage() {
  return (
    <>
      <div
        data-background-family="utility"
        className="reveal-group mx-auto max-w-[1200px] px-6 pt-[72px] pb-[32px] min-[900px]:pt-[110px] min-[900px]:pb-[40px]"
      >
        <About variant="long" hideCta />
      </div>

      {/* Contact renders as a sibling AFTER the container above, not nested inside it — it needs
          the full page width and its own radial glow, which the max-w-[1200px] container would
          clip. No InquiryProvider/ModalProvider here: this page has no CardActions or modals to
          wire up. */}
      <Contact />
    </>
  );
}
