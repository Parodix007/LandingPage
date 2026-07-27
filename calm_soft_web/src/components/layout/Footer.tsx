import { site } from "@/content/site";
import { getGaId } from "@/lib/analytics";
import { CookieSettingsButton } from "@/components/interactive/CookieSettingsButton";

export function Footer() {
  const gaId = getGaId();
  return (
    <footer className="border-t border-border-08">
      <div className="mx-auto flex max-w-[1024px] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[18px] font-semibold tracking-[-0.02em] text-ink">
            calm<span className="text-accent">_</span>soft
          </span>
          <span className="text-[12px] text-ink-50">© 2026 · Wszystkie prawa zastrzeżone.</span>
          {gaId ? <CookieSettingsButton /> : null}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {site.footerLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[12px] text-ink-50 hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
