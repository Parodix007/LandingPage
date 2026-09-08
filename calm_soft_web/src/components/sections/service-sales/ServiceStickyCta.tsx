"use client";

import { useEffect, useState } from "react";
import { FilledPill } from "@/components/ui/FilledPill";

export function ServiceStickyCta({ href, label }: { href: string; label: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const target = document.getElementById("contact");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.05 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <FilledPill size="lg" as="a" href={href} aria-hidden={!visible} tabIndex={visible ? 0 : -1} className={`fixed inset-x-4 bottom-4 z-[60] min-h-11 text-center shadow-lg min-[900px]:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>{label}</FilledPill>;
}
