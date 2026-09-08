import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { PILL_FOCUS } from "@/components/ui/pillBase";

export type CarouselArrowButtonProps = {
  direction: "previous" | "next";
  label: string;
  atBoundary: boolean;
  onClick: () => void;
};

export function CarouselArrowButton({ direction, label, atBoundary, onClick }: CarouselArrowButtonProps) {
  const Icon = direction === "previous" ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={atBoundary}
      onClick={onClick}
      className={`hit-44 ${PILL_FOCUS} inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-[background-color,border-color,opacity] duration-[250ms] hover:border-accent hover:bg-white/[0.05] ${atBoundary ? "opacity-[0.35]" : ""}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
