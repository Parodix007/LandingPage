import { FilledPill } from "@/components/ui/FilledPill";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { NavMobileMenu, type NavLink } from "./NavMobileMenu";
import { NavServicesMenu } from "./NavServicesMenu";

// Nav lives outside the providers in layout.tsx — its CTA is a plain anchor to /#contact
// (SPEC §6.1). Structural nav labels/hrefs are not part of the content model (site.ts only
// carries footerLinks, per SPEC §5.2) so they're declared here. "Usługi" is no longer a plain
// link (it triggers the services menu — desktop dropdown / mobile submenu, see below).
const NAV_LINKS: NavLink[] = [
  { href: "/#cases", label: "Realizacje" },
  { href: "/#process", label: "Proces" },
  { href: "/pricing/", label: "Cennik" },
];

const SERVICES_TRIGGER_LABEL = "Usługi";
const SERVICES_OVERVIEW_HREF = "/#services";
const SERVICES_OVERVIEW_LABEL = "Wszystkie usługi";
const SERVICES_BACK_LABEL = "Wróć";

// Adresy /uslugi/<slug>/ budowane ze Service.slug, nigdy z indeksu tablicy.
const SERVICE_ITEMS: NavLink[] = services.map((s) => ({ href: `/uslugi/${s.slug}/`, label: s.tag }));

export function Nav() {
  return (
    <div className="sticky top-0 z-50 border-b border-border-08 bg-black/65 backdrop-blur-[20px] backdrop-saturate-[1.8]">
      <div className="mx-auto flex h-16 max-w-[1024px] items-center justify-between px-6">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- native anchor scroll
            always reaches #top; App-Router <Link> hash-scroll is unreliable from some sections
            (the reported bug) — see impl-spec-followup.md §1. */}
        <a
          href="/#top"
          aria-label="calm_soft — wróć na górę"
          className="font-mono text-[26px] font-semibold tracking-[-0.02em] text-ink"
        >
          calm
          <span className="animate-[blink_1.2s_step-end_infinite] text-accent">_</span>
          soft
        </a>
        <div className="hidden items-center gap-9 md:flex">
          <NavServicesMenu
            triggerLabel={SERVICES_TRIGGER_LABEL}
            overviewHref={SERVICES_OVERVIEW_HREF}
            overviewLabel={SERVICES_OVERVIEW_LABEL}
            items={SERVICE_ITEMS}
          />
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[15px] text-ink-85 hover:text-white">
              {link.label}
            </a>
          ))}
          <FilledPill size="nav" as="a" href="/#contact">
            {site.navCta}
          </FilledPill>
        </div>
        <NavMobileMenu
          links={NAV_LINKS}
          ctaLabel={site.navCta}
          serviceMenu={{
            label: SERVICES_TRIGGER_LABEL,
            backLabel: SERVICES_BACK_LABEL,
            overviewHref: SERVICES_OVERVIEW_HREF,
            overviewLabel: SERVICES_OVERVIEW_LABEL,
            items: SERVICE_ITEMS,
          }}
        />
      </div>
    </div>
  );
}
