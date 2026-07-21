import type { ReactNode } from "react";
import { WarningIcon } from "./icons";

// Shared warning-treatment primitive (SPEC 2026-07-21 desktop-only-demo-note-design "Warning
// treatment"). Used at every render site that flags a desktop-only demo panel, so the warning
// looks identical everywhere. Icon + amber text, no tinted background/border. The icon is
// purely decorative (aria-hidden) — the sentence passed as children carries the meaning, so
// there is no sr-only "Warning:" prefix and no role="alert"/"note": this is static page content,
// not a live announcement. `children` only — no size/colour props (YAGNI).
export function WarningNote({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2 text-[13px] leading-[1.45] text-warn">
      <WarningIcon className="mt-[1px] h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
