import { GhostPill } from "@/components/ui/GhostPill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center gap-6 px-6 text-center">
      <SectionHeading line1={site.notFound.heading} />
      <p className="text-[18px] leading-[1.55] text-ink-70">{site.notFound.text}</p>
      <GhostPill tone="accent" as="a" href="/">
        {site.notFound.back}
      </GhostPill>
    </div>
  );
}
