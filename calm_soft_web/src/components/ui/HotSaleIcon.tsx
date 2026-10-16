import Image from "next/image";

type HotSaleIconProps = {
  className?: string;
};

export function HotSaleIcon({ className }: HotSaleIconProps) {
  return (
    <Image
      src="/icons/hot-sale-1685230.png"
      width={64}
      height={64}
      unoptimized
      alt=""
      aria-hidden
      draggable={false}
      className={["relative z-[1] pointer-events-none", className].filter(Boolean).join(" ")}
    />
  );
}
