import { FilledPill } from "@/components/ui/FilledPill";
import { NavMobileMenu, type NavLink } from "./NavMobileMenu";

// Nav lives outside the providers in layout.tsx — its CTA is a plain anchor to /#contact
// (SPEC §6.1). Structural nav labels/hrefs are not part of the content model (site.ts only
// carries footerLinks, per SPEC §5.2) so they're declared here.
const NAV_LINKS: NavLink[] = [
  { href: "/#services", label: "Services" },
  { href: "/#cases", label: "Case studies" },
  { href: "/#demo", label: "Demos" },
  { href: "/#process", label: "Process" },
  { href: "/pricing/", label: "Pricing" },
];

export function Nav() {
  return (
    <div className="sticky top-0 z-50 border-b border-border-08 bg-black/65 backdrop-blur-[20px] backdrop-saturate-[1.8]">
      <div className="mx-auto flex h-16 max-w-[1024px] items-center justify-between px-6">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- native anchor scroll
            always reaches #top; App-Router <Link> hash-scroll is unreliable from some sections
            (the reported bug) — see impl-spec-followup.md §1. */}
        <a
          href="/#top"
          aria-label="calm_soft — back to top"
          className="font-mono text-[26px] font-semibold tracking-[-0.02em] text-ink"
        >
          calm
          <span className="animate-[blink_1.2s_step-end_infinite] text-accent">_</span>
          soft
        </a>
        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[15px] text-ink-85 hover:text-white">
              {link.label}
            </a>
          ))}
          <FilledPill size="nav" as="a" href="/#contact">
            Start a project
          </FilledPill>
        </div>
        <NavMobileMenu links={NAV_LINKS} />
      </div>
    </div>
  );
}
